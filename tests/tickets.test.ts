import { describe, expect, it } from 'vitest';
import { caseInputSchema } from '../shared/contracts';
import { generateTicketBundle } from '../server/tickets';

const base = {
  employeeName: 'Alex Doe', transitionKind: 'new_hire' as const, previousOrgUnit: '',
  destinationOrgUnit: 'Corporate Services', destinationTeam: 'Platform', roleTitle: 'Developer',
  startDate: '2026-10-20', location: 'Toronto', managerName: 'Casey Manager',
  requirements: { laptop: true, sharedDrive: false, teams: true, distributionList: false, mobile: false, admin: false, building: true, printer: false },
};

describe('case contracts and ticket bundle generation', () => {
  it('creates core and selected requirement tickets for a new hire', () => {
    const tickets = generateTicketBundle(caseInputSchema.parse(base));
    expect(tickets.map((ticket) => ticket.template_key)).toEqual(expect.arrayContaining(['account', 'payroll', 'training', 'security', 'laptop', 'teams', 'building']));
    expect(tickets.some((ticket) => ticket.template_key === 'access-removal')).toBe(false);
  });
  it('adds previous-access removal for internal transfers without assuming OPS ministries', () => {
    const input = caseInputSchema.parse({ ...base, transitionKind: 'internal_transfer', previousOrgUnit: 'Research Division', destinationOrgUnit: 'Digital Delivery' });
    const tickets = generateTicketBundle(input);
    expect(tickets.find((ticket) => ticket.template_key === 'access-removal')?.name).toContain('Previous organization');
  });
  it('rejects an internal transfer without a previous organization', () => {
    expect(() => caseInputSchema.parse({ ...base, transitionKind: 'internal_transfer' })).toThrow();
  });
});

