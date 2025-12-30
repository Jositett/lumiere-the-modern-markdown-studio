import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { UserEntity } from "./entities";
import type { Env } from './core-utils';
import type { User } from '@shared/types';

class DOAdapter {
  constructor(private env: Env) {}

  private async getDoc(key: string) {
    const stub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(key));
    const doc = await (stub as any).getDoc(key);
    return doc;
  }

  private async casPut(key: string, expectedV: number, data: any) {
    const stub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(key));
    return await (stub as any).casPut(key, expectedV, data);
  }

  private async del(key: string) {
    const stub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName(key));
    await (stub as any).del(key);
  }

  async healthCheck(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async disconnect(): Promise<void> {
    // No-op for Durable Objects
  }

  // User methods
  async createUser(input: any): Promise<User> {
    const id = input.id ?? crypto.randomUUID();
    const userData = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...input
    };

    await this.casPut(`user:${id}`, 0, userData);

    // Add to users index
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName("index:users"));
    await (idxStub as any).indexAddBatch([id]);

    return userData as any as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const doc = await this.getDoc(`user:${id}`);
    return (doc?.data as User) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await UserEntity.findByEmail(this.env, email);
  }

  async updateUser(input: any): Promise<User | null> {
    const { id, ...update } = input;
    const user = await this.getUserById(id);
    if (!user) return null;

    const next = { ...user, ...update, updatedAt: Date.now() };
    const key = `user:${id}`;

    for (let i = 0; i < 3; i++) {
      const current = await this.getDoc(key);
      if (!current) return null;
      const res = await this.casPut(key, current.v, next);
      if (res.ok) return next as User;
    }
    throw new Error("Contention in user update");
  }

  async getUserByAccount(account: {providerId: string; providerAccountId: string}): Promise<User | null> {
    const accountKey = `account:${account.providerId}:${account.providerAccountId}`;
    const accDoc = await this.getDoc(accountKey);
    if (!accDoc?.data?.userId) return null;
    return this.getUserById(accDoc.data.userId as string);
  }

  // Session methods
  async createSession(data: any): Promise<any> {
    const id = data.id || crypto.randomUUID();
    const sessionData = { ...data, id, expiresAt: data.expiresAt || Date.now() + (7 * 24 * 60 * 60 * 1000) };
    await this.casPut(`session:${id}`, 0, sessionData);
    return sessionData;
  }

  async getSession(id: string): Promise<any | null> {
    const doc = await this.getDoc(`session:${id}`);
    return (doc?.data as any) || null;
  }

  async updateSession(input: any): Promise<any | null> {
    const { id, ...update } = input;
    const session = await this.getSession(id);
    if (!session) return null;

    const next = { ...session, ...update };
    const key = `session:${id}`;

    for (let i = 0; i < 3; i++) {
      const current = await this.getDoc(key);
      if (!current) return null;
      const res = await this.casPut(key, current.v, next);
      if (res.ok) return next;
    }
    throw new Error("Contention in session update");
  }

  async deleteSession(id: string): Promise<void> {
    await this.del(`session:${id}`);
  }

  // Account methods
  async createAccount(data: any): Promise<any> {
    const key = `account:${data.providerId}:${data.providerAccountId}`;
    await this.casPut(key, 0, data);
    return data;
  }

  async getAccountByProviderAccountId(providerAccountId: string, providerId: string): Promise<any | null> {
    const doc = await this.getDoc(`account:${providerId}:${providerAccountId}`);
    return (doc?.data as any) || null;
  }

  async updateAccount({ providerId, providerAccountId, ...update }: any): Promise<any | null> {
    const key = `account:${providerId}:${providerAccountId}`;
    const account = await this.getDoc(key);
    if (!account) return null;

    const next = { ...account.data, ...update };
    for (let i = 0; i < 3; i++) {
      const current = await this.getDoc(key);
      if (!current) return null;
      const res = await this.casPut(key, current.v, next);
      if (res.ok) return next;
    }
    throw new Error("Contention in account update");
  }

  async deleteAccount({ providerId, providerAccountId }: { providerId: string; providerAccountId: string }): Promise<void> {
    await this.del(`account:${providerId}:${providerAccountId}`);
  }

  // Verification token methods
  async createVerificationToken(data: any): Promise<any> {
    const key = `verificationToken:${data.identifierToken}`;
    await this.casPut(key, 0, data);
    return data;
  }

  async useVerificationToken(identifierToken: string): Promise<any | null> {
    const key = `verificationToken:${identifierToken}`;
    const doc = await this.getDoc(key);
    if (!doc || (doc.data.expires as number) < Date.now()) return null;

    await this.del(key);
    return doc.data;
  }

  // Two-factor recovery code methods
  async createTwoFactorRecoveryCode(data: any): Promise<any> {
    const key = `recovery:${data.code}`;
    await this.casPut(key, 0, data);
    return data;
  }

  async useTwoFactorRecoveryCode(code: string): Promise<any | null> {
    const key = `recovery:${code}`;
    const doc = await this.getDoc(key);
    if (!doc) return null;

    await this.del(key);
    return doc.data;
  }

  async deleteUser(id: string): Promise<void> {
    const key = `user:${id}`;
    await this.del(key);
    const idxStub = this.env.GlobalDurableObject.get(this.env.GlobalDurableObject.idFromName('index:users'));
    await (idxStub as any).indexDeleteBatch([id]);
  }
}

export const getAuth = (env: Env) => {
  const githubClientId = (env as any).GITHUB_CLIENT_ID || '';
  const githubClientSecret = (env as any).GITHUB_CLIENT_SECRET || '';
  const googleClientId = (env as any).GOOGLE_CLIENT_ID || '';
  const googleClientSecret = (env as any).GOOGLE_CLIENT_SECRET || '';

  type SocialProvider = { clientId: string; clientSecret: string; };
  type SocialProvidersCfg = Partial<Record<'github' | 'google', SocialProvider>>;
  const socialProviders: SocialProvidersCfg = {};
  if (githubClientId && githubClientSecret) {
    socialProviders.github = { clientId: githubClientId, clientSecret: githubClientSecret };
  }
  if (googleClientId && googleClientSecret) {
    socialProviders.google = { clientId: googleClientId, clientSecret: googleClientSecret };
  }

  return betterAuth({
    database: new DOAdapter(env),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders,
    session: {
      expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    },
    plugins: [
      twoFactor({
        issuer: "Lumiere Studio",
      })
    ],
    advanced: {
      cookiePrefix: "lumiere",
    },
    trustedOrigins: ["*"],
  });
};