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
    const rows = await Promise.all(ids.map(async (id: string) => {
      try {
        return await new DocumentEntity(env, id).getState();
      } catch {
        return null;
      }
    }));
    return { items: rows.filter(Boolean) as Document[], next };
  }
  static async createForUser(env: Env, state: Document) {
    const inst = new DocumentEntity(env, state.id);
    const docWithVersions = {
      ...state,
      versions: [{ version: state.version, content: state.content, updatedAt: state.updatedAt }]
    };
    await inst.save(docWithVersions);
    const globalIdx = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName("index:documents"));
    const userIdx = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(`index:user-docs:${state.userId}`));
    await (globalIdx as any).indexAddBatch([state.id]);
    await (userIdx as any).indexAddBatch([state.id]);
    return docWithVersions;
  }
}
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "" };
  static async findByEmail(env: Env, email: string): Promise<User | null> {
    const idxStub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName("index:users"));
    const { keys } = await (idxStub as any).listPrefix('i:');
    // Performance: Parallel fetch of user states
    const userDocs = await Promise.all(keys.map(async (k: string) => {
      const userId = k.slice(2);
      const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(`user:${userId}`));
      return await (stub as any).getDoc(`user:${userId}`);
    }));
    const user = userDocs.find(doc => doc?.data?.email === email);
    return user?.data || null;
  }
}