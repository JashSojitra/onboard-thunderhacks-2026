// ============================================================
// Onboard — Types, Scenarios, and Dynamic Generators
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high';
export type TicketStatus =
  | 'draft-ready'
  | 'optional'
  | 'needs-approval'
  | 'attention'
  | 'submitted'
  | 'pending-approval'
  | 'in-progress'
  | 'waiting'
  | 'not-started'
  | 'complete';

export type TransitionType = 'Ministry Transfer' | 'New Hire' | '';
export type ScenarioId = 'transfer' | 'newhire' | 'blank' | null;

export interface FormState {
  name: string;
  transitionType: TransitionType;
  previousMinistry: string;
  newMinistry: string;
  newTeam: string;
  newRole: string;
  startDate: string;
  location: string;
  manager: string;
  laptop: boolean;
  sharedDrive: boolean;
  teams: boolean;
  distributionList: boolean;
  mobile: boolean;
  admin: boolean;
  building: boolean;
  printer: boolean;
}

export interface Ticket {
  id: string;
  name: string;
  category: string;
  status: TicketStatus;
  approvalPath: string;
  actionLabel: string;
  actionType: 'onrequest' | 'facilities' | 'removal';
  icon: string;
  required?: boolean;
  included?: boolean;
  description?: string;
}

export interface DashboardRow {
  id: string;
  area: string;
  ticketStatus: TicketStatus;
  insight: string;
  risk: RiskLevel;
  icon: string;
}

export interface AccessRow {
  id: string;
  item: string;
  kind: 'current' | 'new';
  recommendation: string;
  approval: string;
  reason: string;
}

export interface BriefSection {
  heading: string;
  icon: string;
  items: { label: string; value: string }[];
}

export const ministryOptions = ['Corporate Services', 'Digital Delivery', 'Client Operations', 'Finance', 'Legal'] as const;
export const locationOptions = [
  'Toronto office',
  'North Bay office',
  'Hybrid — Toronto',
  'Remote — Ontario',
] as const;

// ============================================================
// Scenarios
// ============================================================

export const transferDemoHandoverNotes = `Jim is transferring from the Community Programs Ministry into the Service Improvement Advisor role with the Workplace Collaboration Branch at the Digital Enablement Ministry. He will work hybrid from the Toronto office.

Main responsibilities include reviewing service metrics, maintaining process documentation, coordinating operational improvements, and supporting the weekly service-improvement review.

Elena Park is the manager and first contact for priorities, approvals, and escalations. Jim should meet the branch lead, service owner, and access approver during his first week.

First-week priorities: confirm account and laptop readiness, open the Workplace Collaboration workspace, review the operating playbook, attend the service-improvement review, and complete a first service-metrics summary.

Important references include the Workplace Collaboration knowledge base, service-metrics glossary, escalation guide, and review template.

Open items: confirm removal of unnecessary Community Programs folders and channels; verify Workplace Collaboration workspace access; confirm the assigned transition buddy.

Questions Jim should ask Elena: which metrics need attention first, who approves changes, and which procedures still require confirmation?`;

export const newHireDemoHandoverNotes = `Maryam is joining the Service Experience Branch as a Service Operations Coordinator in the Civic Services Ministry and will work hybrid from the Toronto office.

The first meaningful task is to review a new service request, confirm its priority and ownership, and prepare a short handoff summary for the daily operations check-in.

Elena Park is the manager and first contact for priorities and approvals. Maryam should meet the service lead, onboarding buddy, and application-access owner during the first week.

First-week priorities: confirm account and laptop readiness, verify access to Teams and the shared service workspace, review the request-handling guide, and complete one supervised request summary.

Important references include the service catalogue, escalation guide, request template, and team contact list.

Open items: application access is not yet verified, the onboarding buddy must be confirmed, and Elena must approve the first request before it is sent.

Questions Maryam should ask Elena: which request should be handled first, what requires escalation, and who provides final approval?`;

