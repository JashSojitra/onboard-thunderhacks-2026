import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZodError } from 'zod';
import { authConfigured, clearSession, issueSession, localDevelopmentAccess, requireSession, validAccessCode } from '../server/auth.js';
import { databaseConfigured } from '../server/db.js';
import { archiveCase, completeCase, createCase, generateBundle, getCase, getPreflight, inputFromRow, listAuditEvents, listCases, RepositoryError, submitBundle, updateCase, updatePrerequisite, updateTicket, type DbRow } from '../server/repository.js';
import { caseInputSchema, sessionSchema, updateCaseSchema, updatePrerequisiteSchema, updateTicketSchema } from '../shared/contracts.js';
import { canTransitionCase, readinessFromTickets } from '../src/domain/workflow.js';
import type { TicketStatus } from '../src/data.js';

class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}

function routeParts(req: VercelRequest) {
  const raw = req.query.route;
  return (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('/') : []).filter(Boolean);
}

function method(req: VercelRequest, expected: string) {
  return req.method?.toUpperCase() === expected;
}

function presentTicket(row: DbRow) {
  return {
    id: row.id, templateKey: row.template_key, name: row.name, category: row.category,
    status: row.status, approvalPath: row.approval_path, actionType: row.action_type,
    icon: row.icon, required: row.required, included: row.included, description: row.draft_description,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function presentPreflight(tasks: DbRow[]) {
  return tasks.map((task) => ({
    id: task.id, name: task.name, outcome: task.outcome, ready: task.ready,
    prerequisites: (task.prerequisites as DbRow[]).map((item) => ({
      id: item.id, ticketId: item.ticket_id, category: item.category, name: item.name,
      status: item.status, owner: item.owner, evidence: item.evidence, nextAction: item.next_action, required: item.required,
    })),
  }));
}

function presentAuditEvent(row: DbRow) {
  return { id: String(row.id), eventType: row.event_type, actor: row.actor, details: row.details, createdAt: row.created_at };
}

function presentCase(row: DbRow, tickets: DbRow[] = []) {
  return {
    recordId: row.id, id: row.case_number, form: inputFromRow(row), status: row.status,
    blocker: row.blocker ?? '', bundleGenerated: Boolean(row.bundle_generated),
    bundleSubmittedAt: row.bundle_submitted_at ?? null, briefGenerated: Boolean(row.brief_generated), createdAt: row.created_at, lastUpdated: row.updated_at,
    tickets: tickets.map(presentTicket),
    readiness: readinessFromTickets(tickets.map((ticket) => ({ required: Boolean(ticket.required), status: ticket.status as TicketStatus }))),
    source: 'persistent' as const,
  };
}

async function handleSession(req: VercelRequest, res: VercelResponse) {
  if (method(req, 'POST')) {
    if (!authConfigured()) throw new HttpError(503, 'Demo access is not configured.');
    const { accessCode } = sessionSchema.parse(req.body);
    if (!validAccessCode(accessCode)) throw new HttpError(401, 'Invalid demo access code.');
    issueSession(req, res);
    return res.status(204).end();
  }
  if (method(req, 'DELETE')) { clearSession(req, res); return res.status(204).end(); }
  throw new HttpError(405, 'Method not allowed.');
}

async function handleCases(req: VercelRequest, res: VercelResponse, parts: string[]) {
  if (parts.length === 1 && method(req, 'GET')) {
    const cases = await listCases();
    return res.status(200).json({ cases: cases.map(({ row, tickets }) => presentCase(row, tickets)) });
  }
  if (parts.length === 1 && method(req, 'POST')) {
    const created = await createCase(caseInputSchema.parse(req.body));
    return res.status(201).json({ case: presentCase(created.row, created.tickets) });
  }

  const caseId = parts[1];
  if (!caseId) throw new HttpError(404, 'Route not found.');

  if (parts.length === 2 && method(req, 'GET')) {
    const current = await getCase(caseId);
    return res.status(200).json({ case: presentCase(current.row, current.tickets) });
  }
  if (parts.length === 2 && method(req, 'PATCH')) {
    const patch = updateCaseSchema.parse(req.body);
    const current = await getCase(caseId);
    const { status, ...formPatch } = patch;
    if (status === 'Completed') throw new HttpError(409, 'Use the completion action so required tickets and Day-One prerequisites are checked together.');
    if (status && !canTransitionCase(current.row.status as 'Active' | 'Waiting' | 'At Risk' | 'Completed', status)) {
      throw new HttpError(409, `Invalid case transition: ${current.row.status} → ${status}.`);
    }
    const merged = caseInputSchema.parse({ ...inputFromRow(current.row), ...formPatch });
    const updated = await updateCase(caseId, merged, status);
    return res.status(200).json({ case: presentCase(updated.row, updated.tickets) });
  }
  if (parts.length === 2 && method(req, 'DELETE')) {
    await archiveCase(caseId);
    return res.status(204).end();
  }
  if (parts[2] === 'bundle' && parts.length === 3 && method(req, 'POST')) {
    const tickets = await generateBundle(caseId);
    return res.status(201).json({ tickets: tickets.map(presentTicket) });
  }
  if (parts[2] === 'submit' && parts.length === 3 && method(req, 'POST')) {
    const tickets = await submitBundle(caseId);
    return res.status(200).json({ tickets: tickets.map(presentTicket) });
  }
  if (parts[2] === 'tickets' && parts[3] && parts.length === 4 && method(req, 'PATCH')) {
    const update = updateTicketSchema.parse(req.body);
    const ticket = await updateTicket(caseId, parts[3], update);
    return res.status(200).json({ ticket: presentTicket(ticket) });
  }
  if (parts[2] === 'preflight' && parts.length === 3 && method(req, 'GET')) {
    return res.status(200).json({ tasks: presentPreflight(await getPreflight(caseId)) });
  }
  if (parts[2] === 'prerequisites' && parts[3] && parts.length === 4 && method(req, 'PATCH')) {
    await updatePrerequisite(caseId, parts[3], updatePrerequisiteSchema.parse(req.body));
    return res.status(200).json({ tasks: presentPreflight(await getPreflight(caseId)) });
  }
  if (parts[2] === 'complete' && parts.length === 3 && method(req, 'POST')) {
    const completed = await completeCase(caseId);
    return res.status(200).json({ case: presentCase(completed.row, completed.tickets) });
  }
  if (parts[2] === 'audit' && parts.length === 3 && method(req, 'GET')) {
    return res.status(200).json({ events: (await listAuditEvents(caseId)).map(presentAuditEvent) });
  }
  throw new HttpError(404, 'Route not found.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const requestId = String(req.headers['x-vercel-id'] ?? crypto.randomUUID());
  try {
    const parts = routeParts(req);
    const localAccess = localDevelopmentAccess(req);
    if (parts[0] === 'health' && method(req, 'GET')) return res.status(200).json({ configured: databaseConfigured() && (authConfigured() || localAccess) });
    if (parts[0] === 'session') return await handleSession(req, res);
    if (!databaseConfigured() || (!authConfigured() && !localAccess)) throw new HttpError(503, 'Persistent backend is not configured. See README.md and .env.example.');
    if (!localAccess && !requireSession(req)) throw new HttpError(401, 'Demo access is required.');
    if (parts[0] === 'cases') return await handleCases(req, res, parts);
    throw new HttpError(404, 'Route not found.');
  } catch (error) {
    const status = error instanceof HttpError || error instanceof RepositoryError ? error.status : error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? 'Request validation failed.' : error instanceof Error ? error.message : 'Unexpected server error.';
    const details = error instanceof ZodError ? error.flatten() : error instanceof HttpError || error instanceof RepositoryError ? error.details : undefined;
    console.error(JSON.stringify({ requestId, status, message, details }));
    return res.status(status).json({ error: { message, details, requestId } });
  }
}
