import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Document, User, AdminStats, SystemLog, ClientError } from "@shared/types";
import { AUTH_SECRET, verifyJwt, signJwt, hashPassword, verifyPassword } from './auth';
const verifyAuth = async (c: any) => {
  const h = c.req.header('Authorization');
  if(!h?.startsWith('Bearer ')) return null;
  const token = h.slice(7);
  const claims = await verifyJwt(token, AUTH_SECRET);
  if(!claims?.userId) return null;
  const e = new UserEntity(c.env, claims.userId);
  const user = await e.getState();
  if(!user || user.isBanned) return null;
  return user;
};
const rateLimit = async (c: any, next: any) => {
  const ip = c.req.header('CF-Connecting-IP') || 'anon';
  const key = `rl:${ip}`;
  const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName(key));
  const doc = await (stub as any).getDoc(key);
  const now = Date.now();
  const data = doc?.data;
  const state = (data && (now - data.reset) < 60000) ? data : { count: 0, reset: now };
  if (state.count > 100) return c.json({ success: false, error: 'Rate limit exceeded' }, 429);
  await (stub as any).casPut(key, doc?.v ?? 0, { count: state.count + 1, reset: state.reset });
  await next();
};
const logEvent = async (env: Env, log: Omit<SystemLog, 'id' | 'timestamp'>) => {
  const id = crypto.randomUUID();
  const entry: SystemLog = { ...log, id, timestamp: Date.now() };
  const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName('sys-logs'));
  for (let i = 0; i < 5; i++) {
    const current = await (stub as any).getDoc("logs");
    const logsArr = [entry, ...(current?.data || [])].slice(0, 100);
    const res = await (stub as any).casPut("logs", current?.v ?? 0, logsArr);
    if (res.ok) return;
  }
};
let routesRegistered = false;

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  if (routesRegistered) return;
  routesRegistered = true;
  app.use('*', rateLimit);

  app.post('/api/auth/register', async (c) => {
    try {
      const {email, password} = await c.req.json<{email:string,password:string}>();
      if(!email?.trim() || !password || password.length < 6) return bad(c, 'Invalid email/password');
      const existing = await UserEntity.findByEmail(c.env, email.trim());
      if(existing) return bad(c, 'Email already registered');
      const {hash: passwordHash, salt} = await hashPassword(password);
      const id = crypto.randomUUID();
      const user: User = {
        id,
        name: email.split('@')[0] || email.split('.')[0] || 'User',
        email: email.trim(),
        passwordHash,
        salt,
        role: 'user',
        createdAt: Date.now()
      };
      await UserEntity.create(c.env, user);
      const userList = await UserEntity.list(c.env, null, 1000);
      if ((userList.items?.length || 0) === 1) {
        const adminEntity = new UserEntity(c.env, id);
        await adminEntity.patch({ role: 'admin' });
        user.role = 'admin';
      }
      const token = await signJwt({userId: id}, AUTH_SECRET);
      const safeUser = {...user, passwordHash: undefined, salt: undefined};
      return ok(c, {user: safeUser, token});
    } catch(e:any){
      console.error(e);
      return bad(c, 'Registration failed');
    }
  });

  app.post('/api/auth/login', async (c) => {
    try {
      const {email, password} = await c.req.json<{email:string,password:string}>();
      if(!email?.trim()) return bad(c, 'Invalid credentials');
      const user = await UserEntity.findByEmail(c.env, email.trim());
      if(!user || !user.passwordHash || !await verifyPassword(user.passwordHash, user.salt!, password))
        return bad(c, 'Invalid credentials');
      const token = await signJwt({userId: user.id}, AUTH_SECRET);
      const safeUser = {...user, passwordHash: undefined, salt: undefined};
      return ok(c, {user: safeUser, token});
    } catch(e:any){
      console.error(e);
      return bad(c, 'Login failed');
    }
  });

  app.post('/api/auth/logout', async(c)=> ok(c, {success:true}));

  app.get('/api/auth/me', async(c)=>{
    const user = await verifyAuth(c);
    if(!user) return bad(c, 'Unauthorized');
    return ok(c, {...user, passwordHash: undefined, salt: undefined});
  });
  // --- Admin Routes ---
  app.get('/api/admin/stats', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const usersResponse = await UserEntity.list(c.env, null, 1000);
    const docsResponse = await DocumentEntity.list(c.env, null, 1000);
    const stats: AdminStats = {
      totalUsers: usersResponse.items?.length || 0,
      totalDocs: docsResponse.items?.length || 0,
      activeShares: (docsResponse.items || []).filter((d: any) => d.isPublic).length,
      storageUsed: JSON.stringify(docsResponse.items || []).length,
      bannedUsers: (usersResponse.items || []).filter(u => u.isBanned).length,
      totalStorageBytes: JSON.stringify(docsResponse.items || []).length + JSON.stringify(usersResponse.items || []).length,
      recentErrors: 0,
      dailyStats: []
    };
    return ok(c, stats);
  });
  app.get('/api/admin/users', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    return ok(c, await UserEntity.list(c.env, c.req.query('cursor'), 50));
  });
  app.post('/api/admin/users/:id/ban', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const userEntity = new UserEntity(c.env, id);
    const user = await userEntity.getState();
    if (!user) return notFound(c);
    const nextBanned = !(user.isBanned ?? false);
    await userEntity.patch({ isBanned: nextBanned });
    await logEvent(c.env, { level: 'security', event: `User ${id} ${nextBanned ? 'banned' : 'unbanned'} by ${admin!.id}` });
    return ok(c, { isBanned: nextBanned });
  });
  app.get('/api/admin/logs', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName('sys-logs'));
    const doc = await (stub as any).getDoc("logs");
    return ok(c, doc?.data || []);
  });
  app.get('/api/admin/client-errors', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName('client-errors-root'));
    const doc = await (stub as any).getDoc("errors");
    return ok(c, doc?.data || []);
  });
  // --- Document Routes ---
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
  app.put('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const updates = await c.req.json();
    const entity = new DocumentEntity(c.env, id);
    const old = await entity.getState();
    if (!old) return notFound(c);
    if (old.userId !== user.id && user.role !== 'admin') return bad(c, 'Forbidden');
    const updated = {...old, ...updates, updatedAt: Date.now(), version: old.version + 1};
    await entity.save(updated);
    return ok(c, updated);
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
  app.get('/api/documents/:id/versions', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    const doc = await entity.getState();
    if (!doc) return notFound(c);
    if (doc.userId !== user.id && user.role !== 'admin') return bad(c, 'Forbidden');
    return ok(c, { items: doc.versions || [] });
  });

  app.delete('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    const state = await entity.getState();
    if (!state) return notFound(c);
    if (state.userId !== user.id && user.role !== 'admin') return bad(c, 'Forbidden');
    await DocumentEntity.delete(c.env, id);
    return ok(c, { success: true });
  });
}