export interface ScenarioData { label: string; form: FormState; handoverNotes?: string; }
export const scenarios: Record<string, ScenarioData> = {
  transfer: {
    label: 'Jim Halpert — Fictional Ministry Transfer Demo',
    handoverNotes: transferDemoHandoverNotes,
    form: {
      name: 'Jim Halpert',
      transitionType: 'Ministry Transfer',
      previousMinistry: 'Community Programs Ministry',
      newMinistry: 'Digital Enablement Ministry',
      newTeam: 'Workplace Collaboration Branch',
      newRole: 'Service Improvement Advisor',
      startDate: '2026-11-02',
      location: 'Hybrid — Toronto',
      manager: 'Elena Park',
      laptop: true,
      sharedDrive: true,
      teams: true,
      distributionList: true,
      mobile: false,
      admin: false,
      building: true,
      printer: true,
    },
  },
  newhire: {
    label: 'Maryam Arif — Fictional New Hire Demo',
    handoverNotes: newHireDemoHandoverNotes,
    form: {
      name: 'Maryam Arif',
      transitionType: 'New Hire',
      previousMinistry: 'Not applicable',
      newMinistry: 'Civic Services Ministry',
      newTeam: 'Service Experience Branch',
      newRole: 'Service Operations Coordinator',
      startDate: '2026-10-27',
      location: 'Hybrid — Toronto',
      manager: 'Elena Park',
      laptop: true,
      sharedDrive: true,
      teams: true,
      distributionList: true,
      mobile: true,
      admin: false,
      building: true,
      printer: true,
    },
  },
  blank: {
    label: 'Start Blank',
    form: {
      name: '',
      transitionType: '',
      previousMinistry: '',
      newMinistry: '',
      newTeam: '',
      newRole: '',
      startDate: '',
      location: '',
      manager: '',
      laptop: false,
      sharedDrive: false,
      teams: false,
      distributionList: false,
      mobile: false,
      admin: false,
      building: false,
      printer: false,
    },
  },
};

export const intakeToggles: { key: keyof FormState; label: string; icon: string }[] = [
  { key: 'laptop', label: 'Laptop needed?', icon: 'laptop' },
  { key: 'sharedDrive', label: 'Shared drive / SharePoint access needed?', icon: 'folder' },
  { key: 'teams', label: 'Teams channel access needed?', icon: 'message-square' },
  { key: 'distributionList', label: 'Distribution list access needed?', icon: 'mail' },
  { key: 'mobile', label: 'Mobile number / SIM needed?', icon: 'smartphone' },
  { key: 'admin', label: 'Admin privileges needed?', icon: 'shield' },
  { key: 'building', label: 'Building access needed?', icon: 'key' },
  { key: 'printer', label: 'Printer / FMP setup needed?', icon: 'printer' },
];

export const sampleHandoverNotes =
  'Weekly branch check-in occurs every Tuesday morning. Key contacts include the manager, IT support, and payroll. Important documents include the team SOP, templates, and the printer setup guide. Pending work includes reviewing current files and confirming system access. Missing information includes final payroll confirmation and building access approval.';

export const responsibleAIPoints = [
  'The current starter-brief fallback is deterministic and explicitly labelled NOT AI.',
  'Database credentials and signed-session secrets remain in server-only environment variables.',
  'Persistent cases, internal request states, prerequisites, and audit events are stored in Neon PostgreSQL.',
  'No ONRequest, ServiceNow, facilities, identity, or provisioning connector is active.',
  'Closing a request does not verify that an employee can use the system or equipment.',
  'Prerequisite verification requires an owner and evidence.',
  'The demo role label is not authorization; the server validates a signed session.',
  'Raw notes remain in active browser state until the user clears or closes the case view.',
  'No statement is made about an AI provider\'s retention or training because no provider is currently called.',
  'Admin privileges and sensitive access require explicit approval.',
  'Production use requires identity, privacy, security, retention, and threat-model review.',
];

