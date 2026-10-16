import type { CaseInput } from '../shared/contracts.js';
import type { z } from 'zod';
import type { updatePrerequisiteSchema, updateTicketSchema } from '../shared/contracts.js';
import { caseInputSchema } from '../shared/contracts.js';
import type { TicketStatus } from '../src/data.js';
import { canCompleteCase, canTransitionTicket, incompleteRequiredTickets } from '../src/domain/workflow.js';
import { db, type Database, type SqlExecutor } from './db.js';
import { generateTicketBundle } from './tickets.js';
import { generatePreflight } from './preflight.js';

type TicketUpdate = z.infer<typeof updateTicketSchema>;
type PrerequisiteUpdate = z.infer<typeof updatePrerequisiteSchema>;

export type DbRow = Record<string, unknown>;
export class RepositoryError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}

function formValues(input: CaseInput) {
  return [input.transitionKind, input.employeeName, input.previousOrgUnit || null, input.destinationOrgUnit,
    input.destinationTeam || null, input.roleTitle, input.startDate, input.location, input.managerName,
    JSON.stringify(input.requirements)];
}

export function inputFromRow(row: DbRow): CaseInput {
  const startDate = row.start_date instanceof Date
    ? row.start_date.toISOString().slice(0, 10)
    : row.start_date;
  return caseInputSchema.parse({ employeeName: row.employee_name, transitionKind: row.transition_kind,
    previousOrgUnit: row.previous_org_unit ?? '', destinationOrgUnit: row.destination_org_unit,
    destinationTeam: row.destination_team ?? '', roleTitle: row.role_title, startDate,
    location: row.location, managerName: row.manager_name, requirements: row.requirements });
}

async function audit(executor: SqlExecutor, caseId: string, eventType: string, details: Record<string, unknown> = {}) {
  await executor.query('insert into nexus_audit_events (case_id, event_type, actor, details) values ($1, $2, $3, $4::jsonb)',
    [caseId, eventType, 'demo-manager', JSON.stringify(details)]);
}

async function lockCase(executor: SqlExecutor, caseId: string) {
  await executor.query('select pg_advisory_xact_lock(hashtext($1))', [caseId]);
}

export async function getCase(caseId: string, executor: SqlExecutor = db()) {
  const [caseResult, ticketResult] = await Promise.all([
    executor.query<DbRow>('select * from nexus_cases where id = $1 and deleted_at is null', [caseId]),
    executor.query<DbRow>('select * from nexus_tickets where case_id = $1 order by created_at', [caseId]),
  ]);
  if (!caseResult.rows[0]) throw new RepositoryError(404, 'Transition case not found.');
  return { row: caseResult.rows[0], tickets: ticketResult.rows };
}

export async function listCases(database: Database = db()) {
  const caseResult = await database.query<DbRow>('select * from nexus_cases where deleted_at is null order by updated_at desc');
  if (caseResult.rows.length === 0) return [];
  const ticketResult = await database.query<DbRow>('select * from nexus_tickets where case_id = any($1::uuid[]) order by created_at', [caseResult.rows.map((row) => row.id)]);
  return caseResult.rows.map((row) => ({ row, tickets: ticketResult.rows.filter((ticket) => ticket.case_id === row.id) }));
}

export async function createCase(input: CaseInput, database: Database = db()) {
  return database.transaction(async (executor) => {
    const result = await executor.query<DbRow>(`insert into nexus_cases
      (transition_kind, employee_name, previous_org_unit, destination_org_unit, destination_team, role_title, start_date, location, manager_name, requirements)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) returning *`, formValues(input));
    const row = result.rows[0];
    await audit(executor, String(row.id), 'case.created', { transitionKind: input.transitionKind });
    return { row, tickets: [] as DbRow[] };
  });
}

export async function updateCase(caseId: string, input: CaseInput, status: string | undefined, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId);
    const current = await getCase(caseId, executor);
    const result = await executor.query<DbRow>(`update nexus_cases set transition_kind=$1, employee_name=$2,
      previous_org_unit=$3, destination_org_unit=$4, destination_team=$5, role_title=$6, start_date=$7,
      location=$8, manager_name=$9, requirements=$10::jsonb, status=coalesce($11,status) where id=$12 returning *`,
    [...formValues(input), status ?? null, caseId]);
    const row = result.rows[0];
    await audit(executor, caseId, status ? 'case.status_changed' : 'case.updated', status ? { from: current.row.status, to: status } : {});
    return { row, tickets: current.tickets };
  });
}

