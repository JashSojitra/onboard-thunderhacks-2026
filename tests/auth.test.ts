import { afterEach, describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueSession, localDevelopmentAccess } from '../server/auth';

function responseMock() {
  const headers = new Map<string, string>();
  return {
    headers,
    response: { setHeader: (name: string, value: string | number | readonly string[]) => { headers.set(name.toLowerCase(), String(value)); } } as unknown as VercelResponse,
  };
}

describe('signed demo session cookies', () => {
  afterEach(() => {
    delete process.env.NEXUS_SESSION_SECRET;
    delete process.env.VERCEL_ENV;
    delete process.env.NEXUS_LOCAL_DEMO_AUTO_AUTH;
    delete process.env.VERCEL;
    delete process.env.NODE_ENV;
  });

  it('works over local HTTP without weakening production cookies', () => {
    process.env.NEXUS_SESSION_SECRET = 'a-secure-test-secret-with-more-than-32-characters';
    const local = responseMock();
    issueSession({ headers: { 'x-forwarded-proto': 'http' } } as unknown as VercelRequest, local.response);
    expect(local.headers.get('set-cookie')).toContain('HttpOnly');
    expect(local.headers.get('set-cookie')).not.toContain('Secure;');

    const production = responseMock();
    process.env.VERCEL_ENV = 'production';
    issueSession({ headers: { 'x-forwarded-proto': 'http' } } as unknown as VercelRequest, production.response);
    expect(production.headers.get('set-cookie')).toContain('Secure;');
  });

  it('limits automatic demo access to an explicitly enabled loopback development server', () => {
    const request = (host: string) => ({ headers: { host } }) as unknown as VercelRequest;
    expect(localDevelopmentAccess(request('127.0.0.1:5173'))).toBe(false);

    process.env.NEXUS_LOCAL_DEMO_AUTO_AUTH = 'true';
    expect(localDevelopmentAccess(request('127.0.0.1:5173'))).toBe(true);
    expect(localDevelopmentAccess(request('localhost:5173'))).toBe(true);
    expect(localDevelopmentAccess(request('192.168.1.20:5173'))).toBe(false);
    expect(localDevelopmentAccess(request('onboard.example'))).toBe(false);

    process.env.VERCEL = '1';
    expect(localDevelopmentAccess(request('localhost:5173'))).toBe(false);
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'production';
    expect(localDevelopmentAccess(request('localhost:5173'))).toBe(false);
    delete process.env.NODE_ENV;
  });
});