export const worklogExcludedItems = [
  'Raw handover notes',
  'Database credentials and signed-session secrets',
  'Any external service-desk record (none is created)',
  'Anything not shown in the preview',
];

export const worklogIncludedSections = [
  'Employee transition summary',
  'Generated ticket bundle',
  'Ticket statuses and approval paths',
  'Rule-based readiness summary',
  'Access cleanup recommendations',
  'Rule-based starter brief summary',
  'Timestamped session summary',
  'Session reset confirmation',
];

// ============================================================
// Helpers
// ============================================================

function isTransfer(f: FormState) {
  return f.transitionType === 'Ministry Transfer';
}
function isNewHire(f: FormState) {
  return f.transitionType === 'New Hire';
}
function teamShort(f: FormState) {
  const ministry = f.newMinistry.replace(/^Ministry of /, '');
  return [ministry, f.newTeam].filter(Boolean).join(' / ');
}

// ============================================================
// Ticket Generator
// ============================================================

export function generateTickets(f: FormState, t?: (key: string, values?: Record<string, string | number>) => string): Ticket[] {
  const tickets: Ticket[] = [];
  const isXfer = isTransfer(f);

  // Core tickets (always created)
  tickets.push({
    id: 'account',
    name: 'Employee account setup',
    category: 'IT',
    status: 'draft-ready',
    approvalPath: 'Standard approval',
    actionLabel: 'Open ONRequest',
    actionType: 'onrequest',
    icon: 'mail',
  });
  tickets.push({
    id: 'payroll',
    name: isXfer ? 'Payroll transfer form' : 'Payroll / employee record setup',
    category: 'HR',
    status: isXfer ? 'waiting' : 'draft-ready',
    approvalPath: 'Manager approval',
    actionLabel: 'Open ONRequest',
    actionType: 'onrequest',
    icon: 'file-text',
  });
  tickets.push({
    id: 'training',
    name: 'Training / onboarding plan',
    category: 'HR',
    status: 'draft-ready',
    approvalPath: 'Manager approval',
    actionLabel: 'Open ONRequest',
    actionType: 'onrequest',
    icon: 'graduation-cap',
  });
  tickets.push({
    id: 'security',
    name: 'Security review',
    category: 'Security',
    status: isXfer ? 'attention' : 'draft-ready',
    approvalPath: isXfer ? 'IT / security review' : 'Standard approval',
    actionLabel: 'Open ONRequest',
    actionType: 'onrequest',
    icon: 'shield',
  });

  // Conditional tickets
  if (f.laptop) {
    tickets.push({
      id: 'laptop',
      name: 'Laptop / asset request',
      category: 'IT',
      status: 'draft-ready',
      approvalPath: 'Standard approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'laptop',
    });
  }
  if (f.sharedDrive) {
    tickets.push({
      id: 'shared-drive',
      name: 'Shared drive access',
      category: 'IT',
      status: 'draft-ready',
      approvalPath: 'Data owner approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'hard-drive',
    });
  }
  if (f.sharedDrive) {
    tickets.push({
      id: 'sharepoint',
      name: 'SharePoint access',
      category: 'IT',
      status: 'draft-ready',
      approvalPath: 'Manager approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'folder',
    });
  }
  if (f.teams) {
    tickets.push({
      id: 'teams',
      name: 'Teams channel access',
      category: 'IT',
      status: 'draft-ready',
      approvalPath: 'Manager approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'message-square',
    });
  }
  if (f.distributionList) {
    tickets.push({
      id: 'dist-list',
      name: 'Distribution list access',
      category: 'IT',
      status: 'draft-ready',
      approvalPath: 'Manager approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'mail',
    });
  }
  if (f.mobile) {
    tickets.push({
      id: 'mobile',
      name: 'Mobile number / SIM request',
      category: 'Telecom',
      status: 'draft-ready',
      approvalPath: 'Manager + telecom approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'smartphone',
    });
  }
  if (f.admin) {
    tickets.push({
      id: 'admin',
      name: 'Admin privileges',
      category: 'Security',
      status: 'needs-approval',
      approvalPath: 'Cyber / security approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'shield',
    });
  }
  if (f.building) {
    tickets.push({
      id: 'building',
      name: `Building access${f.location ? ` — ${f.location}` : ''}`,
      category: 'Facilities',
      status: 'draft-ready',
      approvalPath: 'Facilities approval',
      actionLabel: 'Open Facilities Request',
      actionType: 'facilities',
      icon: 'key',
    });
  }
  if (f.printer) {
    tickets.push({
      id: 'printer',
      name: `Printer / FMP setup${f.location ? ` — ${f.location}` : ''}`,
      category: 'IT',
      status: 'draft-ready',
      approvalPath: 'Standard approval',
      actionLabel: 'Open ONRequest',
      actionType: 'onrequest',
      icon: 'printer',
    });
  }

  // Transfer-only: old access removal
  if (isXfer && f.previousMinistry && f.previousMinistry !== 'Not applicable') {
    tickets.push({
      id: 'access-removal',
      name: 'Previous organization access removal',
      category: 'Security',
      status: 'attention',
      approvalPath: 'IT / security review',
      actionLabel: 'Open Access Removal Request',
      actionType: 'removal',
      icon: 'trash',
    });
  }

  if (!t) return tickets;
  const nameKeys: Record<string, string> = { account:'data.account', payroll:isXfer ? 'data.payrollTransfer' : 'data.payrollSetup', training:'data.training', security:'data.security', laptop:'data.laptop', 'shared-drive':'data.drive', sharepoint:'data.sharepoint', teams:'data.teams', 'dist-list':'data.distribution', mobile:'data.mobile', admin:'data.admin', building:'data.building', printer:'data.printer', 'access-removal':'data.removal' };
  const approvalKeys: Record<string, string> = { 'Standard approval':'data.standardApproval', 'Manager approval':'data.managerApproval', 'IT / security review':'data.securityReview', 'Data owner approval':'data.ownerApproval', 'Facilities approval':'data.facilitiesApproval', 'Cyber / security approval':'data.cyberApproval' };
  return tickets.map(ticket => ({ ...ticket, name: `${t(nameKeys[ticket.id] ?? ticket.name)}${(ticket.id === 'building' || ticket.id === 'printer') && f.location ? ` — ${f.location}` : ''}`, category: ticket.category === 'Facilities' ? t('data.facilities') : ticket.category, approvalPath: t(approvalKeys[ticket.approvalPath] ?? ticket.approvalPath), actionLabel: ticket.actionType === 'facilities' ? t('data.openFacilities') : ticket.actionType === 'removal' ? t('data.openRemoval') : t('data.openRequest') }));
}

