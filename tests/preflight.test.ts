import { describe, expect, it } from 'vitest';
import { updatePrerequisiteSchema, updateTicketSchema } from '../shared/contracts';
import { generatePreflight } from '../server/preflight';
import { generateTicketBundle } from '../server/tickets';
import { buildRuleBasedBrief } from '../src/domain/starterBrief';

const input = {
  employeeName: 'Taylor Example', transitionKind: 'new_hire' as const, previousOrgUnit: '',
  destinationOrgUnit: 'Digital Delivery', destinationTeam: 'Platform', roleTitle: 'Developer',
  startDate: '2026-10-20', location: 'Hybrid', managerName: 'Morgan Manager',
  requirements: { laptop: true, sharedDrive: true, teams: true, distributionList: false, mobile: false, admin: false, building: false, printer: false },
};

describe('Day-One Preflight', () => {
  it('creates persisted-ready definitions across the required categories and starts with a meaningful blocker', () => {
    const tasks = generatePreflight(input, generateTicketBundle(input));
    const categories = tasks.flatMap((task) => task.prerequisites.map((item) => item.category));
    expect(categories).toEqual(expect.arrayContaining(['equipment', 'account', 'application_access', 'knowledge', 'approval', 'contact']));
    expect(tasks.some((task) => task.prerequisites.some((item) => item.status === 'blocked'))).toBe(true);
  });

  it('requires evidence before a prerequisite can be verified', () => {
    expect(updatePrerequisiteSchema.safeParse({ status: 'verified', owner: 'Manager', evidence: '' }).success).toBe(false);
    expect(updatePrerequisiteSchema.safeParse({ status: 'verified', owner: 'Manager', evidence: 'Employee completed a sign-in test.' }).success).toBe(true);
  });
});

describe('editable request drafts', () => {
  it('accepts a validated draft edit and rejects an empty update', () => {
    expect(updateTicketSchema.safeParse({ name: 'Updated request', included: false }).success).toBe(true);
    expect(updateTicketSchema.safeParse({}).success).toBe(false);
  });
});

describe('starter brief fallback', () => {
  it('is deterministic and flags unresolved statements for confirmation', () => {
    const result = buildRuleBasedBrief('First priority is to test account access. Pending: confirm the onboarding buddy.', 'Taylor', 'Developer', 'Morgan');
    expect(result.map((section) => section.heading)).toEqual(['Role summary', 'Immediate tasks', 'Contacts', 'Procedures', 'Useful references', 'Unresolved questions']);
    expect(result.find((section) => section.heading === 'Unresolved questions')?.items[0]).toContain('Needs confirmation');
  });
});
