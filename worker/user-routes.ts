import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Document, User, AdminStats, SystemLog } from "@shared/types";
import { SignJWT, jwtVerify } from 'jose';
const JWT_SECRET = new TextEncoder().encode('lumiere-super-secret-key-replace-in-prod');
const ACCESS_TOKEN_EXP = '15m';
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
  // Very basic counter implementation in the DO using existing casPut
  const doc = await stub.getDoc(key) as any;
  const now = Date.now();
  const state = (doc?.data && (now - doc.data.reset) < 60000) ? doc.data : { count: 0, reset: now };
  if (state.count > 100) return c.json({ success: false, error: 'Rate limit exceeded' }, 429);
  await stub.casPut(key, doc?.v || 0, { count: state.count + 1, reset: state.reset });
  await next();
};
const logEvent = async (env: Env, log: Omit<SystemLog, 'id' | 'timestamp'>) => {
  const id = crypto.randomUUID();
  const entry: SystemLog = { ...log, id, timestamp: Date.now() };
  const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName('sys-logs'));
  const current = await stub.getDoc('logs') as any;
  const logs = [entry, ...(current?.data || [])].slice(0, 100);
  await stub.casPut('logs', current?.v || 0, logs);
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
    const users = await UserEntity.list(c.env, null, 1000);
    const docs = await DocumentEntity.list(c.env, null, 1000);
    const stats: AdminStats = {
      totalUsers: users.items.length,
      totalDocs: docs.items.length,
      activeShares: docs.items.filter(d => d.isPublic).length,
      storageUsed: JSON.stringify(docs.items).length,
      bannedUsers: users.items.filter(u => u.isBanned).length,
      totalStorageBytes: JSON.stringify(docs.items).length,
      recentErrors: 0,
      dailyStats: []
    };
    return ok(c, stats);
  });
  app.get('/api/admin/users', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    return ok(c, await UserEntity.list(c.env));
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
    const logs = await stub.getDoc('logs');
    return ok(c, logs?.data || []);
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