import type { TicketStatus } from '../data.js';

export type PersistedCaseStatus = 'Active' | 'Waiting' | 'At Risk' | 'Completed';

export const caseTransitions: Record<PersistedCaseStatus, readonly PersistedCaseStatus[]> = {
  Active: ['Waiting', 'At Risk', 'Completed'],
  Waiting: ['Active', 'At Risk', 'Completed'],
  'At Risk': ['Active', 'Waiting', 'Completed'],
  Completed: [],
};

export function canTransitionCase(from: PersistedCaseStatus, to: PersistedCaseStatus) {
  return from === to || caseTransitions[from].includes(to);
}

export const ticketTransitions: Record<TicketStatus, readonly TicketStatus[]> = {
  'draft-ready': ['submitted'],
  optional: ['in-progress', 'complete'],
  'needs-approval': ['pending-approval'],
  attention: ['pending-approval'],
  submitted: ['in-progress', 'waiting'],
  'pending-approval': ['in-progress', 'waiting'],
  'in-progress': ['waiting', 'complete'],
  waiting: ['in-progress', 'complete'],
  'not-started': ['in-progress', 'waiting'],
  complete: [],
};

export function canTransitionTicket(from: TicketStatus, to: TicketStatus) {
  return from === to || ticketTransitions[from].includes(to);
}

export function incompleteRequiredTickets<T extends { required: boolean; status: TicketStatus }>(tickets: T[]) {
  return tickets.filter((ticket) => ticket.required && ticket.status !== 'complete');
}

export function canCompleteCase<T extends { required: boolean; status: TicketStatus }>(tickets: T[]) {
  return tickets.length > 0 && incompleteRequiredTickets(tickets).length === 0;
}

export function readinessFromTickets<T extends { required: boolean; status: TicketStatus }>(tickets: T[]) {
  const required = tickets.filter((ticket) => ticket.required);
  if (required.length === 0) return 0;
  const weights: Record<TicketStatus, number> = {
    complete: 100,
    submitted: 70,
    'in-progress': 50,
    'pending-approval': 35,
    'draft-ready': 20,
    optional: 100,
    'needs-approval': 10,
    attention: 0,
    waiting: 0,
    'not-started': 0,
  };
  return Math.round(required.reduce((sum, ticket) => sum + weights[ticket.status], 0) / required.length);
}

