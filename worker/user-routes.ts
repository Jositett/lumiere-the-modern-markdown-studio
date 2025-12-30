import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Document, User, AdminStats, SystemLog } from "@shared/types";
import { getAuth } from "./auth";
const verifyAuth = async (c: any) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) return null;
  // Real-time security check for banned status
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
  const current = await (stub as any).getDoc("logs");
  const logsArr = [entry, ...(current?.data || [])].slice(0, 100);
  await (stub as any).casPut("logs", current?.v ?? 0, logsArr);
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
  app.get('/api/admin/stats', async (c) => {
    const admin = await verifyAuth(c);
    if (admin?.role !== 'admin') return bad(c, 'Unauthorized');
    const usersResponse = await UserEntity.list(c.env, null, 1000) as {items: User[]};
    const docsResponse = await DocumentEntity.list(c.env, null, 1000) as {items: Document[]};
    const users = usersResponse?.items || [];
    const docs = docsResponse?.items || [];
    const stats: AdminStats = {
      totalUsers: users.length,
      totalDocs: docs.length,
      activeShares: docs.filter(d => d.isPublic).length,
      storageUsed: JSON.stringify(docs).length,
      bannedUsers: users.filter(u => u.isBanned).length,
      totalStorageBytes: JSON.stringify(docs).length + JSON.stringify(users).length,
      recentErrors: 0,
      dailyStats: [] // Simplified for brevity in this route
    };
    return ok(c, stats);
  });
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
}