import { IndexedEntity, Entity, Env } from "./core-utils";
import type { User, Document } from "@shared/types";
export class DocumentEntity extends IndexedEntity<Document> {
  static readonly entityName = "document";
  static readonly indexName = "documents";
  static readonly initialState: Document = {
    id: "",
    title: "Untitled Document",
    content: "",
    updatedAt: Date.now(),
    userId: "",
    version: 1,
    versions: []
  };
  static async listForUser(env: Env, userId: string, cursor?: string | null, limit?: number) {
    const userIndexName = `user-docs:${userId}`;
    const idx = new (class extends Entity<any> {
      static readonly entityName = "sys-index-root";
      constructor(env: Env, name: string) { super(env, `index:${name}`); }
      async page(c?: string | null, l?: number) {
        const { keys, next } = await (this as any).stub.listPrefix('i:', c ?? null, l);
        return { items: keys.map((k: string) => k.slice(2)), next };
      }
    })(env, userIndexName);
    const { items: ids, next } = await idx.page(cursor, limit);
    const rows = await Promise.all(ids.map((id: string) => new DocumentEntity(env, id).getState()));
    return { items: rows as Document[], next };
  }
  static async createForUser(env: Env, state: Document) {
    const inst = new DocumentEntity(env, state.id);
    const docWithVersions = { 
      ...state, 
      versions: [{ version: state.version, content: state.content, updatedAt: state.updatedAt }] 
    };
    await inst.save(docWithVersions);
    const globalIdx = new IndexProxy(env, "documents");
    const userIdx = new IndexProxy(env, `user-docs:${state.userId}`);
    await globalIdx.add(state.id);
    await userIdx.add(state.id);
    return docWithVersions;
  }
}
class IndexProxy extends Entity<any> {
  static readonly entityName = "sys-index-root";
  constructor(env: Env, name: string) { super(env, `index:${name}`); }
  async add(item: string) { await (this as any).stub.indexAddBatch([item]); }
}
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "" };
  static async findByEmail(env: Env, email: string): Promise<User | null> {
    const index = new (class extends Entity<any> {
      static readonly entityName = "sys-index-root";
      constructor(env: Env) { super(env, `index:users`); }
      async page(c?: string | null, l?: number) {
        const { keys, next } = await (this as any).stub.listPrefix('i:', c ?? null, l);
        return { items: keys.map((k: string) => k.slice(2)), next };
      }
    })(env);
    const { items: ids } = await index.page(null, 1000);
    const users = await Promise.all(ids.map(async (id: string) => {
      try {
        return await new UserEntity(env, id).getState();
      } catch {
        return null;
      }
    }));
    return users.find(u => u && u.email === email) || null;
  }
}