// ============================================================
// Access Cleanup / Provisioning Generator
// ============================================================

export function generateAccessRows(f: FormState): AccessRow[] {
  const rows: AccessRow[] = [];
  const isXfer = isTransfer(f);
  const team = teamShort(f);

  if (isXfer && f.previousMinistry && f.previousMinistry !== 'Not applicable') {
    const prev = f.previousMinistry.replace(/^Ministry of /, '');
    rows.push({
      id: 'cur1',
      item: `${prev} SharePoint`,
      kind: 'current',
      recommendation: 'Remove after handover',
      approval: 'IT / security review',
      reason: 'Employee is changing organizations and should keep only access needed for transition handover.',
    });
    rows.push({
      id: 'cur2',
      item: `${prev} Finance Folder`,
      kind: 'current',
      recommendation: 'Remove immediately',
      approval: 'IT / security review',
      reason: `Finance folder is not required for the new ${f.newRole} role.`,
    });
    rows.push({
      id: 'cur3',
      item: `Old ${prev} Teams channels`,
      kind: 'current',
      recommendation: 'Remove non-required channels',
      approval: 'Manager + IT approval',
      reason: 'Keeps collaboration access role-based.',
    });
    rows.push({
      id: 'cur4',
      item: 'Old distribution lists',
      kind: 'current',
      recommendation: 'Remove outdated lists',
      approval: 'Manager + IT approval',
      reason: 'Prevents outdated internal communications access.',
    });
    rows.push({
      id: 'cur5',
      item: 'Generic Power BI Viewer',
      kind: 'current',
      recommendation: 'Keep only if still required',
      approval: 'Manager review',
      reason: 'Keep only if approved for reporting needs.',
    });
  }

  // New access rows — role-based
  const role = f.newRole || 'the role';
  if (f.sharedDrive) {
    rows.push({
      id: 'new1',
      item: `${team} SharePoint`,
      kind: 'new',
      recommendation: 'Add',
      approval: 'Manager approval',
      reason: `Required for ${role} work in ${teamShort(f)}.`,
    });
    rows.push({
      id: 'new2',
      item: roleIncludesBriefing(f) ? 'Briefing Notes Folder' : 'Working Folder',
      kind: 'new',
      recommendation: 'Add',
      approval: 'Data owner approval',
      reason: `Required for ${roleIncludesBriefing(f) ? 'briefing note coordination' : 'document collaboration'}.`,
    });
  }
  if (f.teams) {
    rows.push({
      id: 'new3',
      item: `${team} Teams Channel`,
      kind: 'new',
      recommendation: 'Add',
      approval: 'Manager approval',
      reason: 'Required for branch collaboration.',
    });
  }
  if (f.distributionList) {
    rows.push({
      id: 'new4',
      item: `${team} Branch Distribution List`,
      kind: 'new',
      recommendation: 'Add',
      approval: 'Manager approval',
      reason: 'Required for team communication.',
    });
  }
  // Power BI for analyst roles
  if (role.toLowerCase().includes('analyst') || role.toLowerCase().includes('business')) {
    rows.push({
      id: 'new5',
      item: 'Power BI Viewer',
      kind: 'new',
      recommendation: 'Add',
      approval: 'Manager approval',
      reason: 'Required for reporting and data analysis.',
    });
  }
  // Visio for business analyst
  if (role.toLowerCase().includes('business analyst')) {
    rows.push({
      id: 'new6',
      item: 'Visio or approved process-mapping software',
      kind: 'new',
      recommendation: 'Add',
      approval: 'Manager approval',
      reason: 'Required for process mapping and documentation.',
    });
  }

  return rows;
}

