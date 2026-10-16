import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE = 'nexus_demo_session';
const MAX_AGE_SECONDS = 8 * 60 * 60;

function encode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookies(req: VercelRequest) {
  return Object.fromEntries((req.headers.cookie ?? '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter((pair) => pair.length === 2));
}

export function authConfigured() {
  return Boolean(process.env.NEXUS_DEMO_ACCESS_CODE && process.env.NEXUS_SESSION_SECRET);
}

export function localDevelopmentAccess(req: VercelRequest) {
  if (process.env.NEXUS_LOCAL_DEMO_AUTO_AUTH !== 'true') return false;
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) return false;

  const host = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;
  return /^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host ?? '');
}

function secureRequest(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return protocol === 'https' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
}

function cookieAttributes(req: VercelRequest, maxAge: number) {
  return `Path=/; HttpOnly; ${secureRequest(req) ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${maxAge}`;
}

export function issueSession(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.NEXUS_SESSION_SECRET;
  if (!secret) throw new Error('NEXUS_SESSION_SECRET is not configured');
  const payload = encode(JSON.stringify({ sub: 'demo-manager', exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }));
  const token = `${payload}.${signature(payload, secret)}`;
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieAttributes(req, MAX_AGE_SECONDS)}`);
}

export function clearSession(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttributes(req, 0)}`);
}

export function validAccessCode(value: string) {
  const configured = process.env.NEXUS_DEMO_ACCESS_CODE ?? '';
  return configured.length >= 8 && safeEqual(value, configured);
}

export function requireSession(req: VercelRequest) {
  const token = cookies(req)[COOKIE];
  const secret = process.env.NEXUS_SESSION_SECRET;
  if (!token || !secret) return false;
  const [payload, provided] = token.split('.');
  if (!payload || !provided || !safeEqual(provided, signature(payload, secret))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number };
    return typeof parsed.exp === 'number' && parsed.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

