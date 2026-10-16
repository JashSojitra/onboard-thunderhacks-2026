import type { CaseInput } from '../shared/contracts.js';
import type { TicketStatus } from '../src/data.js';

export interface GeneratedTicket {
  template_key: string;
  name: string;
  category: string;
  status: TicketStatus;
  approval_path: string;
  action_type: 'onrequest' | 'facilities' | 'removal';
  icon: string;
  required: boolean;
}

export function generateTicketBundle(input: CaseInput): GeneratedTicket[] {
  const transfer = input.transitionKind === 'internal_transfer';
  const rows: GeneratedTicket[] = [
    ticket('account', 'Employee account setup', 'IT', 'draft-ready', 'Standard approval', 'onrequest', 'mail'),
    ticket('payroll', transfer ? 'Payroll transfer form' : 'Payroll / employee record setup', 'HR', transfer ? 'waiting' : 'draft-ready', 'Manager approval', 'onrequest', 'file-text'),
    ticket('training', 'Optional onboarding plan', 'People Operations', 'draft-ready', 'Manager approval', 'onrequest', 'graduation-cap', false),
    ticket('security', 'Security review', 'Security', transfer ? 'attention' : 'draft-ready', transfer ? 'IT / security review' : 'Standard approval', 'onrequest', 'shield'),
  ];
  const r = input.requirements;
  if (r.laptop) rows.push(ticket('laptop', 'Laptop / asset request', 'IT', 'draft-ready', 'Standard approval', 'onrequest', 'laptop'));
  if (r.sharedDrive) {
    rows.push(ticket('shared-drive', 'Shared drive access', 'IT', 'draft-ready', 'Data owner approval', 'onrequest', 'hard-drive'));
    rows.push(ticket('sharepoint', 'SharePoint access', 'IT', 'draft-ready', 'Manager approval', 'onrequest', 'folder'));
  }
  if (r.teams) rows.push(ticket('teams', 'Teams channel access', 'IT', 'draft-ready', 'Manager approval', 'onrequest', 'message-square'));
  if (r.distributionList) rows.push(ticket('dist-list', 'Distribution list access', 'IT', 'draft-ready', 'Manager approval', 'onrequest', 'mail'));
  if (r.mobile) rows.push(ticket('mobile', 'Mobile number / SIM request', 'Telecom', 'draft-ready', 'Manager + telecom approval', 'onrequest', 'smartphone'));
  if (r.admin) rows.push(ticket('admin', 'Admin privileges', 'Security', 'needs-approval', 'Cyber / security approval', 'onrequest', 'shield'));
  if (r.building) rows.push(ticket('building', `Building access — ${input.location}`, 'Facilities', 'draft-ready', 'Facilities approval', 'facilities', 'key'));
  if (r.printer) rows.push(ticket('printer', `Printer / FMP setup — ${input.location}`, 'IT', 'draft-ready', 'Standard approval', 'onrequest', 'printer'));
  if (transfer) rows.push(ticket('access-removal', 'Previous organization access removal', 'Security', 'attention', 'IT / security review', 'removal', 'trash'));
  return rows;
}

function ticket(template_key: string, name: string, category: string, status: TicketStatus, approval_path: string, action_type: GeneratedTicket['action_type'], icon: string, required = true): GeneratedTicket {
  return { template_key, name, category, status, approval_path, action_type, icon, required };
}