function roleIncludesBriefing(f: FormState) {
  return f.newRole.toLowerCase().includes('policy');
}

// ============================================================
// Dashboard Generator
// ============================================================

export function generateDashboardRows(f: FormState, tickets: Ticket[]): DashboardRow[] {
  const rows: DashboardRow[] = [];
  const isXfer = isTransfer(f);

  for (const t of tickets) {
    let insight = '';
    let risk: RiskLevel = 'low';

    switch (t.id) {
      case 'account':
        insight = 'Must be completed before Day 1.';
        risk = 'medium';
        break;
      case 'payroll':
        insight = isXfer
          ? 'High risk: missing signed transfer form may delay first pay.'
          : 'High risk: missing payroll setup may delay first pay.';
        risk = 'high';
        break;
      case 'training':
        insight = 'Onboarding plan ready for manager approval.';
        risk = 'low';
        break;
      case 'security':
        insight = isXfer
          ? `Old ${f.previousMinistry.replace(/^Ministry of /, '')} access is still active.`
          : 'Standard security review for new hire.';
        risk = isXfer ? 'high' : 'medium';
        break;
      case 'laptop':
        insight = `Low risk if delivered before ${shortDate(f.startDate)}.`;
        risk = 'low';
        break;
      case 'building':
        insight = `Owner needed from facilities or building management at ${f.location || 'the assigned location'}.`;
        risk = 'medium';
        break;
      case 'printer':
        insight = `${f.location || 'Site'} setup may require profile reset.`;
        risk = 'medium';
        break;
      case 'mobile':
        insight = 'Based on manager selection.';
        risk = 'low';
        break;
      case 'admin':
        insight = 'Admin privileges require cyber / security approval and business justification.';
        risk = 'high';
        break;
      case 'access-removal':
        insight = `Old ${f.previousMinistry.replace(/^Ministry of /, '')} access is still active.`;
        risk = 'high';
        break;
      default:
        insight = 'Draft ready for submission.';
        risk = 'low';
    }

    rows.push({
      id: `dash-${t.id}`,
      area: ticketArea(t),
      ticketStatus: t.status,
      insight,
      risk,
      icon: t.icon,
    });
  }

  return rows;
}

