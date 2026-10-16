import assert from 'node:assert/strict';
import { scenarios, type FormState } from '../src/data';

const baseUrl = 'http://127.0.0.1:5173';
const cleanupIds: string[] = [];
let cookie = '';

async function call(path: string, init: RequestInit = {}, status = 200) {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (cookie) headers.set('Cookie', cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) as Record<string, unknown> : undefined;
  assert.equal(response.status, status, `${init.method ?? 'GET'} ${path}: ${response.status} ${text.slice(0, 200)}`);
  return { response, body };
}

function input(form: FormState) {
  return {
    employeeName: form.name,
    transitionKind: form.transitionType === 'New Hire' ? 'new_hire' : 'internal_transfer',
    previousOrgUnit: form.transitionType === 'New Hire' ? '' : form.previousMinistry,
    destinationOrgUnit: form.newMinistry, destinationTeam: form.newTeam,
    roleTitle: form.newRole, startDate: form.startDate, location: form.location,
    managerName: form.manager,
    requirements: {
      laptop: form.laptop, sharedDrive: form.sharedDrive, teams: form.teams,
      distributionList: form.distributionList, mobile: form.mobile, admin: form.admin,
      building: form.building, printer: form.printer,
    },
  };
}

async function createCase(body: Record<string, unknown>) {
  const result = await call('/api/cases', { method: 'POST', body: JSON.stringify(body) }, 201);
  const record = result.body?.case as Record<string, unknown>;
  const id = String(record.recordId);
  assert.ok(id);
  cleanupIds.push(id);
  return id;
}

try {
  const accessCode = process.env.NEXUS_DEMO_ACCESS_CODE;
  assert.ok(accessCode);
  const session = await call('/api/session', { method: 'POST', body: JSON.stringify({ accessCode }) }, 204);
  const setCookie = session.response.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /^nexus_demo_session=/);
  assert.doesNotMatch(setCookie, /; Secure/i);
  cookie = setCookie.split(';')[0];

  const maryamId = await createCase(input(scenarios.newhire.form));
  const saved = await call(`/api/cases/${maryamId}`);
  assert.equal((((saved.body?.case as Record<string, unknown>).form as Record<string, unknown>).employeeName), 'Maryam Arif');

  const generated = await call(`/api/cases/${maryamId}/bundle`, { method: 'POST' }, 201);
  const tickets = generated.body?.tickets as Array<Record<string, unknown>>;
  const editable = tickets.find((ticket) => ticket.required === false) ?? tickets[0];
  await call(`/api/cases/${maryamId}/tickets/${String(editable.id)}`, {
    method: 'PATCH', body: JSON.stringify({ name: `${String(editable.name)} — demo edited`, note: 'Maryam demo verification' }),
  });
  await call(`/api/cases/${maryamId}/submit`, { method: 'POST' });

  const preflight = await call(`/api/cases/${maryamId}/preflight`);
  const tasks = preflight.body?.tasks as Array<Record<string, unknown>>;
  const readyBefore = tasks.filter((task) => task.ready).length;
  const blockedTask = tasks.find((task) => (task.prerequisites as Array<Record<string, unknown>>).some((item) => item.required && item.status === 'blocked'));
  assert.ok(blockedTask, 'Expected Maryam to have a blocked prerequisite');
  const prerequisites = blockedTask.prerequisites as Array<Record<string, unknown>>;
  for (const prerequisite of prerequisites.filter((item) => item.required)) {
    await call(`/api/cases/${maryamId}/prerequisites/${String(prerequisite.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'verified', owner: 'Elena Park', evidence: `Fictional demo evidence: ${String(prerequisite.name)}` }),
    });
  }
  const recalculated = await call(`/api/cases/${maryamId}/preflight`);
  const readyAfter = (recalculated.body?.tasks as Array<Record<string, unknown>>).filter((task) => task.ready).length;
  assert.ok(readyAfter > readyBefore, `Expected task readiness to increase: ${readyBefore} -> ${readyAfter}`);

  const audit = await call(`/api/cases/${maryamId}/audit`);
  const eventTypes = (audit.body?.events as Array<Record<string, unknown>>).map((event) => event.eventType);
  for (const expected of ['case.created', 'bundle.generated', 'ticket.draft_updated', 'bundle.submitted_internal', 'prerequisite.updated']) {
    assert.ok(eventTypes.includes(expected), `Missing audit event ${expected}`);
  }
  const reopened = await call(`/api/cases/${maryamId}`);
  assert.equal((reopened.body?.case as Record<string, unknown>).recordId, maryamId);

  const manualId = await createCase({
    employeeName: `Manual Fictional Employee ${crypto.randomUUID().slice(0, 8)}`,
    transitionKind: 'new_hire', previousOrgUnit: '', destinationOrgUnit: 'Fictional Services Ministry',
    destinationTeam: 'Delivery Branch', roleTitle: 'Service Analyst', startDate: '2026-11-10',
    location: 'Hybrid — Toronto', managerName: 'Morgan Lee',
    requirements: { laptop: true, sharedDrive: false, teams: true, distributionList: false, mobile: false, admin: false, building: false, printer: false },
  });
  const manual = await call(`/api/cases/${manualId}`);
  assert.match(String((((manual.body?.case as Record<string, unknown>).form as Record<string, unknown>).employeeName)), /^Manual Fictional Employee /);

  console.log('PASS signed demo session');
  console.log('PASS Maryam editable persistent copy, ticket edit, submission, preflight evidence, readiness recalculation, audit, and reopen');
  console.log('PASS arbitrary fictional employee persistence is independent of Maryam fixture data');
} finally {
  for (const id of cleanupIds.reverse()) {
    try { await call(`/api/cases/${id}`, { method: 'DELETE' }, 204); } catch { console.error(`Cleanup warning for ${id}`); }
  }
}
