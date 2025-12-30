import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { UserEntity } from "./entities";
import type { Env } from './core-utils';
import type { User } from '@shared/types';
class DOAdapter {
  constructor(private env: Env) {}
  private async getDoc(key: string) {
    const stub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(key));
    return await (stub as any).getDoc(key);
  }
  private async casPut(key: string, expectedV: number, data: any) {
    const stub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(key));
    return await (stub as any).casPut(key, expectedV, data);
  }
  private async del(key: string) {
    const stub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(key));
    await (stub as any).del(key);
  }
  async create(data: { modelName: string; data: any }): Promise<any> {
    const { modelName, data: payload } = data;
    const id = payload.id || crypto.randomUUID();
    const key = `${modelName}:${id}`;
    const entry = { ...payload, id };
    await this.casPut(key, 0, entry);
    if (modelName === 'user') {
      const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName("index:users"));
      await (idxStub as any).indexAddBatch([id]);
    }
    return entry;
  }
  async findOne(data: { modelName: string; where: any[] }): Promise<any | null> {
    const { modelName, where } = data;
    // Optimized path for finding by ID
    const idFilter = where.find(w => w.field === 'id' && w.operator === 'eq');
    if (idFilter) {
      const doc = await this.getDoc(`${modelName}:${idFilter.value}`);
      return doc?.data || null;
    }
    // Fast-path for session lookups by token
    if (modelName === 'session') {
      const tokenFilter = where.find(w => w.field === 'token' && w.operator === 'eq');
      if (tokenFilter) {
        // Sessions in better-auth often use token as a secondary identifier
        // We scan the global session index or check for doc existence if stored by token key
        const doc = await this.getDoc(`session-token:${tokenFilter.value}`);
        if (doc?.data) return doc.data;
      }
    }
    // Special path: finding user by email
    if (modelName === 'user') {
      const emailFilter = where.find(w => w.field === 'email' && w.operator === 'eq');
      if (emailFilter) {
        return await UserEntity.findByEmail(this.env, emailFilter.value);
      }
    }
    // Generic fallback: Scan index
    const idxName = modelName === 'user' ? 'index:users' : `index:${modelName}`;
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(idxName));
    const { keys } = await (idxStub as any).listPrefix('i:');
    for (const k of keys) {
      const docId = k.slice(2);
      const doc = await this.getDoc(`${modelName}:${docId}`);
      const item = doc?.data;
      if (!item) continue;
      const matches = where.every(w => {
        if (w.operator === 'eq') return item[w.field] === w.value;
        return true;
      });
      if (matches) return item;
    }
    return null;
  }
  async findMany(data: { modelName: string; where?: any[]; limit?: number; offset?: number }): Promise<any[]> {
    const { modelName, limit = 100 } = data;
    const idxName = modelName === 'user' ? 'index:users' : `index:${modelName}`;
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(idxName));
    const { keys } = await (idxStub as any).listPrefix('i:', null, limit);
    const results = await Promise.all(keys.map(async (k: string) => {
      const doc = await this.getDoc(`${modelName}:${k.slice(2)}`);
      return doc?.data;
    }));
    return results.filter(Boolean);
  }
  async update(data: { modelName: string; where: any[]; update: any }): Promise<any | null> {
    const { modelName, where, update } = data;
    const existing = await this.findOne({ modelName, where });
    if (!existing) return null;
    const key = `${modelName}:${existing.id}`;
    const next = { ...existing, ...update, updatedAt: Date.now() };
    for (let i = 0; i < 5; i++) {
      const current = await this.getDoc(key);
      if (!current) return null;
      const res = await this.casPut(key, current.v, next);
      if (res.ok) {
        // If updating a session token, sync secondary lookup
        if (modelName === 'session' && next.token) {
          await this.casPut(`session-token:${next.token}`, 0, next);
        }
        return next;
      }
    }
    console.error(`[AUTH ADAPTER] CAS contention on ${key}`);
    throw new Error("Contention in update");
  }
  async delete(data: { modelName: string; where: any[] }): Promise<void> {
    const existing = await this.findOne(data);
    if (!existing) return;
    await this.del(`${data.modelName}:${existing.id}`);
    if (data.modelName === 'session' && existing.token) {
      await this.del(`session-token:${existing.token}`);
    }
    const idxName = data.modelName === 'user' ? 'index:users' : `index:${data.modelName}`;
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(idxName));
    await (idxStub as any).indexRemoveBatch([existing.id]);
  }
}
export const getAuth = (env: Env) => {
  return betterAuth({
    database: new DOAdapter(env),
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: (env as any).GITHUB_CLIENT_ID || '',
        clientSecret: (env as any).GITHUB_CLIENT_SECRET || ''
      }
    },
    plugins: [twoFactor({ issuer: "Lumiere Studio" })],
    advanced: { cookiePrefix: "lumiere" },
    trustedOrigins: ["*"],
  });
};