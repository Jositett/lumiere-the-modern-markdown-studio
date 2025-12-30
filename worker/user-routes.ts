import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity, UserEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Document } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // DOCUMENTS
  app.get('/api/documents', async (c) => {
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await DocumentEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/documents', async (c) => {
    const { title, content } = (await c.req.json()) as Partial<Document>;
    const doc: Document = {
      id: crypto.randomUUID(),
      title: title?.trim() || "Untitled Document",
      content: content || "",
      updatedAt: Date.now(),
      isPublic: false
    };
    return ok(c, await DocumentEntity.create(c.env, doc));
  });
  app.get('/api/shared/documents/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'document not found');
    const state = await entity.getState();
    if (!state.isPublic) return bad(c, 'this document is private');
    return ok(c, state);
  });
  app.get('/api/documents/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'document not found');
    return ok(c, await entity.getState());
  });
  app.put('/api/documents/:id', async (c) => {
    const id = c.req.param('id');
    const updates = (await c.req.json()) as Partial<Document>;
    const entity = new DocumentEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'document not found');
    const updated = await entity.mutate(s => ({
      ...s,
      ...updates,
      updatedAt: Date.now()
    }));
    return ok(c, updated);
  });
  app.delete('/api/documents/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await DocumentEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
}