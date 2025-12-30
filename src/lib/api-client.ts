import { ApiResponse } from "@shared/types";
import { useEditorStore } from "./store";
import { toast } from 'sonner';

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

          let refreshData: ApiResponse<{ token: string, user: any, refreshToken: string }>;
          try {
            refreshData = await refreshRes.json() as ApiResponse<{ token: string, user: any, refreshToken: string }>;
          } catch {
            useEditorStore.getState().logout();
            return null;
          }

          if (refreshData.success && refreshData.data) {
            const { token, user, refreshToken: nextRefresh } = refreshData.data;
            useEditorStore.getState().setAuth(user, token, nextRefresh);

            // Retry with new token
            const retryHeaders = new Headers(init?.headers);
            retryHeaders.set('Authorization', `Bearer ${token}`);
            const retryRes = await fetch(path, { headers: retryHeaders, ...init });

            return retryRes;
          } else {
            useEditorStore.getState().logout();
            return null;
          }
        } catch (e) {
          toast.error('Session expired. Please login again.');
          useEditorStore.getState().logout();
          return null;
        } finally {
          isRefreshing = false;
        }
      }
    }
    return res;
  };

  const finalRes = await performFetch();
  if (finalRes === null) {
    const error = new Error('Your session expired. Please login again.') as any;
    error.status = 401;
    throw error;
  }

  let json: ApiResponse<T>;
  try {
    json = (await finalRes.json()) as ApiResponse<T>;
  } catch {
    const error = new Error(`Request failed (${finalRes.status})`) as any;
    error.status = finalRes.status;
    throw error;
  }

  if (!finalRes.ok || !json.success || json.data === undefined) {
    const error = new Error(json.error || `Request failed (${finalRes.status})`) as any;
    error.status = finalRes.status;
    error.response = json;
    throw error;
  }
  return json.data;
}
//