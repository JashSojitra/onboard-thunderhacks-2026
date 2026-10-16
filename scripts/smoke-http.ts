import assert from 'node:assert/strict';
import { scenarios, type FormState } from '../src/data';

const baseUrl = process.env.NEXUS_HTTP_BASE_URL ?? 'http://127.0.0.1:5173';
const createdCaseIds: string[] = [];
let cookie = '';

type JsonRecord = Record<string, unknown>;
type ApiTicket = { id: string; name: string; status: string; required: boolean; included: boolean; templateKey: string };
type ApiPrerequisite = { id: string; name: string; status: string; required: boolean };
type ApiTask = { id: string; ready: boolean; prerequisites: ApiPrerequisite[] };

async function request(path: string, init: RequestInit = {}, expected = 200) {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (cookie) headers.set('Cookie', cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
  assert.equal(response.status, expected, `${init.method ?? 'GET'} ${path}: expected ${expected}, received ${response.status}: ${text.slice(0, 300)}`);
  return { response, body: body as JsonRecord };
}

function bodyFor(form: FormState) {
  return {
    employeeName: form.name,
    transitionKind: form.transitionType === 'New Hire' ? 'new_hire' : 'internal_transfer',
    previousOrgUnit: form.transitionType === 'New Hire' ? '' : form.previousMinistry,
    destinationOrgUnit: form.newMinistry,
    destinationTeam: form.newTeam,
    roleTitle: form.newRole,
    startDate: form.startDate,
    location: form.location,
    managerName: form.manager,
    requirements: {
      laptop: form.laptop, sharedDrive: form.sharedDrive, teams: form.teams,
      distributionList: form.distributionList, mobile: form.mobile, admin: form.admin,
      building: form.building, printer: form.printer,
    },
  };
}

async function create(input: JsonRecord) {
  const result = await request('/api/cases', { method: 'POST', body: JSON.stringify(input) }, 201);
  const caseRecord = result.body.case as JsonRecord;
  const id = String(caseRecord.recordId);
  createdCaseIds.push(id);
  return { id, caseRecord };
}

async function main() {
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await home.text(), /<div id="root"><\/div>/);
  console.log('PASS frontend HTML served');

  const health = await request('/api/health');
  assert.equal(health.body.configured, true);
  console.log('PASS API health reports persistent backend configured');

  const accessCode = process.env.NEXUS_DEMO_ACCESS_CODE;
  assert.ok(accessCode, 'NEXUS_DEMO_ACCESS_CODE must be loaded from .env.local');
  const session = await request('/api/session', { method: 'POST', body: JSON.stringify({ accessCode }) }, 204);
  const setCookie = session.response.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /^nexus_demo_session=/);
  if (new URL(baseUrl).protocol === 'https:') assert.match(setCookie, /; Secure/i);
  else assert.doesNotMatch(setCookie, /; Secure/i);
  cookie = setCookie.split(';')[0];
  console.log('PASS signed session cookie issued with environment-appropriate security and accepted');

  const arbitrary = await create({
    employeeName: `HTTP Recovery ${crypto.randomUUID().slice(0, 8)}`,
    transitionKind: 'new_hire', previousOrgUnit: '', destinationOrgUnit: 'Fictional Public Services Ministry',
    destinationTeam: 'Service Recovery Branch', roleTitle: 'Service Analyst', startDate: '2026-11-09',
    location: 'Hybrid — Toronto', managerName: 'Morgan Lee',
    requirements: { laptop: true, sharedDrive: true, teams: true, distributionList: true, mobile: false, admin: false, building: true, printer: false },
  });
  const reloaded = await request(`/api/cases/${arbitrary.id}`);
  assert.equal((reloaded.body.case as JsonRecord).recordId, arbitrary.id);
  console.log('PASS arbitrary intake persisted and reloaded from PostgreSQL');

  const generated = await request(`/api/cases/${arbitrary.id}/bundle`, { method: 'POST' }, 201);
  const drafts = generated.body.tickets as unknown as ApiTicket[];
  assert.ok(drafts.length > 0);
  const optional = drafts.find((ticket) => !ticket.required);
  assert.ok(optional, 'Generated bundle must include an optional draft');
  await request(`/api/cases/${arbitrary.id}/tickets/${optional.id}`, {
    method: 'PATCH', body: JSON.stringify({ name: `${optional.name} — edited`, included: false, note: 'HTTP recovery verification' }),
  });
  await request(`/api/cases/${arbitrary.id}/complete`, { method: 'POST' }, 409);
  const submitted = await request(`/api/cases/${arbitrary.id}/submit`, { method: 'POST' });
  const tickets = submitted.body.tickets as unknown as ApiTicket[];
  assert.equal(tickets.find((ticket) => ticket.id === optional.id)?.included, false);
  console.log('PASS bundle generated, draft edited, optional draft excluded, and simulated bulk submission persisted');

  const before = await request(`/api/cases/${arbitrary.id}`);
  const readinessBefore = Number((before.body.case as JsonRecord).readiness);
  for (const ticket of tickets.filter((item) => item.included && item.required)) {
    if (ticket.status === 'complete') continue;
    if (ticket.status !== 'in-progress') {
      await request(`/api/cases/${arbitrary.id}/tickets/${ticket.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'in-progress', note: 'Fulfillment started' }) });
    }
    await request(`/api/cases/${arbitrary.id}/tickets/${ticket.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'complete', note: 'Fulfillment evidence recorded' }) });
  }
  const afterTickets = await request(`/api/cases/${arbitrary.id}`);
  const readinessAfter = Number((afterTickets.body.case as JsonRecord).readiness);
  assert.ok(readinessAfter > readinessBefore, `Expected readiness to increase (${readinessBefore} -> ${readinessAfter})`);
  await request(`/api/cases/${arbitrary.id}/complete`, { method: 'POST' }, 409);
  console.log('PASS fulfillment updates readiness and completion remains blocked by Day-One prerequisites');

  const preflight = await request(`/api/cases/${arbitrary.id}/preflight`);
  const tasks = preflight.body.tasks as unknown as ApiTask[];
  const readyBefore = tasks.filter((task) => task.ready).length;
  for (const prerequisite of tasks[0].prerequisites.filter((item) => item.required)) {
    await request(`/api/cases/${arbitrary.id}/prerequisites/${prerequisite.id}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'verified', owner: 'HTTP verification', evidence: `Observed evidence for ${prerequisite.name}` }),
    });
  }
  const partiallyVerified = await request(`/api/cases/${arbitrary.id}/preflight`);
  const partialTasks = partiallyVerified.body.tasks as unknown as ApiTask[];
  assert.ok(partialTasks.filter((task) => task.ready).length > readyBefore);
  for (const task of partialTasks) {
    for (const prerequisite of task.prerequisites.filter((item) => item.required && item.status !== 'verified')) {
      await request(`/api/cases/${arbitrary.id}/prerequisites/${prerequisite.id}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'verified', owner: 'HTTP verification', evidence: `Observed evidence for ${prerequisite.name}` }),
      });
    }
  }
  const completed = await request(`/api/cases/${arbitrary.id}/complete`, { method: 'POST' });
  assert.equal((completed.body.case as JsonRecord).status, 'Completed');
  console.log('PASS evidence verification recalculates preflight and permits guarded completion');

  const audit = await request(`/api/cases/${arbitrary.id}/audit`);
  const events = audit.body.events as unknown as Array<{ eventType: string }>;
  for (const expected of ['case.created', 'bundle.generated', 'ticket.draft_updated', 'bundle.submitted_internal', 'ticket.status_changed', 'prerequisite.updated', 'case.completed']) {
    assert.ok(events.some((event) => event.eventType === expected), `Missing audit event ${expected}`);
  }
  const reopened = await request(`/api/cases/${arbitrary.id}`);
  assert.equal((reopened.body.case as JsonRecord).status, 'Completed');
  console.log('PASS audit history persisted and completed case reopened after refresh request');

  for (const scenarioId of ['newhire', 'transfer'] as const) {
    const demo = await create(bodyFor(scenarios[scenarioId].form));
    const bundle = await request(`/api/cases/${demo.id}/bundle`, { method: 'POST' }, 201);
    const demoTickets = bundle.body.tickets as unknown as ApiTicket[];
    const demoPreflight = await request(`/api/cases/${demo.id}/preflight`);
    const demoTasks = demoPreflight.body.tasks as unknown as ApiTask[];
    assert.ok(demoTickets.length > 0 && demoTasks.length > 0);
    if (scenarioId === 'newhire') {
      assert.ok(demoTasks.flatMap((task) => task.prerequisites).some((item) => item.required && item.status !== 'verified'));
    } else {
      assert.ok(demoTickets.some((ticket) => ticket.templateKey === 'access-removal'));
    }
  }
  console.log('PASS Maryam Arif and Jim Halpert create editable persistent demo copies through the same APIs');
}

try {
  await main();
} finally {
  for (const caseId of createdCaseIds.reverse()) {
    try { await request(`/api/cases/${caseId}`, { method: 'DELETE' }, 204); } catch (error) { console.error(`Cleanup warning for ${caseId}:`, error); }
  }
}
