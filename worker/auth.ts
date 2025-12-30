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
    // Fast path: finding by ID
    const idFilter = where.find(w => w.field === 'id' && w.operator === 'eq');
    if (idFilter) {
      const doc = await this.getDoc(`${modelName}:${idFilter.value}`);
      return doc?.data || null;
    }
    // Special path: finding user by email
    if (modelName === 'user') {
      const emailFilter = where.find(w => w.field === 'email' && w.operator === 'eq');
      if (emailFilter) {
        return await UserEntity.findByEmail(this.env, emailFilter.value);
      }
    }
    // Generic path: search index (Limited for performance on Edge)
    if (modelName === 'user') {
      const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName("index:users"));
      const { keys } = await (idxStub as any).listPrefix('i:');
      for (const k of keys) {
        const userId = k.slice(2);
        const doc = await this.getDoc(`user:${userId}`);
        const user = doc?.data;
        if (!user) continue;
        const matches = where.every(w => {
          if (w.operator === 'eq') return user[w.field] === w.value;
          return true;
        });
        if (matches) return user;
      }
    }
    return null;
  }
  async findMany(data: { modelName: string; where?: any[]; limit?: number; offset?: number }): Promise<any[]> {
    const { modelName, limit = 100 } = data;
    if (modelName === 'user') {
      const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName("index:users"));
      const { keys } = await (idxStub as any).listPrefix('i:', null, limit);
      const results = await Promise.all(keys.map(async (k: string) => {
        const doc = await this.getDoc(`user:${k.slice(2)}`);
        return doc?.data;
      }));
      return results.filter(Boolean);
    }
    return [];
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
      if (res.ok) return next;
    }
    throw new Error("Contention in update");
  }
  async delete(data: { modelName: string; where: any[] }): Promise<void> {
    const existing = await this.findOne(data);
    if (!existing) return;
    await this.del(`${data.modelName}:${existing.id}`);
    if (data.modelName === 'user') {
      const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName("index:users"));
      await (idxStub as any).indexRemoveBatch([existing.id]);
    }
  }
}
export const getAuth = (env: Env) => {
  const githubClientId = (env as any).GITHUB_CLIENT_ID || '';
  const githubClientSecret = (env as any).GITHUB_CLIENT_SECRET || '';
  const googleClientId = (env as any).GOOGLE_CLIENT_ID || '';
  const googleClientSecret = (env as any).GOOGLE_CLIENT_SECRET || '';
  const socialProviders: any = {};
  if (githubClientId && githubClientSecret) {
    socialProviders.github = { clientId: githubClientId, clientSecret: githubClientSecret };
  }
  if (googleClientId && googleClientSecret) {
    socialProviders.google = { clientId: googleClientId, clientSecret: googleClientSecret };
  }
  return betterAuth({
    database: new DOAdapter(env),
    emailAndPassword: { enabled: true },
    socialProviders,
    plugins: [twoFactor({ issuer: "Lumiere Studio" })],
    advanced: { cookiePrefix: "lumiere" },
    trustedOrigins: ["*"],
  });
};