import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { UserEntity } from "./entities";
import type { Env } from './core-utils';
import type { User } from '@shared/types';
class DOAdapter {
  constructor(private env: Env) {}

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
  }

  get user() {
    return {
      create: (data: any) => this._create('user', data),
      get: (where: any[]) => this._findOne('user', where),
      delete: (where: any[]) => this._delete('user', where),
    };
  }

  get account() {
    return {
      create: (data: any) => this._create('account', data),
      get: (where: any[]) => this._findOne('account', where),
      delete: (where: any[]) => this._delete('account', where),
      link: async (account: any) => {
        const where = [
          { field: 'providerId', operator: 'eq', value: account.providerId },
          { field: 'providerAccountId', operator: 'eq', value: account.providerAccountId }
        ];
        const existing = await this._findOne('account', where);
        if (existing) {
          return this._update('account', where, account);
        }
        return this._create('account', account);
      },
      unlink: ({ providerId, providerAccountId }: { providerId: string; providerAccountId: string }) => 
        this._delete('account', [
          { field: 'providerId', operator: 'eq', value: providerId },
          { field: 'providerAccountId', operator: 'eq', value: providerAccountId }
        ]),
    };
  }

  get session() {
    return {
      create: (data: any) => this._create('session', data),
      get: (where: any[]) => this._findOne('session', where),
      delete: (where: any[]) => this._delete('session', where),
    };
  }

  get verificationToken() {
    return {
      create: (data: any) => this._create('verificationToken', data),
      get: (where: any[]) => this._findOne('verificationToken', where),
      delete: (where: any[]) => this._delete('verificationToken', where),
    };
  }

  get recoveryToken() {
    return {
      create: (data: any) => this._create('recoveryToken', data),
      get: (where: any[]) => this._findOne('recoveryToken', where),
      delete: (where: any[]) => this._delete('recoveryToken', where),
    };
  }

  get twoFactorTotpSecret() {
    return {
      create: (data: any) => this._create('twoFactorTotpSecret', data),
      get: (where: any[]) => this._findOne('twoFactorTotpSecret', where),
      update: async (data: any) => {
        const where = [{ field: 'userId', operator: 'eq', value: data.userId }];
        return this._update('twoFactorTotpSecret', where, data);
      },
      delete: (where: any[]) => this._delete('twoFactorTotpSecret', where),
    };
  }

  get twoFactorRecoveryCode() {
    return {
      create: (data: any) => this._create('twoFactorRecoveryCode', data),
      get: (where: any[]) => this._findOne('twoFactorRecoveryCode', where),
      delete: (where: any[]) => this._delete('twoFactorRecoveryCode', where),
    };
  }

  private getIndexStubName(modelName: string): string {
    const map: Record<string, string> = {
      user: 'users',
      account: 'accounts',
      session: 'sessions',
      verificationToken: 'verificationTokens',
      recoveryToken: 'recoveryTokens',
      twoFactorTotpSecret: 'twoFactorTotpSecrets',
      twoFactorRecoveryCode: 'twoFactorRecoveryCodes'
    };
    return `index:${map[modelName] || modelName + 's'}`;
  }
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

  private async _create(modelName: string, payload: any): Promise<any> {
    const id = payload.id || crypto.randomUUID();
    const key = `${modelName}:${id}`;
    const entry = { ...payload, id };
    await this.casPut(key, 0, entry);
    
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(this.getIndexStubName(modelName)));
    await (idxStub as any).indexAddBatch([id]);
    
    if (modelName === 'session' && entry.token) {
      await this.casPut(`session-token:${entry.token}`, 0, entry);
    }
    
    return entry;
  }
  private async _findOne(modelName: string, where: any[]): Promise<any | null> {
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
    
    // Account special path: providerId + providerAccountId
    if (modelName === 'account') {
      const providerFilter = where.find(w => w.field === 'providerId' && w.operator === 'eq');
      const accountFilter = where.find(w => w.field === 'providerAccountId' && w.operator === 'eq');
      if (providerFilter && accountFilter) {
        const doc = await this.getDoc(`account:${providerFilter.value}:${accountFilter.value}`);
        return doc?.data || null;
      }
    }
    
    // Generic fallback: Scan index
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(this.getIndexStubName(modelName)));
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

  private async _update(modelName: string, where: any[], update: any): Promise<any | null> {
    const existing = await this._findOne(modelName, where);
    if (!existing) return null;
    const key = `${modelName}:${existing.id}`;
    const next = { ...existing, ...update, updatedAt: Date.now() };
    for (let i = 0; i < 5; i++) {
      const current = await this.getDoc(key);
      if (!current) return null;
      const res = await this.casPut(key, current.v, next);
      if (res.ok) {
        if (modelName === 'session' && next.token) {
          await this.casPut(`session-token:${next.token}`, 0, next);
        }
        return next;
      }
    }
    console.error(`[AUTH ADAPTER] CAS contention on ${key}`);
    throw new Error("Contention in update");
  }
  private async _delete(modelName: string, where: any[]): Promise<void> {
    const existing = await this._findOne(modelName, where);
    if (!existing) return;
    await this.del(`${modelName}:${existing.id}`);
    if (modelName === 'session' && existing.token) {
      await this.del(`session-token:${existing.token}`);
    }
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(this.getIndexStubName(modelName)));
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