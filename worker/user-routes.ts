import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Document, User, AdminStats, SystemLog, ClientError } from "@shared/types";
import { getAuth } from "./auth";
const verifyAuth = async (c: any) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) return null;
  const userInst = new UserEntity(c.env, session.user.id);
  const user = await userInst.getState();
  if (user.isBanned) return null;
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.all('/api/auth/**', async (c) => {
    const auth = getAuth(c.env);
    const req = c.req.raw.clone();
    const url = new URL(req.url);
    url.pathname = url.pathname.replace(/^\/api\/auth/, '/auth');
    const modReq = new Request(url.toString(), req as any);
    return auth.handler(modReq);
  });
  app.use('/api/*', rateLimit);
  // --- Admin Routes ---
  app.get('/api/admin/stats', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const usersResponse = await UserEntity.list(c.env, null, 1000);
    const docsResponse = await DocumentEntity.list(c.env, null, 1000);
    const stats: AdminStats = {
      totalUsers: usersResponse.items.length,
      totalDocs: docsResponse.items.length,
      activeShares: docsResponse.items.filter(d => d.isPublic).length,
      storageUsed: JSON.stringify(docsResponse.items).length,
      bannedUsers: usersResponse.items.filter(u => u.isBanned).length,
      totalStorageBytes: JSON.stringify(docsResponse.items).length + JSON.stringify(usersResponse.items).length,
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
    const nextBanned = !user.isBanned;
    await userEntity.patch({ isBanned: nextBanned });
    await logEvent(c.env, { level: 'security', event: `User ${id} ${nextBanned ? 'banned' : 'unbanned'} by ${admin.id}` });
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
  app.post('/api/client-errors', async (c) => {
    const error = await c.req.json<ClientError>();
    const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName('client-errors-root'));
    for (let i = 0; i < 5; i++) {
      const current = await (stub as any).getDoc("errors");
      const errs = [{ ...error, id: crypto.randomUUID(), timestamp: Date.now() }, ...(current?.data || [])].slice(0, 50);
      const res = await (stub as any).casPut("errors", current?.v ?? 0, errs);
      if (res.ok) break;
    }
    return ok(c, { success: true });
  });
}