import { describe, expect, it } from 'vitest';
import { canCompleteCase, canTransitionCase, canTransitionTicket, incompleteRequiredTickets, readinessFromTickets } from '../src/domain/workflow';

describe('ticket transitions', () => {
  it('allows the expected submission and fulfillment path', () => {
    expect(canTransitionTicket('draft-ready', 'submitted')).toBe(true);
    expect(canTransitionTicket('submitted', 'in-progress')).toBe(true);
    expect(canTransitionTicket('in-progress', 'complete')).toBe(true);
  });
  it('blocks skipping directly from a draft to complete', () => {
    expect(canTransitionTicket('draft-ready', 'complete')).toBe(false);
    expect(canTransitionTicket('complete', 'in-progress')).toBe(false);
  });
});

describe('case transitions', () => {
  it('allows operational states to change but makes completion terminal', () => {
    expect(canTransitionCase('Active', 'At Risk')).toBe(true);
    expect(canTransitionCase('Waiting', 'Active')).toBe(true);
    expect(canTransitionCase('Completed', 'Active')).toBe(false);
  });
});

describe('completion and readiness', () => {
  it('blocks completion while any required ticket remains incomplete', () => {
    const tickets = [{ required: true, status: 'complete' as const }, { required: true, status: 'waiting' as const }];
    expect(canCompleteCase(tickets)).toBe(false);
    expect(incompleteRequiredTickets(tickets)).toHaveLength(1);
  });
  it('requires at least one ticket and ignores optional blockers', () => {
    expect(canCompleteCase([])).toBe(false);
    expect(canCompleteCase([{ required: true, status: 'complete' }, { required: false, status: 'waiting' }])).toBe(true);
  });
  it('calculates readiness from required stored statuses', () => {
    expect(readinessFromTickets([{ required: true, status: 'complete' }, { required: true, status: 'submitted' }, { required: false, status: 'waiting' }])).toBe(85);
  });
});

