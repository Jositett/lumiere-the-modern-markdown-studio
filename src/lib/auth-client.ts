
/**
 * Fake authClient for compatibility with existing frontend code.
 * Implements same interface as Better-Auth client.
 */
const ls = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, value: string) => localStorage.setItem(key, value),
  remove: (key: string) => localStorage.removeItem(key)
};

export const authClient = {
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(`${window.location.origin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        return {
          data: undefined,
          error: {
            status: res.status,
            message: await res.text() || 'Failed'
          }
        };
      } else {
        const data = await res.json();
        ls.set('lumiere_token', data.token);
        return {
          data: {
            user: data.user,
            session: {
              id: crypto.randomUUID(),
              userId: data.user.id,
              expiresAt: Date.now() + 86400000
            }
          }
        };
      }
    }
  },
  signUp: {
    email: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(`${window.location.origin}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        return {
          data: undefined,
          error: {
            status: res.status,
            message: await res.text() || 'Failed'
          }
        };
      } else {
        const data = await res.json();
        ls.set('lumiere_token', data.token);
        return {
          data: {
            user: data.user,
            session: {
              id: crypto.randomUUID(),
              userId: data.user.id,
              expiresAt: Date.now() + 86400000
            }
          }
        };
      }
    }
  },
  signOut: async () => {
    ls.remove('lumiere_token');
  },
  getSession: async () => {
    const token = ls.get('lumiere_token');
    if (!token) {
      return { data: undefined };
    }
    const res = await fetch(`${window.location.origin}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      return {
        data: {
          user,
          session: {
            id: crypto.randomUUID(),
            userId: user.id,
            expiresAt: Date.now() + 86400000
          }
        }
      };
    } else {
      ls.remove('lumiere_token');
      return { data: undefined };
    }
  },
  twoFactor: {
    verifyTotp: async () => ({ data: { verified: true } }),
    verifyBackupCode: async () => ({ data: { verified: true } }),
    enable: async () => ({
      data: {
        totpURI: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg=='
      }
    })
  }
};
export const { signIn, signUp, signOut, twoFactor } = authClient;