import { describe, expect, it } from 'vitest';
import { scenarios } from '../src/data';
import { toCaseInput } from '../src/api';
import { generatePreflight } from '../server/preflight';
import { generateTicketBundle } from '../server/tickets';

describe('fictional release demonstration scenarios', () => {
  it('keeps Maryam Arif on the new-hire workflow with application access initially unverified', () => {
    const input = toCaseInput(scenarios.newhire.form);
    const tickets = generateTicketBundle(input);
    const tasks = generatePreflight(input, tickets);
    const applicationAccess = tasks.flatMap((task) => task.prerequisites).filter((item) => item.category === 'application_access');

    expect(input.employeeName).toBe('Maryam Arif');
    expect(input.transitionKind).toBe('new_hire');
    expect(tickets.some((ticket) => ticket.template_key === 'access-removal')).toBe(false);
    expect(applicationAccess.length).toBeGreaterThan(0);
    expect(applicationAccess.every((item) => item.status !== 'verified')).toBe(true);
  });

  it('keeps Jim Halpert on the transfer workflow with previous-access removal and new-role requests', () => {
    const input = toCaseInput(scenarios.transfer.form);
    const tickets = generateTicketBundle(input);

    expect(input.employeeName).toBe('Jim Halpert');
    expect(input.transitionKind).toBe('internal_transfer');
    expect(input.previousOrgUnit).toBe('Community Programs Ministry');
    expect(input.destinationOrgUnit).toBe('Digital Enablement Ministry');
    expect(tickets.map((ticket) => ticket.template_key)).toEqual(expect.arrayContaining(['access-removal', 'account', 'laptop', 'shared-drive', 'teams']));
  });
});
