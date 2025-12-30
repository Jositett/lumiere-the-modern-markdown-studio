import { ApiResponse } from "@shared/types";
import { useEditorStore } from "./store";
import { toast } from 'sonner';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  const performFetch = async () => {
    const res = await fetch(path, { headers, ...init });
    if (res.status === 401) {
      toast.error('Session expired. Please login again.');
      useEditorStore.getState().logout();
      return null;
    }
    if (res.status === 403) {
      // Forbidden usually means not authorized for a specific resource (e.g. Admin page)
      // but the session is still valid.
      throw new Error('Forbidden: Access denied');
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