export async function archiveCase(caseId: string, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId); await getCase(caseId, executor);
    await executor.query('update nexus_cases set deleted_at = now() where id = $1', [caseId]);
    await audit(executor, caseId, 'case.archived');
  });
}

export async function generateBundle(caseId: string, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId);
    const current = await getCase(caseId, executor);
    const progressed = current.tickets.some((ticket) => !['draft-ready', 'needs-approval', 'attention', 'waiting'].includes(String(ticket.status)));
    if (progressed) throw new RepositoryError(409, 'A submitted or in-progress bundle cannot be regenerated.');
    const generated = generateTicketBundle(inputFromRow(current.row));
    await executor.query('delete from nexus_prerequisites where case_id = $1', [caseId]);
    await executor.query('delete from nexus_work_tasks where case_id = $1', [caseId]);
    await executor.query('delete from nexus_tickets where case_id = $1', [caseId]);
    const tickets: DbRow[] = [];
    for (const ticket of generated) {
      const result = await executor.query<DbRow>(`insert into nexus_tickets
        (case_id, template_key, name, category, status, approval_path, action_type, icon, required)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [caseId, ticket.template_key, ticket.name, ticket.category, ticket.status, ticket.approval_path, ticket.action_type, ticket.icon, ticket.required]);
      tickets.push(result.rows[0]);
    }
    {
      const ticketIds = new Map(tickets.map((ticket) => [String(ticket.template_key), String(ticket.id)]));
      const preflight = generatePreflight(inputFromRow(current.row), generated);
      for (const [position, task] of preflight.entries()) {
        const taskResult = await executor.query<DbRow>(
          'insert into nexus_work_tasks (case_id, name, outcome, position) values ($1,$2,$3,$4) returning *',
          [caseId, task.name, task.outcome, position],
        );
        for (const prerequisite of task.prerequisites) {
          await executor.query(`insert into nexus_prerequisites
            (case_id, task_id, ticket_id, category, name, status, owner, next_action)
            values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [caseId, taskResult.rows[0].id, prerequisite.templateKey ? ticketIds.get(prerequisite.templateKey) ?? null : null,
            prerequisite.category, prerequisite.name, prerequisite.status ?? 'unknown', prerequisite.owner, prerequisite.nextAction]);
        }
      }
      await audit(executor, caseId, 'preflight.created', { taskCount: preflight.length });
    }
    const blocker = generated.find((ticket) => ['attention', 'waiting', 'needs-approval'].includes(ticket.status))?.name ?? '';
    await executor.query('update nexus_cases set bundle_generated = true, blocker = $2 where id = $1', [caseId, blocker]);
    await audit(executor, caseId, 'bundle.generated', { ticketCount: tickets.length });
    return tickets;
  });
}

export async function submitBundle(caseId: string, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId);
    const current = await getCase(caseId, executor);
    if (current.tickets.length === 0) throw new RepositoryError(409, 'Generate a ticket bundle before submission.');
    if (current.row.bundle_submitted_at) throw new RepositoryError(409, 'This bundle has already been internally submitted.');
    const tickets: DbRow[] = [];
    for (const ticket of current.tickets) {
      const next = !ticket.included ? ticket.status : ticket.status === 'draft-ready' ? 'submitted' : ['needs-approval', 'attention'].includes(String(ticket.status)) ? 'pending-approval' : ticket.status;
      const result = await executor.query<DbRow>('update nexus_tickets set status = $2 where id = $1 returning *', [ticket.id, next]);
      tickets.push(result.rows[0]);
    }
    const includedCount = tickets.filter((ticket) => ticket.included).length;
    await executor.query('update nexus_cases set bundle_submitted_at = now() where id = $1', [caseId]);
    await audit(executor, caseId, 'bundle.submitted_internal', { includedCount, excludedCount: tickets.length - includedCount, externalTicketsCreated: false });
    return tickets;
  });
}

