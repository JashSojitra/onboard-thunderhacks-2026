import type { CaseInput } from '../shared/contracts.js';
import type { GeneratedTicket } from './tickets.js';

export type PrerequisiteCategory = 'equipment' | 'account' | 'application_access' | 'knowledge' | 'approval' | 'contact';

export interface SeedPrerequisite {
  templateKey?: string;
  category: PrerequisiteCategory;
  name: string;
  owner: string;
  nextAction: string;
  status?: 'unknown' | 'blocked' | 'verified';
}

export interface SeedWorkTask {
  name: string;
  outcome: string;
  prerequisites: SeedPrerequisite[];
}

export function generatePreflight(input: CaseInput, tickets: GeneratedTicket[]): SeedWorkTask[] {
  const available = new Set(tickets.map((ticket) => ticket.template_key));
  const access: SeedPrerequisite[] = [
    prerequisite('account', 'account', 'Employee can sign in with their own account', 'IT service owner', 'Employee completes a successful sign-in test.'),
  ];
  if (available.has('teams')) access.push(prerequisite('teams', 'application_access', 'Employee can open the team collaboration space', input.managerName, 'Employee opens the team space and posts a test message.'));
  access.push({ category: 'contact', name: 'Escalation contact is known', owner: input.managerName, nextAction: 'Manager confirms the first support contact with the employee.', status: 'verified' });

  const firstAssignment: SeedPrerequisite[] = [];
  if (available.has('laptop')) firstAssignment.push(prerequisite('laptop', 'equipment', 'Assigned device is usable', 'IT asset owner', 'Employee boots the device and confirms required peripherals work.'));
  if (available.has('shared-drive')) firstAssignment.push(prerequisite('shared-drive', 'application_access', 'Required working files are accessible', 'Data owner', 'Employee opens the working folder with least-privilege access.'));
  firstAssignment.push({
    category: 'knowledge', name: 'First assignment instructions are understood', owner: input.managerName,
    nextAction: 'Manager walks through the first assignment and employee confirms the expected outcome.', status: 'blocked',
  });
  firstAssignment.push({
    category: 'approval', name: 'Manager authorizes the first assignment', owner: input.managerName,
    nextAction: 'Manager records approval after prerequisites are demonstrated.', status: 'unknown',
  });

  return [
    { name: 'Join the first team check-in', outcome: 'The employee signs in, reaches the team space, and knows where to ask for help.', prerequisites: access },
    { name: `Complete the first ${input.roleTitle || 'role'} assignment`, outcome: 'The employee demonstrates access, understanding, and authorization for meaningful work.', prerequisites: firstAssignment },
  ];
}

function prerequisite(templateKey: string, category: PrerequisiteCategory, name: string, owner: string, nextAction: string): SeedPrerequisite {
  return { templateKey, category, name, owner, nextAction, status: 'unknown' };
}
