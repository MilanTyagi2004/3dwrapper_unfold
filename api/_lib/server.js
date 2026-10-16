// ════════════════════════════════════════════════════════════════════
//  SERVER-ONLY helpers (Vercel Serverless Functions).
//  Files in /api are never bundled into the browser. Files/folders that
//  start with "_" are not exposed as routes.
//  Required env vars (set in Vercel → Settings → Environment Variables,
//  WITHOUT the VITE_ prefix):
//    SUPABASE_URL         = https://<project>.supabase.co
//    SUPABASE_SECRET_KEY  = sb_secret_...   (or legacy service_role key)
// ════════════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const ADMIN_COOKIE = 'df_admin';
const MAX_BODY_BYTES = 10_000;

function getSigningSecret() {
  return process.env.ADMIN_SIGNING_SECRET || process.env.SUPABASE_SECRET_KEY || 'demonic_secret_signing_seed_2026';
}

export function createSignedToken(payload) {
  const secret = getSigningSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySignedToken(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const secret = getSigningSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');

  const bufA = Buffer.from(sig);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  send(res, 405, { error: 'Method not allowed' });
  return false;
}

// Works on Vercel (pre-parsed req.body) and in the Vite dev middleware (raw stream)
export async function readJson(req) {
  try {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  } catch {
    return {};
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return {};
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

export function getCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function sessionCookie(token, maxAgeSeconds) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const parts = [
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/api',
    'HttpOnly', // not readable from JavaScript / DevTools console
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export const clearSessionCookie = () => sessionCookie('', 0);

export async function isAdminUser(db, userId) {
  const { data, error } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && !!data;
}

// Returns the admin user for a valid session cookie, otherwise null
export async function requireAdmin(req) {
  const token = getCookie(req, ADMIN_COOKIE);
  if (!token) return null;

  // 1. Check signed HMAC token (issued via direct server ADMIN_PASSWORD)
  const payload = verifySignedToken(token);
  if (payload && payload.role === 'admin') {
    return { id: 'server-admin', email: payload.email || 'admin@demonicfuel.com', role: 'admin' };
  }

  // 2. Fallback to Supabase Auth access_token (issued via email/password)
  try {
    const db = getServiceClient();
    const { data, error } = await db.auth.getUser(token);
    if (!error && data?.user) {
      const authorized = await isAdminUser(db, data.user.id);
      if (authorized) return data.user;
    }
  } catch {
    /* fallback failsafe */
  }

  return null;
}

/* ── Validation ─────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+\-() ]{6,20}$/;

export const cleanStr = (v, max) =>
  typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';

export const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
export const isPhone = (v) => typeof v === 'string' && PHONE_RE.test(v);
