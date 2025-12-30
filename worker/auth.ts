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
        if (!where || where.length === 0) return null;
        // Handle field lookups. Better-Auth usually queries by one primary identifier.
        const idQuery = where.find(w => w.field === "id");
        if (idQuery) {
          const key = `${model}:${idQuery.value}`;
          const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
          const doc = await (stub as any).getDoc(key);
          return (doc?.data as any) || null;
        }
        if (model === "user") {
          const emailQuery = where.find(w => w.field === "email");
          if (emailQuery) {
            try {
              const user = await UserEntity.findByEmail(env, emailQuery.value as string);
              return user as any;
            } catch (err) {
              console.error(`[AUTH ADAPTER] findByEmail failed: ${err}`);
              return null;
            }
          }
        }
        return null;
      },
      async findMany({ model, where }: { model: string; where: any[] }) {
        // findMany is less common for simple auth, but we provide a safe fallback
        return [];
      },
      async update({ model, where, update }: { model: string; where: any[]; update: any }) {
        const idQuery = where.find(w => w.field === "id");
        if (!idQuery) {
          console.warn(`[AUTH ADAPTER] update called without ID on model ${model}`);
          return null;
        }
        const key = `${model}:${idQuery.value}`;
        const stub = env.GlobalDurableObject.get(env.GlobalDurableObject.idFromName(key));
        // Small bounded retry for CAS
        for (let i = 0; i < 3; i++) {
          const current = await (stub as any).getDoc(key);
          if (!current) return null;
          const next = { ...current.data, ...update };
          const res = await (stub as any).casPut(key, current.v, next);
          if (res.ok) return next as any;
        }
        throw new Error("Contention in auth database update");
      },
      async delete({ model, where }: { model: string; where: any[] }) {
        const idQuery = where.find(w => w.field === "id");
        if (!idQuery) return;
        const key = `${model}:${idQuery.value}`;
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