export async function updateTicket(caseId: string, ticketId: string, update: TicketUpdate, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId);
    const result = await executor.query<DbRow>(`select ticket.*, transition_case.bundle_submitted_at
      from nexus_tickets ticket join nexus_cases transition_case on transition_case.id=ticket.case_id
      where ticket.case_id=$1 and ticket.id=$2 for update of ticket`, [caseId, ticketId]);
    const ticket = result.rows[0];
    if (!ticket) throw new RepositoryError(404, 'Ticket not found.');
    const draftStatuses = ['draft-ready', 'needs-approval', 'attention', 'optional'];
    const editsDraft = update.name !== undefined || update.category !== undefined || update.approvalPath !== undefined || update.description !== undefined || update.included !== undefined;
    if (editsDraft && (ticket.bundle_submitted_at || !draftStatuses.includes(String(ticket.status)))) throw new RepositoryError(409, 'Submitted ticket drafts can no longer be edited or excluded.');
    if (update.included === false && ticket.required) throw new RepositoryError(409, 'Required ticket drafts cannot be excluded.');
    if (update.status && !canTransitionTicket(ticket.status as TicketStatus, update.status)) throw new RepositoryError(409, `Invalid ticket transition: ${ticket.status} to ${update.status}.`);
    const updated = await executor.query<DbRow>(`update nexus_tickets set
      status=coalesce($3,status), name=coalesce($4,name), category=coalesce($5,category),
      approval_path=coalesce($6,approval_path), draft_description=coalesce($7,draft_description),
      included=coalesce($8,included) where case_id=$1 and id=$2 returning *`,
    [caseId, ticketId, update.status ?? null, update.name ?? null, update.category ?? null,
      update.approvalPath ?? null, update.description ?? null, update.included ?? null]);
    await audit(executor, caseId, update.status ? 'ticket.status_changed' : 'ticket.draft_updated', {
      ticketId, templateKey: ticket.template_key, from: ticket.status, to: update.status, included: update.included, note: update.note,
    });
    return updated.rows[0];
  });
}

export async function getPreflight(caseId: string, database: Database = db()) {
  await getCase(caseId, database);
  const [taskResult, prerequisiteResult] = await Promise.all([
    database.query<DbRow>('select * from nexus_work_tasks where case_id = $1 order by position, created_at', [caseId]),
    database.query<DbRow>('select * from nexus_prerequisites where case_id = $1 order by created_at', [caseId]),
  ]);
  return taskResult.rows.map((task) => {
    const prerequisites = prerequisiteResult.rows.filter((item) => item.task_id === task.id);
    const required = prerequisites.filter((item) => item.required);
    return { ...task, prerequisites, ready: required.length > 0 && required.every((item) => item.status === 'verified') };
  });
}

export async function updatePrerequisite(caseId: string, prerequisiteId: string, update: PrerequisiteUpdate, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId);
    const current = await executor.query<DbRow>('select * from nexus_prerequisites where case_id=$1 and id=$2 for update', [caseId, prerequisiteId]);
    const prerequisite = current.rows[0];
    if (!prerequisite) throw new RepositoryError(404, 'Prerequisite not found.');
    const result = await executor.query<DbRow>(
      'update nexus_prerequisites set status=$3, owner=$4, evidence=$5 where case_id=$1 and id=$2 returning *',
      [caseId, prerequisiteId, update.status, update.owner, update.evidence],
    );
    await audit(executor, caseId, 'prerequisite.updated', { prerequisiteId, from: prerequisite.status, to: update.status, owner: update.owner });
    return result.rows[0];
  });
}

export async function completeCase(caseId: string, database: Database = db()) {
  return database.transaction(async (executor) => {
    await lockCase(executor, caseId);
    const current = await getCase(caseId, executor);
    const tracked = current.tickets.filter((ticket) => ticket.included).map((ticket) => ({ id: ticket.id, name: ticket.name, required: Boolean(ticket.required), status: ticket.status as TicketStatus }));
    const blockers = incompleteRequiredTickets(tracked);
    if (!canCompleteCase(tracked)) throw new RepositoryError(409, 'Required blockers remain. Complete all required tickets before completing the case.', { blockers });
    const prerequisites = await executor.query<DbRow>("select id, name, owner, status from nexus_prerequisites where case_id=$1 and required and status <> 'verified'", [caseId]);
    if (prerequisites.rows.length) throw new RepositoryError(409, 'Required Day-One Preflight blockers remain.', { blockers: prerequisites.rows });
    const result = await executor.query<DbRow>("update nexus_cases set status = 'Completed', blocker = '' where id = $1 returning *", [caseId]);
    await audit(executor, caseId, 'case.completed');
    return { row: result.rows[0], tickets: current.tickets };
  });
}

export async function listAuditEvents(caseId: string, database: Database = db()) {
  await getCase(caseId, database);
  const result = await database.query<DbRow>('select * from nexus_audit_events where case_id = $1 order by created_at desc', [caseId]);
  return result.rows;
}
