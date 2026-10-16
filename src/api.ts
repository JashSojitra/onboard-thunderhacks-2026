import type { FormState, Ticket } from './data';
import type { CaseInput } from '../shared/contracts';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}

export interface ApiCase {
  recordId: string; id: string; form: CaseInput; status: 'Active' | 'Waiting' | 'At Risk' | 'Completed';
  blocker: string; bundleGenerated: boolean; bundleSubmittedAt: string | null; briefGenerated: boolean; createdAt: string;
  lastUpdated: string; tickets: ApiTicket[]; readiness: number; source: 'persistent';
}
export interface ApiTicket extends Ticket { templateKey: string; required: boolean; included: boolean; description: string; createdAt: string; updatedAt: string; }
export type PrerequisiteStatus = 'unknown' | 'blocked' | 'verified';
export interface ApiPrerequisite {
  id: string; ticketId: string | null; category: 'equipment' | 'account' | 'application_access' | 'knowledge' | 'approval' | 'contact';
  name: string; status: PrerequisiteStatus; owner: string; evidence: string; nextAction: string; required: boolean;
}
export interface ApiWorkTask { id: string; name: string; outcome: string; ready: boolean; prerequisites: ApiPrerequisite[]; }
export interface ApiAuditEvent { id: string; eventType: string; actor: string; details: Record<string, unknown>; createdAt: string; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, { ...init, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new ApiError(response.status, body.error?.message ?? 'Request failed.', body.error?.details);
  }
  if (response.status === 204) return undefined as T;
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(503, 'The persistent API is unavailable. Run the app with `npx vercel dev`, then unlock persistence from Home.');
  }
  return response.json() as Promise<T>;
}

export function toCaseInput(form: FormState): CaseInput {
  return {
    employeeName: form.name,
    transitionKind: form.transitionType === 'Ministry Transfer' ? 'internal_transfer' : 'new_hire',
    previousOrgUnit: form.transitionType === 'Ministry Transfer' ? form.previousMinistry : '',
    destinationOrgUnit: form.newMinistry, destinationTeam: form.newTeam, roleTitle: form.newRole,
    startDate: form.startDate, location: form.location, managerName: form.manager,
    requirements: { laptop: form.laptop, sharedDrive: form.sharedDrive, teams: form.teams, distributionList: form.distributionList, mobile: form.mobile, admin: form.admin, building: form.building, printer: form.printer },
  };
}

export function fromCaseInput(form: CaseInput): FormState {
  return {
    name: form.employeeName, transitionType: form.transitionKind === 'internal_transfer' ? 'Ministry Transfer' : 'New Hire',
    previousMinistry: form.transitionKind === 'internal_transfer' ? form.previousOrgUnit : 'Not applicable',
    newMinistry: form.destinationOrgUnit, newTeam: form.destinationTeam, newRole: form.roleTitle,
    startDate: form.startDate, location: form.location, manager: form.managerName, ...form.requirements,
  };
}

export const nexusApi = {
  signIn: (accessCode: string) => request<void>('session', { method: 'POST', body: JSON.stringify({ accessCode }) }),
  signOut: () => request<void>('session', { method: 'DELETE' }),
  listCases: () => request<{ cases: ApiCase[] }>('cases'),
  getCase: (recordId: string) => request<{ case: ApiCase }>(`cases/${recordId}`),
  createCase: (form: FormState) => request<{ case: ApiCase }>('cases', { method: 'POST', body: JSON.stringify(toCaseInput(form)) }),
  updateCase: (recordId: string, form: FormState) => request<{ case: ApiCase }>(`cases/${recordId}`, { method: 'PATCH', body: JSON.stringify(toCaseInput(form)) }),
  archiveCase: (recordId: string) => request<void>(`cases/${recordId}`, { method: 'DELETE' }),
  generateBundle: (recordId: string) => request<{ tickets: ApiTicket[] }>(`cases/${recordId}/bundle`, { method: 'POST' }),
  submitBundle: (recordId: string) => request<{ tickets: ApiTicket[] }>(`cases/${recordId}/submit`, { method: 'POST' }),
  updateTicket: (recordId: string, ticketId: string, update: Partial<Pick<ApiTicket, 'status' | 'name' | 'category' | 'approvalPath' | 'description' | 'included'>>) => request<{ ticket: ApiTicket }>(`cases/${recordId}/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(update) }),
  getPreflight: (recordId: string) => request<{ tasks: ApiWorkTask[] }>(`cases/${recordId}/preflight`),
  updatePrerequisite: (recordId: string, prerequisiteId: string, update: { status: PrerequisiteStatus; owner: string; evidence: string }) => request<{ tasks: ApiWorkTask[] }>(`cases/${recordId}/prerequisites/${prerequisiteId}`, { method: 'PATCH', body: JSON.stringify(update) }),
  listAudit: (recordId: string) => request<{ events: ApiAuditEvent[] }>(`cases/${recordId}/audit`),
  completeCase: (recordId: string) => request<{ case: ApiCase }>(`cases/${recordId}/complete`, { method: 'POST' }),
};

