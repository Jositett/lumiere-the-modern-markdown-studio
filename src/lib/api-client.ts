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
          body: JSON.stringify({ message: errorMsg, url: window.location.href, category: 'network', stack: new Error(errorMsg).stack || '' })
        }).catch(() => {});
      }
      throw new Error(errorMsg);
    }
    return json.data;
  } catch (err: any) {
    const errorMessage = err.message || String(err);
    if (errorMessage !== 'Unauthorized' && errorMessage !== 'Forbidden') {
      // Report client-side errors
      fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: errorMessage, 
          stack: err.stack || '', 
          url: window.location.href, 
          category: 'api-js' 
        })
      }).catch(() => {});
      
      toast.error(errorMessage, { 
        action: { 
          label: 'Copy Report', 
          onClick: () => navigator.clipboard.writeText(
            `URL: ${window.location.href}\nError: ${errorMessage}\nStack: ${err.stack || 'N/A'}`
          ) 
        } 
      });
    }
    throw err;
  }
}