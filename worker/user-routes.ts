import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound, Entity } from './core-utils';
import type { Document, User, VersionSnapshot, AdminStats } from "@shared/types";
const verifyAuth = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userId = authHeader.split(' ')[1];
  const user = new UserEntity(c.env, userId);
  if (!await user.exists()) return null;
  return await user.getState();
};
const verifyAdmin = async (c: any) => {
  const user = await verifyAuth(c);
  if (!user || user.role !== 'admin') return null;
  return user;
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTH
  app.post('/api/auth/register', async (c) => {
    const { name, email, password } = await c.req.json();
    if (!email || !password) return bad(c, 'Email and password required');
    const existing = await UserEntity.findByEmail(c.env, email);
    if (existing) return bad(c, 'Email already in use');
    const userId = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await UserEntity.hashPassword(password, salt);
    // First user is admin for demo/initial setup
    const isFirstUser = email.toLowerCase() === 'admin@lumiere.studio' || (await new UserEntity(c.env, 'sys-count').exists() === false);
    const role = isFirstUser ? 'admin' : 'user';
    const user = await UserEntity.create(c.env, { 
      id: userId, 
      name: name || email.split('@')[0], 
      email, 
      passwordHash, 
      salt,
      role,
      createdAt: Date.now()
    });
    return ok(c, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: user.id });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    const user = await UserEntity.findByEmail(c.env, email);
    if (!user) return bad(c, 'Invalid credentials');
    if (!user.passwordHash || !user.salt) return bad(c, 'Invalid credentials');
    const computedHash = await UserEntity.hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) return bad(c, 'Invalid credentials');
    return ok(c, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: user.id });
  });
  // ADMIN ENDPOINTS
  app.get('/api/admin/stats', async (c) => {
    const admin = await verifyAdmin(c);
    if (!admin) return bad(c, 'Unauthorized');
    const users = await UserEntity.list(c.env, null, 1000);
    const docs = await DocumentEntity.list(c.env, null, 1000);
    const stats: AdminStats = {
      totalUsers: users.items.length,
      totalDocs: docs.items.length,
      activeShares: docs.items.filter(d => d.isPublic).length,
      storageUsed: JSON.stringify(docs.items).length,
      dailyStats: [
        { date: '2025-05-01', docs: 12, users: 2 },
        { date: '2025-05-02', docs: 15, users: 3 },
        { date: '2025-05-03', docs: 8, users: 1 },
        { date: '2025-05-04', docs: 22, users: 5 },
        { date: '2025-05-05', docs: 30, users: 8 },
      ]
    };
    return ok(c, stats);
  });
  app.get('/api/admin/users', async (c) => {
    if (!await verifyAdmin(c)) return bad(c, 'Unauthorized');
    const list = await UserEntity.list(c.env);
    return ok(c, list);
  });
  // DOCUMENTS (SCOPED & PUBLIC)
  app.get('/api/documents', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await DocumentEntity.listForUser(c.env, user.id, cq ?? null, lq ? Number(lq) : undefined);
    return ok(c, page);
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
      isPublic: false,
      viewCount: 0
    };
    return ok(c, await DocumentEntity.createForUser(c.env, doc));
  });
  app.get('/api/shared/documents/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    const state = await entity.getState();
    if (!state.isPublic) return bad(c, 'Private document');
    // Update view count
    await entity.mutate(s => ({ ...s, viewCount: (s.viewCount || 0) + 1 }));
    return ok(c, state);
  });
  app.get('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    const state = await entity.getState();
    if (state.userId !== user.id && user.role !== 'admin') return bad(c, 'Forbidden');
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
    let newVersions: VersionSnapshot[] = old.versions || [];
    if (updates.content !== undefined && updates.content !== old.content) {
      newVersions.push({ version: old.version, content: old.content, updatedAt: old.updatedAt });
    }
    const updated: Document = {
      ...old,
      ...updates,
      versions: newVersions,
      updatedAt: Date.now(),
      version: old.version + 1
    };
    await entity.save(updated);
    return ok(c, updated);
  });
  app.get('/api/documents/:id/versions', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    const state = await entity.getState();
    if (state.userId !== user.id) return bad(c, 'Forbidden');
    return ok(c, { items: state.versions?.slice().reverse() || [], total: state.versions?.length || 0 });
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