import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Document, User } from "@shared/types";
const verifyAuth = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userId = authHeader.split(' ')[1]; // Simplification for demo: token is just userId
  const user = new UserEntity(c.env, userId);
  if (!await user.exists()) return null;
  return await user.getState();
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTH
  app.post('/api/auth/register', async (c) => {
    const { name, email, password } = await c.req.json();
    if (!email || !password) return bad(c, 'Email and password required');
    const existing = await UserEntity.findByEmail(c.env, email);
    if (existing) return bad(c, 'Email already in use');
    const userId = crypto.randomUUID();
    const passwordHash = await UserEntity.hashPassword(password);
    const user = await UserEntity.create(c.env, { id: userId, name: name || email.split('@')[0], email, passwordHash });
    return ok(c, { user: { id: user.id, name: user.name, email: user.email }, token: user.id });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    const user = await UserEntity.findByEmail(c.env, email);
    if (!user) return bad(c, 'Invalid credentials');
    const hash = await UserEntity.hashPassword(password);
    if (user.passwordHash !== hash) return bad(c, 'Invalid credentials');
    return ok(c, { user: { id: user.id, name: user.name, email: user.email }, token: user.id });
  });
  // DOCUMENTS (SCOPED)
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
    return ok(c, state);
  });
  app.get('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    const state = await entity.getState();
    if (state.userId !== user.id) return bad(c, 'Forbidden');
    return ok(c, state);
  });
  app.put('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const updates = await c.req.json();
    const entity = new DocumentEntity(c.env, id);
    const current = await entity.getState();
    if (current.userId !== user.id) return bad(c, 'Forbidden');
    const updated = await entity.mutate(s => ({ ...s, ...updates, updatedAt: Date.now() }));
    return ok(c, updated);
  });
  app.delete('/api/documents/:id', async (c) => {
    const user = await verifyAuth(c);
    if (!user) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    const state = await entity.getState();
    if (state.userId !== user.id) return bad(c, 'Forbidden');
    await DocumentEntity.delete(c.env, id);
    return ok(c, { success: true });
  });
}