function ticketArea(t: Ticket): string {
  const map: Record<string, string> = {
    account: 'Account',
    payroll: 'Payroll',
    training: 'Training',
    security: 'Security review',
    laptop: 'Laptop',
    'shared-drive': 'Shared drive',
    sharepoint: 'SharePoint',
    teams: 'Teams',
    'dist-list': 'Distribution list',
    mobile: 'Mobile service',
    admin: 'Admin privileges',
    building: 'Building card',
    printer: 'Printer / FMP',
    'access-removal': 'Access removal',
  };
  return map[t.id] ?? t.name;
}

function shortDate(dateStr: string): string {
  if (!dateStr) return 'start date';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ============================================================
// Readiness Score
// ============================================================

export function statusScore(status: TicketStatus): number {
  switch (status) {
    case 'complete': return 100;
    case 'submitted': return 70;
    case 'in-progress': return 50;
    case 'pending-approval': return 35;
    case 'draft-ready': return 20;
    case 'optional': return 20;
    case 'needs-approval': return 15;
    case 'waiting': return 10;
    case 'not-started': return 5;
    case 'attention': return 0;
    default: return 0;
  }
}

export function calculateReadinessScore(tickets: Ticket[]): number {
  if (tickets.length === 0) return 0;
  const total = tickets.reduce((sum, t) => sum + statusScore(t.status), 0);
  return Math.round(total / tickets.length);
}

// ============================================================
// Business Justification
// ============================================================

export function generateJustification(f: FormState, t?: (key: string, values?: Record<string, string | number>) => string, dateFormatter: (date: string) => string = formatDate): string {
  const name = f.name || 'The employee';
  const role = f.newRole || 'the role';
  const team = teamShort(f) || 'the new team';
  const date = f.startDate ? dateFormatter(f.startDate) : 'the start date';
  const location = f.location || 'the assigned location';

  const accessItems: string[] = [];
  if (f.sharedDrive) accessItems.push(`${teamShort(f)} SharePoint`);
  if (f.sharedDrive && roleIncludesBriefing(f)) accessItems.push('Briefing Notes Folder');
  else if (f.sharedDrive) accessItems.push('Working Folder');
  if (f.teams) accessItems.push(`${teamShort(f)} Teams Channel`);
  if (f.distributionList) accessItems.push(`${teamShort(f)} Branch Distribution List`);
  if (f.mobile) accessItems.push('Mobile service');
  if (f.admin) accessItems.push('Admin privileges');

  const accessList = accessItems.length > 0 ? accessItems.join(', ') : 'standard onboarding access';
  const purpose = roleIncludesBriefing(f)
    ? 'briefing note coordination, branch collaboration, and first-week onboarding tasks'
    : 'process analysis, project documentation, and branch collaboration';

  if (t && isNewHire(f)) return t('template.justificationHire', { name, role, team, location, date, access: accessList, purpose });
  if (t) return t('template.justificationTransfer', { name, role, team, location, date, access: accessList, purpose });
  if (isNewHire(f)) {
    return `Business justification: ${name} is joining ${team} as a ${role} at ${location}, starting ${date}. Access to ${accessList} is required to support ${purpose}.`;
  }
  return `Business justification: ${name} is transferring into a ${role} role at ${team} at ${location}, starting ${date}. Access to ${accessList} is required to support ${purpose}.`;
}

// ============================================================
// Risk Scan Results
// ============================================================

export function generateRiskScanResults(f: FormState, tickets: Ticket[]): string[] {
  const results: string[] = [];
  const isXfer = isTransfer(f);

  const payroll = tickets.find((t) => t.id === 'payroll');
  if (payroll) {
    results.push(
      isXfer
        ? 'Payroll is the highest readiness blocker because the signed transfer form is missing.'
        : 'Payroll setup is the highest readiness blocker because the employee record is not yet confirmed.',
    );
  }

  if (isXfer && f.previousMinistry && f.previousMinistry !== 'Not applicable') {
    results.push(
      `Security review needs attention because old ${f.previousMinistry.replace(/^Ministry of /, '')} access is still active.`,
    );
  } else {
    results.push('Security review is needed to confirm the new hire baseline access profile.');
  }

  if (f.printer) {
    results.push(`Printer / FMP setup may cause Day 1 friction at ${f.location || 'the assigned location'}.`);
  }

  if (f.admin) {
    results.push('Admin privileges require cyber / security approval and business justification.');
  }

  if (f.laptop) {
    results.push(`Laptop is low risk if delivery is confirmed before ${shortDate(f.startDate)}.`);
  }

  return results;
}

// ============================================================
// Starter Brief Generator
// ============================================================

export function generateBriefSections(f: FormState, _locale?: unknown): BriefSection[] {
  void _locale;
  const isXfer = isTransfer(f);
  const name = f.name || 'The employee';
  const role = f.newRole || 'the role';
  const team = teamShort(f) || 'the new team';
  const manager = f.manager || 'the manager';
  const location = f.location || 'the assigned location';

  if (isXfer) {
    return [
      {
        heading: 'Role overview',
        icon: 'briefcase',
        items: [
          { label: 'Title', value: `${role}, ${team}` },
          { label: 'Type', value: 'Ministry transfer' },
          { label: 'Focus', value: 'Transition into new role with handover from previous ministry.' },
        ],
      },
      {
        heading: 'Transition priorities',
        icon: 'calendar',
        items: [
          { label: 'Day 1–2', value: `Confirm workspace, building access, and ${teamShort(f)} permissions.` },
          { label: 'Day 3–4', value: `Review active files and documents with ${manager}.` },
          { label: 'Day 5', value: 'Attend branch check-in and meet key contacts.' },
        ],
      },
      {
        heading: 'Old access cleanup',
        icon: 'trash',
        items: [
          { label: 'SharePoint', value: `Remove ${f.previousMinistry.replace(/^Ministry of /, '')} SharePoint after handover.` },
          { label: 'Finance', value: 'Remove old finance folder access immediately.' },
          { label: 'Channels', value: 'Remove non-required old Teams channels.' },
        ],
      },
      {
        heading: 'New access needed',
        icon: 'key',
        items: buildAccessItems(f),
      },
      {
        heading: 'Handover tasks',
        icon: 'clipboard-list',
        items: [
          { label: 'Documents', value: 'Complete handover of active files from previous role.' },
          { label: 'Recurring tasks', value: 'Transfer ownership of recurring reports and trackers.' },
          { label: 'Contacts', value: 'Introduce key contacts from previous ministry for continuity.' },
        ],
      },
      {
        heading: 'First-week meetings',
        icon: 'users',
        items: [
          { label: 'Manager', value: `${manager} — welcome and priorities alignment.` },
          { label: 'IT', value: 'IT support — confirm access and equipment.' },
          { label: 'Branch', value: 'Branch check-in — meet the team.' },
        ],
      },
      {
        heading: 'Pending approvals',
        icon: 'alert-triangle',
        items: [
          { label: 'Payroll', value: 'Awaiting signed transfer form.' },
          { label: 'Building', value: `Building access at ${location} pending.` },
        ],
      },
      {
        heading: 'Questions for the manager',
        icon: 'help-circle',
        items: [
          { label: 'Priorities', value: 'Which files are the top priority for my first two weeks?' },
          { label: 'Access', value: `Is there any additional access I will need beyond the standard ${teamShort(f)} set?` },
          { label: 'Check-ins', value: 'How should I report progress — weekly written updates or standup?' },
        ],
      },
    ];
  }

  // New hire brief
  return [
    {
      heading: 'Welcome and role overview',
      icon: 'briefcase',
      items: [
        { label: 'Welcome', value: `Welcome ${name} to ${team}.` },
        { label: 'Title', value: `${role}, ${team}` },
        { label: 'Focus', value: 'New hire onboarding and role orientation.' },
      ],
    },
    {
      heading: 'First-day checklist',
      icon: 'check-circle',
      items: [
        { label: 'Arrival', value: `Arrive at ${location}. Confirm building access and workspace.` },
        { label: 'Equipment', value: f.laptop ? 'Receive laptop and confirm login.' : 'Confirm workspace setup.' },
        { label: 'Intro', value: `Meet with ${manager} for welcome and orientation.` },
      ],
    },
    {
      heading: 'First-week priorities',
      icon: 'calendar',
      items: [
        { label: 'Day 1–2', value: `Complete IT setup, confirm ${teamShort(f)} access, and review onboarding materials.` },
        { label: 'Day 3–4', value: `Begin role orientation and shadow team members.` },
        { label: 'Day 5', value: 'Attend branch check-in and meet key contacts.' },
      ],
    },
    {
      heading: 'Key contacts',
      icon: 'users',
      items: [
        { label: 'Manager', value: `${manager} — management and onboarding lead.` },
        { label: 'IT', value: 'IT service desk — access and equipment support.' },
        { label: 'HR', value: 'HR partner — payroll and employee record setup.' },
      ],
    },
    {
      heading: 'Required training',
      icon: 'graduation-cap',
      items: [
        { label: 'Mandatory', value: 'Complete OPS mandatory orientation modules.' },
        { label: 'Role-based', value: `Review role-specific training plan for ${role}.` },
        { label: 'Security', value: 'Complete security and privacy awareness training.' },
      ],
    },
    {
      heading: 'Systems and access needed',
      icon: 'key',
      items: buildAccessItems(f),
    },
    {
      heading: 'Documents to review',
      icon: 'file-text',
      items: [
        { label: 'SOP', value: 'Branch standard operating procedures.' },
        { label: 'Templates', value: 'Review standard templates and working documents.' },
        { label: 'Org chart', value: 'Review team org chart and reporting structure.' },
      ],
    },
    {
      heading: 'Questions for the manager',
      icon: 'help-circle',
      items: [
        { label: 'Priorities', value: 'What should I focus on in my first two weeks?' },
        { label: 'Training', value: 'Which training modules should I prioritize?' },
        { label: 'Check-ins', value: 'How should I report progress — weekly written updates or standup?' },
      ],
    },
  ];
}

function buildAccessItems(f: FormState): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  if (f.sharedDrive) items.push({ label: 'SharePoint', value: `${teamShort(f)} SharePoint — required for document collaboration.` });
  if (f.sharedDrive) items.push({ label: roleIncludesBriefing(f) ? 'Briefing Notes' : 'Working Folder', value: 'Required for document coordination.' });
  if (f.teams) items.push({ label: 'Teams', value: `${teamShort(f)} Teams Channel — required for branch communication.` });
  if (f.distributionList) items.push({ label: 'Distribution list', value: `${teamShort(f)} Branch Distribution List — required for team updates.` });
  if (f.mobile) items.push({ label: 'Mobile', value: 'Mobile number / SIM — required for role.' });
  if (f.admin) items.push({ label: 'Admin', value: 'Admin privileges — requires cyber / security approval.' });
  if (items.length === 0) items.push({ label: 'Standard', value: 'Standard onboarding access package.' });
  return items;
}
