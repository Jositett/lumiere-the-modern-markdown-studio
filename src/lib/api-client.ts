import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lumiere_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }
  
  const res = await fetch(path, { headers, ...init })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}