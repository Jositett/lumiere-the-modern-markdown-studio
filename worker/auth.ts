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
      async create({ model, data }: { model: string; data: any }) {
        const id = data.id || crypto.randomUUID();
        const key = `${model}:${id}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        await stub.casPut(key, 0, data);
        if (model === "user") {
          const idxStub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName("index:users"));
          await idxStub.indexAddBatch([id]);
        }
        return data as any;
      },
      async findOne({ model, where }: { model: string; where: any[] }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field === "id") {
          const key = `${model}:${value}`;
          const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
          const doc = await stub.getDoc(key);
          return (doc?.data as any) || null;
        }
        if (model === "user" && field === "email") {
          const user = await UserEntity.findByEmail(env, value as string);
          return user as any;
        }
        return null;
      },
      async findMany({ model, where }: { model: string; where: any[] }) {
        // Limited implementation for simple session/account lookups
        return [];
      },
      async update({ model, where, update }: { model: string; where: any[]; update: any }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field !== "id") return null;
        const key = `${model}:${value}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        const current = await stub.getDoc<any>(key);
        if (!current) return null;
        const next = { ...current.data, ...update };
        await stub.casPut(key, current.v, next);
        return next as any;
      },
      async delete({ model, where }: { model: string; where: any[] }) {
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
      issuer: "Lumiere Studio",
    })
  ],
  advanced: {
    cookiePrefix: "lumiere",
  },
  trustedOrigins: ["*"],
});