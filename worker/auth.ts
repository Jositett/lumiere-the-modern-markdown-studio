import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { UserEntity } from "./entities";
import type { Env } from "./core-utils";
/**
 * Better-Auth implementation for Cloudflare Workers using GlobalDurableObject
 * Mapping Better-Auth internal database schema to our Entity patterns.
 */
export const getAuth = (env: Env) => betterAuth({
  database: {
    adapter: {
      async create({ model, data }) {
        const id = (data as any).id || crypto.randomUUID();
        const key = `${model}:${id}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        await stub.casPut(key, 0, data);
        // Handle indexing for User model
        if (model === "user") {
          const idxStub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName("index:users"));
          await idxStub.indexAddBatch([id]);
        }
        return data as any;
      },
      async findOne({ model, where }) {
        // Simple adapter: we assume queries are by ID or Email for users
        const field = where[0].field;
        const value = where[0].value;
        if (field === "id") {
          const key = `${model}:${value}`;
          const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
          const doc = await stub.getDoc(key);
          return doc?.data as any;
        }
        if (model === "user" && field === "email") {
          return await UserEntity.findByEmail(env, value as string) as any;
        }
        return null;
      },
      async findMany({ model, where }) {
        // Better-auth uses this for sessions or accounts. 
        // We'll return an empty array for simplicity if not easily queryable
        return [];
      },
      async update({ model, where, update }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field !== "id") return null;
        const key = `${model}:${value}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        const current = await stub.getDoc(key);
        if (!current) return null;
        const next = { ...current.data, ...update };
        await stub.casPut(key, current.v, next);
        return next as any;
      },
      async delete({ model, where }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field !== "id") return;
        const key = `${model}:${value}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        await stub.del(key);
      }
    }
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor({
      otpOptions: {
        issuer: "Lumiere Studio",
      }
    })
  ],
  advanced: {
    cookiePrefix: "lumiere",
  },
  trustedOrigins: ["*"], // Restrict in production
});