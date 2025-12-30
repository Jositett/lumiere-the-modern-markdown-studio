import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
/**
 * Better-Auth Client instance for frontend communication.
 */
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [
    twoFactorClient()
  ]
});
export const { signIn, signUp, signOut, useSession, twoFactor } = authClient;