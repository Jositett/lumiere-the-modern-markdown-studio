import type { Env } from './core-utils';
import { UserEntity } from './entities';
import type { User } from '@shared/types';

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_LENGTH_BYTES = 32;
export const AUTH_SECRET = 'lumiere-super-secret-change-in-production';

function arrayBufferToBase64url(ab: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToArrayBuffer(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padCount = (4 - b64.length % 4) % 4;
  const padded = b64 + '='.repeat(padCount);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function hashPassword(password: string): Promise<{hash: string, salt: string}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = arrayBufferToBase64url(salt.buffer);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_LENGTH_BYTES * 8
  );
  const hash = arrayBufferToBase64url(hashBuffer);
  return { hash, salt: saltB64 };
}

export async function verifyPassword(hash: string, salt: string, password: string): Promise<boolean> {
  const saltBytes = new Uint8Array(base64urlToArrayBuffer(salt));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_LENGTH_BYTES * 8
  );
  const computedHash = arrayBufferToBase64url(hashBuffer);
  return computedHash === hash;
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header: Record<string, string> = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + 86400 };
  
  const headerB64 = arrayBufferToBase64url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = arrayBufferToBase64url(
    new TextEncoder().encode(JSON.stringify(fullPayload))
  );
  const data = `${headerB64}.${payloadB64}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = arrayBufferToBase64url(signature);
  
  return `${data}.${sigB64}`;
}

export async function verifyJwt(token: string, secret: string): Promise<{userId: string} | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    
    const headerBytes = base64urlToArrayBuffer(headerB64);
    const header = JSON.parse(new TextDecoder().decode(headerBytes));
    if (header.alg !== 'HS256') return null;
    
    const payloadBytes = base64urlToArrayBuffer(payloadB64);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as any;
    
    if (payload.exp * 1000 < Date.now()) return null;
    
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = new Uint8Array(base64urlToArrayBuffer(sigB64));
    const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));
    
    if (!valid || !payload.userId) return null;
    
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getUser(env: Env, userId: string): Promise<User | null> {
  const e = new UserEntity(env, userId);
  return await e.getState();
}