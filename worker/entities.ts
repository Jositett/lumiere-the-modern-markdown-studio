import { IndexedEntity, Entity } from "./core-utils";
import type { User, Document } from "@shared/types";
export class DocumentEntity extends IndexedEntity<Document> {
  static readonly entityName = "document";
  static readonly indexName = "documents"; // This is a fallback; usually we use user-scoped indices
  static readonly initialState: Document = {
    id: "",
    title: "Untitled Document",
    content: "",
    updatedAt: Date.now(),
    userId: "",
    version: 1
  };
  static async listForUser(env: any, userId: string, cursor?: string | null, limit?: number) {
    const userIndexName = `user-docs:${userId}`;
    const idx = new (class extends Entity<any> {
      static readonly entityName = "sys-index-root";
      constructor(env: any, name: string) { super(env, `index:${name}`); }
      async page(c?: string | null, l?: number) {
        const { keys, next } = await (this as any).stub.listPrefix('i:', c ?? null, l);
        return { items: keys.map((k: string) => k.slice(2)), next };
      }
    })(env, userIndexName);
    const { items: ids, next } = await idx.page(cursor, limit);
    const rows = await Promise.all(ids.map((id: string) => new DocumentEntity(env, id).getState()));
    return { items: rows as Document[], next };
  }
  static async createForUser(env: any, state: Document) {
    const inst = new DocumentEntity(env, state.id);
    await inst.save(state);
    // Add to global index (for sys) and user-scoped index
    const globalIdx = new (class extends Entity<any> {
       static readonly entityName = "sys-index-root";
       constructor(env: any, name: string) { super(env, `index:${name}`); }
       async add(item: string) { await (this as any).stub.indexAddBatch([item]); }
    })(env, "documents");
    const userIdx = new (class extends Entity<any> {
       static readonly entityName = "sys-index-root";
       constructor(env: any, name: string) { super(env, `index:${name}`); }
       async add(item: string) { await (this as any).stub.indexAddBatch([item]); }
    })(env, `user-docs:${state.userId}`);
    await globalIdx.add(state.id);
    await userIdx.add(state.id);
    return state;
  }
}
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "" };
  static async findByEmail(env: any, email: string): Promise<User | null> {
    const users = await this.list(env);
    return users.items.find(u => u.email === email) || null;
  }
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}