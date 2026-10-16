import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '../../server/db';
import { runMigrations } from '../../server/migrations';
import { archiveCase, completeCase, createCase, generateBundle, getCase, getPreflight, listAuditEvents, RepositoryError, submitBundle, updatePrerequisite, updateTicket } from '../../server/repository';
import { readinessFromTickets } from '../../src/domain/workflow';
import type { TicketStatus } from '../../src/data';
import { scenarios } from '../../src/data';
import { toCaseInput } from '../../src/api';

const testUrl = process.env.TEST_DATABASE_URL;
const integration = testUrl ? describe : describe.skip;

integration('Neon persistence workflow', () => {
  let database: Database;
  let caseId = '';
  const caseIds: string[] = [];

  beforeAll(async () => {
    database = createDatabase(testUrl as string);
    await runMigrations(database);
  }, 120_000);

  afterAll(async () => {
    for (const id of caseIds) await archiveCase(id, database).catch(() => undefined);
    await database?.close();
  });

  it('persists a case, tickets, readiness changes, completion guards, and audit events', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const created = await createCase({
      employeeName: `Integration Test ${suffix}`, transitionKind: 'new_hire', previousOrgUnit: '',
      destinationOrgUnit: 'Test Organization', destinationTeam: 'Test Team', roleTitle: 'Tester',
      startDate: '2026-11-01', location: 'Test Location', managerName: 'Test Manager',
      requirements: { laptop: true, sharedDrive: true, teams: true, distributionList: false, mobile: false, admin: false, building: false, printer: false },
    }, database);
    caseId = String(created.row.id);
    caseIds.push(caseId);

    const reloaded = await getCase(caseId, database);
    expect(reloaded.row.employee_name).toBe(`Integration Test ${suffix}`);
    const generated = await generateBundle(caseId, database);
    expect(generated.length).toBeGreaterThan(4);
    const optionalDraft = generated.find((ticket) => ticket.required === false);
    expect(optionalDraft).toBeDefined();
    await updateTicket(caseId, String(optionalDraft?.id), { name: 'Optional team welcome plan', included: false }, database);
    const edited = await getCase(caseId, database);
    expect(edited.tickets.find((ticket) => ticket.id === optionalDraft?.id)).toMatchObject({ name: 'Optional team welcome plan', included: false });
    const before = readinessFromTickets(generated.map((ticket) => ({ required: Boolean(ticket.required), status: ticket.status as TicketStatus })));

    const account = generated.find((ticket) => ticket.template_key === 'account');
    expect(account).toBeDefined();
    await updateTicket(caseId, String(account?.id), { status: 'submitted' }, database);
    const changed = await getCase(caseId, database);
    const after = readinessFromTickets(changed.tickets.map((ticket) => ({ required: Boolean(ticket.required), status: ticket.status as TicketStatus })));
    expect(after).toBeGreaterThan(before);
    await expect(completeCase(caseId, database)).rejects.toMatchObject({ status: 409 } satisfies Partial<RepositoryError>);

    await submitBundle(caseId, database);
    const submitted = await getCase(caseId, database);
    for (const ticket of submitted.tickets.filter((item) => item.included)) {
      if (ticket.status === 'complete') continue;
      if (ticket.status === 'submitted' || ticket.status === 'pending-approval' || ticket.status === 'waiting') {
        await updateTicket(caseId, String(ticket.id), { status: 'in-progress' }, database);
      }
      await updateTicket(caseId, String(ticket.id), { status: 'complete' }, database);
    }

    await expect(completeCase(caseId, database)).rejects.toMatchObject({ status: 409 } satisfies Partial<RepositoryError>);
    const preflight = await getPreflight(caseId, database);
    expect(preflight.some((task) => !task.ready)).toBe(true);
    for (const prerequisite of preflight.flatMap((task) => task.prerequisites).filter((item) => item.required)) {
      await updatePrerequisite(caseId, String(prerequisite.id), { status: 'verified', owner: String(prerequisite.owner), evidence: 'Verified in live integration test.' }, database);
    }

    const completed = await completeCase(caseId, database);
    expect(completed.row.status).toBe('Completed');
    const events = await listAuditEvents(caseId, database);
    expect(events.map((event) => event.event_type)).toEqual(expect.arrayContaining([
      'case.created', 'bundle.generated', 'bundle.submitted_internal', 'ticket.draft_updated', 'ticket.status_changed', 'preflight.created', 'prerequisite.updated', 'case.completed',
    ]));
  }, 120_000);

  it('persists a company-agnostic internal-transfer flow', async () => {
    const created = await createCase(toCaseInput(scenarios.transfer.form), database);
    const id = String(created.row.id); caseIds.push(id);
    const tickets = await generateBundle(id, database);
    expect(tickets.some((ticket) => ticket.template_key === 'access-removal')).toBe(true);
    expect((await getCase(id, database)).row.employee_name).toBe('Jim Halpert');
    expect((await getCase(id, database)).row.previous_org_unit).toBe('Community Programs Ministry');
    expect((await getPreflight(id, database)).length).toBeGreaterThan(0);
  }, 120_000);

  it('creates an editable Maryam demo copy and recalculates readiness from verified evidence', async () => {
    const created = await createCase(toCaseInput(scenarios.newhire.form), database);
    const id = String(created.row.id); caseIds.push(id);
    await generateBundle(id, database);
    const before = await getPreflight(id, database);
    const firstTask = before[0];
    expect(firstTask.ready).toBe(false);
    expect(firstTask.prerequisites.some((item) => item.category === 'application_access' && item.status !== 'verified')).toBe(true);

    for (const prerequisite of firstTask.prerequisites.filter((item) => item.required)) {
      await updatePrerequisite(id, String(prerequisite.id), {
        status: 'verified', owner: String(prerequisite.owner), evidence: 'Verified in the isolated Maryam demo integration test.',
      }, database);
    }
    const after = await getPreflight(id, database);
    expect(after[0].ready).toBe(true);
    expect((await listAuditEvents(id, database)).filter((event) => event.event_type === 'prerequisite.updated').length).toBeGreaterThan(0);
  }, 120_000);
});

