import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { UserEntity } from "./entities";
import type { Env } from "./core-utils";
export const getAuth = (env: Env) => betterAuth({
  database: {
    adapter: {
      async create({ model, data }: { model: string; data: any }) {
        const id = data.id || crypto.randomUUID();
        const key = `${model}:${id}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        await (stub as any).casPut(key, 0, data);
        if (model === "user") {
          const idxStub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName("index:users"));
          await (idxStub as any).indexAddBatch([id]);
        }
        return data as any;
      },
      async findOne({ model, where }: { model: string; where: any[] }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field === "id") {
          const key = `${model}:${value}`;
          const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
          const doc = await (stub as any).getDoc(key);
          return (doc?.data as any) || null;
        }
        if (model === "user" && field === "email") {
          const user = await UserEntity.findByEmail(env, value as string);
          return user as any;
        }
        return null;
      },
      async findMany({ model, where }: { model: string; where: any[] }) {
        return [];
      },
      async update({ model, where, update }: { model: string; where: any[]; update: any }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field !== "id") return null;
        const key = `${model}:${value}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        const current = await (stub as any).getDoc(key);
        if (!current) return null;
        const next = { ...current.data, ...update };
        await (stub as any).casPut(key, current.v, next);
        return next as any;
      },
      async delete({ model, where }: { model: string; where: any[] }) {
        const field = where[0].field;
        const value = where[0].value;
        if (field !== "id") return;
        const key = `${model}:${value}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        await (stub as any).del(key);
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