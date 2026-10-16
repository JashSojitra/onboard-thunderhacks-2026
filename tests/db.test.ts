import { describe, expect, it } from 'vitest';
import { configuredDatabaseUrl } from '../server/db';

describe('Neon environment selection', () => {
  it('prefers DATABASE_URL and supports STORAGE_DATABASE_URL as a fallback', () => {
    expect(configuredDatabaseUrl({ DATABASE_URL: 'postgres://primary', STORAGE_DATABASE_URL: 'postgres://fallback' })).toBe('postgres://primary');
    expect(configuredDatabaseUrl({ STORAGE_DATABASE_URL: 'postgres://fallback' })).toBe('postgres://fallback');
  });

  it('does not rely on browser-exposed variables', () => {
    expect(configuredDatabaseUrl({ VITE_DATABASE_URL: 'postgres://unsafe' })).toBeUndefined();
  });
});
