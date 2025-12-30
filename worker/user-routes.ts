import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Document, User, AdminStats, SystemLog, ClientError } from "@shared/types";
import { SignJWT, jwtVerify } from 'jose';
const JWT_SECRET = new TextEncoder().encode('lumiere-super-secret-key-replace-in-prod');
const ACCESS_TOKEN_EXP = '15m';
interface RateLimitState {
  count: number;
  reset: number;
}
// Middlewares & Helpers
const createTokens = async (user: User) => {
  const accessToken = await new SignJWT({ sub: user.id, role: user.role, rv: user.refreshVersion || 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXP)
    .sign(JWT_SECRET);
  const refreshToken = user.id; // Simplified for demo; usually a UUID mapped to session in DO
  return { accessToken, refreshToken };
};
const verifyAuth = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub as string;
    const userInst = new UserEntity(c.env, userId);
    if (!await userInst.exists()) return null;
    const user = await userInst.getState();
    if (user.isBanned) return null;
    return user;
  } catch (e) {
    return null;
  }
};
const rateLimit = async (c: any, next: any) => {
  const ip = c.req.header('CF-Connecting-IP') || 'anon';
  const key = `rl:${ip}`;
  const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName(key));
  const doc = await stub.getDoc(key) as {data?: RateLimitState, v?: number} | null;
  const now = Date.now();
  const data = doc?.data as RateLimitState | undefined;
  const state = (data && (now - data.reset) < 60000) ? data : { count: 0, reset: now };
  if (state.count > 100) return c.json({ success: false, error: 'Rate limit exceeded' }, 429);
  await stub.casPut(key, doc?.v ?? 0, { count: state.count + 1, reset: state.reset });
  await next();
};
const logEvent = async (env: Env, log: Omit<SystemLog, 'id' | 'timestamp'>) => {
  const id = crypto.randomUUID();
  const entry: SystemLog = { ...log, id, timestamp: Date.now() };
  const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName('sys-logs'));
  const current = await stub.getDoc("logs") as {data: SystemLog[], v?: number} | null;
  const logsArr = [entry, ...(current?.data || [])].slice(0,100);
  await stub.casPut("logs", current?.v ?? 0, logsArr);
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/*', rateLimit);
  // AUTH
  app.post('/api/auth/register', async (c) => {
    const { name, email, password } = await c.req.json();
    if (!email || !password) return bad(c, 'Email and password required');
    const existing = await UserEntity.findByEmail(c.env, email);
    if (existing) return bad(c, 'Email already in use');
    const userId = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await UserEntity.hashPassword(password, salt);
    const isFirstUser = email.toLowerCase() === 'admin@lumiere.studio' || (await new UserEntity(c.env, 'sys-count').exists() === false);
    const user = await UserEntity.create(c.env, {
      id: userId,
      name: name || email.split('@')[0],
      email,
      passwordHash,
      salt,
      role: isFirstUser ? 'admin' : 'user',
      createdAt: Date.now(),
      subscriptionStatus: 'free',
      isBanned: false,
      refreshVersion: 0
    });
    const { accessToken, refreshToken } = await createTokens(user);
    await logEvent(c.env, { level: 'info', event: 'User registered', userId: user.id });
    return ok(c, { user, token: accessToken, refreshToken });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    const user = await UserEntity.findByEmail(c.env, email);
    if (!user || user.isBanned) return bad(c, 'Invalid credentials');
    const computedHash = await UserEntity.hashPassword(password, user.salt!);
    if (computedHash !== user.passwordHash) return bad(c, 'Invalid credentials');
    const { accessToken, refreshToken } = await createTokens(user);
    await logEvent(c.env, { level: 'info', event: 'User login', userId: user.id });
    return ok(c, { user, token: accessToken, refreshToken });
  });
  app.post('/api/auth/refresh', async (c) => {
    const { refreshToken: rToken } = await c.req.json();
    if (!rToken) return bad(c, 'Token required');
    const userInst = new UserEntity(c.env, rToken);
    if (!await userInst.exists()) return bad(c, 'Invalid session');
    const user = await userInst.getState();
    const { accessToken, refreshToken } = await createTokens(user);
    return ok(c, { user, token: accessToken, refreshToken });
  });
  // ADMIN
  app.get('/api/admin/stats', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const usersResponse = await UserEntity.list(c.env, null, 1000) as {items: User[], next?: string};
    const docsResponse = await DocumentEntity.list(c.env, null, 1000) as {items: Document[], next?: string};
    const users = usersResponse.items;
    const docs = docsResponse.items;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000);
    let dailyStats: {date: string, docs: number, users: number}[] = [];
    let curDate = new Date(thirtyDaysAgo);
    while(curDate <= now){
      const dateStr = curDate.toISOString().slice(0,10);
      const dayDocs = docs.filter((d: Document)=> new Date(d.updatedAt || 0).toISOString().slice(0,10) === dateStr).length;
      const dayDau = users.filter((u: User)=> new Date(u.createdAt || 0).toISOString().slice(0,10) === dateStr).length;
      dailyStats.push({date: dateStr, docs: dayDocs, users: dayDau});
      curDate.setDate(curDate.getDate() + 1);
    }
    const stats: AdminStats = {
      totalUsers: users.length,
      totalDocs: docs.length,
      activeShares: docs.filter(d => d.isPublic).length,
      storageUsed: JSON.stringify(docs).length,
      bannedUsers: users.filter(u => u.isBanned).length,
      totalStorageBytes: JSON.stringify(docs).length,
      recentErrors: 0,
      dailyStats: dailyStats.reverse()
    };
    return ok(c, stats);
  });
  app.get('/api/admin/users', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const usersResponse = await UserEntity.list(c.env) as {items: User[]};
    return ok(c, usersResponse);
  });
  app.post('/api/admin/users/:id/ban', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const targetId = c.req.param('id');
    const userInst = new UserEntity(c.env, targetId);
    const user = await userInst.getState();
    const nextBanned = !user.isBanned;
    await userInst.patch({ isBanned: nextBanned, refreshVersion: (user.refreshVersion || 0) + 1 });
    await logEvent(c.env, { level: 'security', event: `User ${nextBanned ? 'banned' : 'unbanned'}`, userId: targetId });
    return ok(c, { isBanned: nextBanned });
  });
  app.get('/api/admin/logs', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName('sys-logs'));
    const logs = await stub.getDoc("logs") as {data: SystemLog[], v?: number} | null;
    return ok(c, logs?.data || []);
  });

  app.post('/api/client-errors', async (c) => {
    const payload = await c.req.json<any>();
    const error: ClientError = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message: payload.message || 'Unknown error',
      category: payload.category || 'unknown',
      url: payload.url || '',
      level: payload.level || 'error',
      stackTrace: payload.stack || '',
      parsedStack: payload.parsedStack,
      componentStack: payload.componentStack,
      source: payload.source,
      lineno: payload.lineno,
      colno: payload.colno
    };
    const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName('client-logs'));
    const current = await stub.getDoc('errors') as {data: ClientError[], v?: number} | null;
    const errors = [error, ...(current?.data || [])].slice(0, 1000);
    await stub.casPut('errors', current?.v ?? 0, errors);
    return ok(c, {success: true});
  });

  app.get('/api/admin/client-errors', async (c) => {
    const admin = await verifyAuth(c);
    if (!admin?.role || admin.role !== 'admin') return bad(c, 'Unauthorized');
    const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName('client-logs'));
    const res = await stub.getDoc('errors') as {data: ClientError[], v?: number} | null || {data: []};
    return ok(c, res.data);
  });

  // ADMIN DOCUMENTS
  app.get('/api/admin/documents', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const docsResponse = await DocumentEntity.list(c.env, null, 1000) as {items: Document[]};
    return ok(c, docsResponse);
  });

  app.get('/api/admin/shares', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const allDocsResponse = await DocumentEntity.list(c.env, null, 1000) as any;
    return ok(c, {items: allDocsResponse.items.filter((d:Document)=>d.isPublic)});
  });

  app.post('/api/admin/documents/:id/revoke', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    const doc = await entity.getState();
    if (doc.isPublic) await entity.mutate(s => ({...s, isPublic: false}));
    return ok(c, {success: true});
  });

  app.post('/api/admin/documents/:id/delete', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    await DocumentEntity.delete(c.env, id);
    return ok(c, {success: true});
  });

  app.post('/api/admin/users/:id/delete', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    await UserEntity.delete(c.env, id);
    return ok(c, {success: true});
  });

  app.post('/api/admin/users/:id/email', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const {email} = await c.req.json();
    if (!email) return bad(c, 'email required');
    await new UserEntity(c.env, id).patch({email});
    return ok(c, {success: true});
  });

  app.get('/api/admin/billing', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const uList = await UserEntity.list(c.env, null, 1000) as any;
    const proCount = uList.items.filter((u:User)=>u.subscriptionStatus==='pro').length;
    const mockUsers = uList.items.map((u:User)=>({ ...u, mockNextBill: new Date(Date.now() + 30*86400000).toISOString().slice(0,10), mockMonthlyRevenue: u.subscriptionStatus==='pro' ? 10 : 0 }));
    return ok(c, {users: mockUsers, totalRevenue: proCount * 10, proUsers: proCount});
  });
  // DOCUMENTS
  app.get('/api/documents', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    return ok(c, await DocumentEntity.listForUser(c.env, user.id));
  });
  app.post('/api/documents', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const { title, content } = await c.req.json();
    const doc: Document = {
      id: crypto.randomUUID(),
      title: title || "Untitled Document",
      content: content || "",
      updatedAt: Date.now(),
      userId: user.id,
      version: 1,
      isPublic: false
    };
    return ok(c, await DocumentEntity.createForUser(c.env, doc));
  });
  app.get('/api/shared/documents/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    const state = await entity.getState();
    if (!state.isPublic) return bad(c, 'Private document');
    await entity.mutate(s => ({ ...s, viewCount: (s.viewCount || 0) + 1 }));
    return ok(c, state);
  });
  app.put('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const updates = await c.req.json();
    const entity = new DocumentEntity(c.env, id);
    const old = await entity.getState();
    if (old.userId !== user.id && user.role !== 'admin') return bad(c, 'Forbidden');
    const updated = { ...old, ...updates, updatedAt: Date.now(), version: old.version + 1 };
    await entity.save(updated);
    return ok(c, updated);
  });
  app.delete('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    const state = await entity.getState();
    if (state.userId !== user.id && user.role !== 'admin') return bad(c, 'Forbidden');
    await DocumentEntity.delete(c.env, id);
    return ok(c, { success: true });
  });
}