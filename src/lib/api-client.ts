import { ApiResponse } from "@shared/types";
import { toast } from 'sonner';
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && document.hasFocus() && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {}
  }
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    textarea.blur();
    document.body.removeChild(textarea);
  }
}

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
      const errorStack = err.stack || '';
      // Report client-side errors
      fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: errorMessage,
          stack: errorStack,
          url: window.location.href,
          category: 'api-js'
        })
      }).catch(() => {});
      
      toast.error(errorMessage, {
        action: {
          label: 'Copy Report',
          onClick: async () => {
            try {
              await copyToClipboard(
                `URL: ${window.location.href}\nError: ${errorMessage}\nStack: ${errorStack || 'N/A'}`
              );
              toast.success('Copied error report');
            } catch(e) {
              console.error(e);
            }
          }
        }
      });
    }
    throw err;
  }
}