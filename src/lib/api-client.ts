import { ApiResponse } from "@shared/types";
import { useEditorStore } from "./store";
let isRefreshing = false;
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lumiere_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  const performFetch = async () => {
    const res = await fetch(path, { headers, ...init });
    // Automatic Refresh Logic
    if (res.status === 401 && !isRefreshing) {
      const refreshToken = localStorage.getItem('lumiere_refresh');
      if (refreshToken) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshData = await refreshRes.json() as ApiResponse<{ token: string, user: any, refreshToken: string }>;
          if (refreshData.success && refreshData.data) {
            const { token, user, refreshToken: nextRefresh } = refreshData.data;
            useEditorStore.getState().setAuth(user, token, nextRefresh);
            headers.set('Authorization', `Bearer ${token}`);
            const retryRes = await fetch(path, { headers, ...init });
            return retryRes;
          } else {
            useEditorStore.getState().logout();
          }
        } catch (e) {
          useEditorStore.getState().logout();
        } finally {
          isRefreshing = false;
        }
      }
    }
    return res;
  };
  const finalRes = await performFetch();
  const json = (await finalRes.json()) as ApiResponse<T>;
  if (!finalRes.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'The edge server rejected this request');
  }
  return json.data;
}