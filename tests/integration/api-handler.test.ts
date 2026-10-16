import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/[...route]';
import { closeDatabase, createDatabase } from '../../server/db';
import { runMigrations } from '../../server/migrations';

const testUrl = process.env.TEST_DATABASE_URL;
const integration = testUrl ? describe : describe.skip;

class ResponseMock {
  statusCode = 200;
  body: unknown;
  headers = new Map<string, string>();
  status(code: number) { this.statusCode = code; return this; }
  json(body: unknown) { this.body = body; return this; }
  end() { return this; }
  setHeader(name: string, value: string | number | readonly string[]) { this.headers.set(name.toLowerCase(), String(value)); return this; }
}

function request(method: string, route: string[], body?: unknown, cookie?: string) {
  return { method, query: { route }, body, headers: cookie ? { cookie } : {} } as unknown as VercelRequest;
}

integration('signed session API boundary', () => {
  const accessCode = `demo-${crypto.randomUUID()}`;
  let cookie = '';
  let caseId = '';

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    process.env.NEXUS_DEMO_ACCESS_CODE = accessCode;
    process.env.NEXUS_SESSION_SECRET = crypto.randomUUID() + crypto.randomUUID();
    const database = createDatabase(testUrl as string);
    await runMigrations(database);
    await database.close();
  }, 120_000);

  afterAll(async () => {
    if (caseId && cookie) await handler(request('DELETE', ['cases', caseId], undefined, cookie), new ResponseMock() as unknown as VercelResponse);
    await closeDatabase();
    delete process.env.NEXUS_DEMO_ACCESS_CODE;
    delete process.env.NEXUS_SESSION_SECRET;
  });

  it('rejects unsigned access, issues a signed cookie, and persists a case through the handler', async () => {
    const unauthorized = new ResponseMock();
    await handler(request('GET', ['cases']), unauthorized as unknown as VercelResponse);
    expect(unauthorized.statusCode).toBe(401);

    const invalid = new ResponseMock();
    await handler(request('POST', ['cases'], { employeeName: '' }, cookie), invalid as unknown as VercelResponse);
    expect(invalid.statusCode).toBe(401);

    const session = new ResponseMock();
    await handler(request('POST', ['session'], { accessCode }), session as unknown as VercelResponse);
    expect(session.statusCode).toBe(204);
    cookie = String(session.headers.get('set-cookie')).split(';')[0];
    expect(cookie).toContain('nexus_demo_session=');
    expect(String(session.headers.get('set-cookie'))).not.toContain('Secure;');

    const invalidSigned = new ResponseMock();
    await handler(request('POST', ['cases'], { employeeName: '' }, cookie), invalidSigned as unknown as VercelResponse);
    expect(invalidSigned.statusCode).toBe(400);
    expect((invalidSigned.body as { error: { message: string } }).error.message).toBe('Request validation failed.');

    const created = new ResponseMock();
    await handler(request('POST', ['cases'], {
      employeeName: `API Test ${crypto.randomUUID().slice(0, 8)}`, transitionKind: 'new_hire', previousOrgUnit: '',
      destinationOrgUnit: 'Digital Delivery', destinationTeam: 'Platform', roleTitle: 'Developer', startDate: '2026-11-05',
      location: 'Hybrid', managerName: 'Test Manager', requirements: { laptop: true, sharedDrive: false, teams: true, distributionList: false, mobile: false, admin: false, building: false, printer: false },
    }, cookie), created as unknown as VercelResponse);
    expect(created.statusCode).toBe(201);
    caseId = String((created.body as { case: { recordId: string } }).case.recordId);

    const bypassCompletion = new ResponseMock();
    await handler(request('PATCH', ['cases', caseId], { status: 'Completed' }, cookie), bypassCompletion as unknown as VercelResponse);
    expect(bypassCompletion.statusCode).toBe(409);
    expect((bypassCompletion.body as { error: { message: string } }).error.message).toContain('completion action');

    const reloaded = new ResponseMock();
    await handler(request('GET', ['cases', caseId], undefined, cookie), reloaded as unknown as VercelResponse);
    expect(reloaded.statusCode).toBe(200);
    expect((reloaded.body as { case: { recordId: string } }).case.recordId).toBe(caseId);

    const bundle = new ResponseMock();
    await handler(request('POST', ['cases', caseId, 'bundle'], undefined, cookie), bundle as unknown as VercelResponse);
    expect(bundle.statusCode).toBe(201);

    const audit = new ResponseMock();
    await handler(request('GET', ['cases', caseId, 'audit'], undefined, cookie), audit as unknown as VercelResponse);
    expect(audit.statusCode).toBe(200);
    const events = (audit.body as { events: Array<{ eventType: string; createdAt: string }> }).events;
    expect(events.map((event) => event.eventType)).toEqual(expect.arrayContaining(['case.created', 'bundle.generated', 'preflight.created']));
    expect(events.every((event) => Boolean(event.createdAt))).toBe(true);
  }, 120_000);
});
