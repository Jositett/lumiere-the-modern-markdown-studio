import { ApiResponse } from "@shared/types";
import { useEditorStore } from "./store";
import { toast } from 'sonner';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  
  const token = localStorage.getItem('lumiere_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  try {
    const res = await fetch(path, { headers, ...init });
    if (res.status === 401) {
      toast.error('Session expired. Please login again.');
      useEditorStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (res.status === 403) {
      toast.error('Access Denied: Insufficient permissions.');
      throw new Error('Forbidden');
    }
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success || json.data === undefined) {
      const errorMsg = json.error || `Request failed (${res.status})`;
      // Report unexpected failures to the backend for observability
      if (res.status >= 500) {
        fetch('/api/client-errors', {
          method: 'POST',
          body: JSON.stringify({ message: errorMsg, url: window.location.href, category: 'network' })
        }).catch(() => {});
      }
      throw new Error(errorMsg);
    }
    return json.data;
  } catch (err: any) {
    if (err.message !== 'Unauthorized' && err.message !== 'Forbidden') {
      console.error('[API CLIENT ERROR]', err);
    }
    throw err;
  }
}