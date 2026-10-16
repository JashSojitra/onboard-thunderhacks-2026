import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type FormState, type Ticket, type DashboardRow, type AccessRow, type BriefSection, type ScenarioId, scenarios, generateTickets, generateDashboardRows, generateAccessRows, generateBriefSections, generateJustification, generateRiskScanResults, calculateReadinessScore } from './data';
import { formatLocalizedDate, useLocale } from './locale';
import { ApiError, fromCaseInput, nexusApi, type ApiAuditEvent, type ApiCase, type ApiTicket, type ApiWorkTask, type PrerequisiteStatus } from './api';
import { fixtureCases, type CaseStatus } from './fixtures/cases';
import { canCompleteCase, canTransitionTicket, incompleteRequiredTickets } from './domain/workflow';

export type { CaseStatus } from './fixtures/cases';
export type BackendStatus = 'checking' | 'connected' | 'locked' | 'unconfigured' | 'error';
export interface TransitionCase {
  id: string; recordId?: string; form: FormState; status: CaseStatus; blocker: string; lastUpdated: string;
  bundleGenerated: boolean; submitted: boolean; briefGenerated: boolean;
  source: 'fixture' | 'persistent' | 'draft'; readiness?: number;
}
const emptyForm = (type: 'Ministry Transfer' | 'New Hire'): FormState => ({ ...scenarios.blank.form, transitionType: type, previousMinistry: type === 'New Hire' ? 'Not applicable' : '', manager: '' });
function fromApi(value: ApiCase): TransitionCase {
  return {
    id: value.id, recordId: value.recordId, form: fromCaseInput(value.form), status: value.status,
    blocker: value.blocker, lastUpdated: value.lastUpdated, bundleGenerated: value.bundleGenerated,
    submitted: Boolean(value.bundleSubmittedAt),
    briefGenerated: value.briefGenerated, source: 'persistent', readiness: value.readiness,
  };
}

interface NexusContextValue {
  form: FormState; updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  loadDemo: (id: 'transfer' | 'newhire') => void; startCase: (type: 'Ministry Transfer' | 'New Hire') => void;
  activeScenario: ScenarioId; activeCase: TransitionCase | null; cases: TransitionCase[];
  openCase: (c: TransitionCase) => Promise<void>; saveCase: (status?: CaseStatus) => Promise<void>;
  startEditableDemo: (c: TransitionCase) => Promise<void>;
  archiveCase: (c: TransitionCase) => Promise<void>;
  markComplete: () => Promise<void>; reassignOwner: () => void; hasUnsavedChanges: boolean;
  clearActiveCase: () => void; resetSession: () => void; bundleGenerated: boolean;
  generateBundle: () => Promise<void>; tickets: Ticket[]; dashboardRows: DashboardRow[];
  accessRows: AccessRow[]; briefSections: BriefSection[]; justification: string; readinessScore: number;
  riskScanResults: string[]; submitted: boolean; submitBundle: () => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;
  updateTicketDraft: (ticketId: string, update: Partial<Pick<ApiTicket, 'name' | 'category' | 'approvalPath' | 'description' | 'included'>>) => Promise<void>;
  workTasks: ApiWorkTask[]; taskReadiness: number;
  auditEvents: ApiAuditEvent[];
  updatePrerequisite: (prerequisiteId: string, status: PrerequisiteStatus, owner: string, evidence: string) => Promise<void>;
  briefGenerated: boolean; setBriefGenerated: (v: boolean) => void;
  handoverNotes: string; setHandoverNotes: (v: string) => void;
  backendStatus: BackendStatus; backendMessage: string;
  signIn: (accessCode: string) => Promise<void>; signOut: () => Promise<void>;
}

const NexusContext = createContext<NexusContextValue | null>(null);
export function useNexus() { const context = useContext(NexusContext); if (!context) throw new Error('useNexus must be used within NexusProvider'); return context; }

export function NexusProvider({ children }: { children: ReactNode }) {
  const { locale, t } = useLocale();
  const [form, setForm] = useState<FormState>(scenarios.blank.form);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('blank');
  const [activeCase, setActiveCase] = useState<TransitionCase | null>(null);
  const [applicationCases, setApplicationCases] = useState<TransitionCase[]>([]);
  const [bundleGenerated, setBundleGenerated] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [workTasks, setWorkTasks] = useState<ApiWorkTask[]>([]);
  const [auditEvents, setAuditEvents] = useState<ApiAuditEvent[]>([]);
  const [briefGenerated, setBriefGeneratedState] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [dirty, setDirty] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [backendMessage, setBackendMessage] = useState('Checking persistent storage…');

  const refreshCases = useCallback(async () => {
    try {
      const response = await nexusApi.listCases();
      setApplicationCases(response.cases.map(fromApi));
      setBackendStatus('connected');
      setBackendMessage('Persistent Neon PostgreSQL storage connected.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { setBackendStatus('locked'); setBackendMessage('Enter the demo access code to load and save persistent cases.'); }
      else if (error instanceof ApiError && error.status === 503) { setBackendStatus('unconfigured'); setBackendMessage('Persistent storage is not configured; presentation fixtures remain available.'); }
      else { setBackendStatus('error'); setBackendMessage(error instanceof Error ? error.message : 'Persistent storage is unavailable.'); }
    }
  }, []);
  useEffect(() => { void refreshCases(); }, [refreshCases]);

  const startCase = useCallback((type: 'Ministry Transfer' | 'New Hire') => {
    const nextForm = emptyForm(type);
    setForm(nextForm); setActiveScenario('blank');
    setActiveCase({ id: 'Unsaved', form: nextForm, status: 'Active', blocker: '', lastUpdated: '', bundleGenerated: false, submitted: false, briefGenerated: false, source: 'draft' });
    setBundleGenerated(false); setTickets([]); setSubmitted(false); setWorkTasks([]); setAuditEvents([]); setBriefGeneratedState(false); setHandoverNotes(''); setDirty(false);
  }, []);
  const loadDemo = useCallback((id: 'transfer' | 'newhire') => {
    const nextForm = { ...scenarios[id].form };
    setForm(nextForm); setActiveScenario(id); setHandoverNotes(scenarios[id].handoverNotes ?? '');
    setActiveCase({ id: 'Unsaved demo copy', form: nextForm, status: 'Active', blocker: '', lastUpdated: '', bundleGenerated: false, submitted: false, briefGenerated: false, source: 'draft' });
    setTickets([]); setBundleGenerated(false); setSubmitted(false); setWorkTasks([]); setAuditEvents([]); setDirty(true);
  }, []);
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value })); setActiveScenario(null); setBundleGenerated(false);
    setTickets([]); setSubmitted(false); setBriefGeneratedState(false); setDirty(true);
  }, []);

  const openCase = useCallback(async (selected: TransitionCase) => {
    let current = selected;
    let loadedTickets: Ticket[] = [];
    if (selected.source === 'persistent' && selected.recordId) {
      const [response, preflight, audit] = await Promise.all([nexusApi.getCase(selected.recordId), nexusApi.getPreflight(selected.recordId), nexusApi.listAudit(selected.recordId)]);
      current = fromApi(response.case); loadedTickets = response.case.tickets; setWorkTasks(preflight.tasks); setAuditEvents(audit.events);
    } else if (selected.bundleGenerated) {
      loadedTickets = generateTickets(selected.form, t).map((ticket) => selected.submitted && ticket.status === 'draft-ready' ? { ...ticket, status: 'submitted' as const } : ticket);
    }
    setForm(current.form); setActiveCase(current);
    setActiveScenario(current.source === 'fixture' ? (current.form.transitionType === 'Ministry Transfer' ? 'transfer' : 'newhire') : null);
    setBundleGenerated(current.bundleGenerated); setTickets(loadedTickets); setSubmitted(current.submitted);
    if (selected.source !== 'persistent') { setWorkTasks([]); setAuditEvents([]); }
    const matchingScenario = Object.values(scenarios).find((scenario) => scenario.form.name === current.form.name);
    setBriefGeneratedState(current.briefGenerated); setHandoverNotes(matchingScenario?.handoverNotes ?? ''); setDirty(false);
  }, [t]);

  const saveCase = useCallback(async (status?: CaseStatus) => {
    if (backendStatus !== 'connected') throw new Error(backendMessage);
    if (activeCase?.status === 'Completed') throw new Error('Completed cases are read-only. Start a new case for further work.');
    if (status === 'Completed') throw new Error('Use Mark Complete after resolving every required ticket.');
    const response = activeCase?.source === 'persistent' && activeCase.recordId ? await nexusApi.updateCase(activeCase.recordId, form) : await nexusApi.createCase(form);
    const saved = fromApi(response.case);
    setAuditEvents((await nexusApi.listAudit(saved.recordId as string)).events);
    setActiveCase(saved); setApplicationCases((previous) => [saved, ...previous.filter((item) => item.recordId !== saved.recordId)]); setDirty(false);
  }, [activeCase, backendMessage, backendStatus, form]);

  const startEditableDemo = useCallback(async (selected: TransitionCase) => {
    if (selected.source !== 'fixture') throw new Error('Only fictional fixtures need an editable working copy.');
    if (backendStatus !== 'connected') throw new Error(`${backendMessage} Return Home and unlock persistence before starting an editable demo.`);
    const created = fromApi((await nexusApi.createCase(selected.form)).case);
    setActiveCase(created); setForm(created.form); setApplicationCases((previous) => [created, ...previous]);
    setActiveScenario(created.form.transitionType === 'Ministry Transfer' ? 'transfer' : 'newhire');
    const response = await nexusApi.generateBundle(created.recordId as string);
    const [preflight, audit] = await Promise.all([nexusApi.getPreflight(created.recordId as string), nexusApi.listAudit(created.recordId as string)]);
    const editable = { ...created, bundleGenerated: true };
    setActiveCase(editable); setApplicationCases((previous) => [editable, ...previous.filter((item) => item.recordId !== editable.recordId)]);
    setTickets(response.tickets); setWorkTasks(preflight.tasks); setAuditEvents(audit.events);
    setBundleGenerated(true); setSubmitted(false); setBriefGeneratedState(false);
    const matchingScenario = Object.values(scenarios).find((scenario) => scenario.form.name === created.form.name);
    setHandoverNotes(matchingScenario?.handoverNotes ?? ''); setDirty(false);
  }, [backendMessage, backendStatus]);

  const generateBundle = useCallback(async () => {
    if (backendStatus !== 'connected') throw new Error(`${backendMessage} Return Home and unlock persistence before generating requests.`);
    if (activeCase?.source === 'fixture') throw new Error('This is a read-only fictional fixture. Start an editable demo copy before generating requests.');
    let persisted: TransitionCase;
    if (activeCase?.source === 'persistent' && activeCase.recordId) persisted = fromApi((await nexusApi.updateCase(activeCase.recordId, form)).case);
    else persisted = fromApi((await nexusApi.createCase(form)).case);
    const recordId = persisted.recordId;
    if (!recordId) throw new Error('The case could not be persisted.');
    setActiveCase(persisted); setApplicationCases((previous) => [persisted, ...previous.filter((item) => item.recordId !== persisted.recordId)]);
    const response = await nexusApi.generateBundle(recordId); setTickets(response.tickets);
    const [preflight, audit] = await Promise.all([nexusApi.getPreflight(recordId), nexusApi.listAudit(recordId)]); setWorkTasks(preflight.tasks); setAuditEvents(audit.events);
    const generated = { ...persisted, bundleGenerated: true, form };
    setActiveCase(generated); setApplicationCases((previous) => [generated, ...previous.filter((item) => item.recordId !== generated.recordId)]);
    setBundleGenerated(true); setSubmitted(false); setDirty(true);
  }, [activeCase, backendMessage, backendStatus, form]);

  const submitBundle = useCallback(async () => {
    if (activeCase?.source === 'persistent' && activeCase.recordId) {
      const response = await nexusApi.submitBundle(activeCase.recordId); setTickets(response.tickets);
      setAuditEvents((await nexusApi.listAudit(activeCase.recordId)).events);
      const submittedCase = { ...activeCase, submitted: true, readiness: calculateReadinessScore(response.tickets) };
      setActiveCase(submittedCase); setApplicationCases((previous) => previous.map((item) => item.recordId === submittedCase.recordId ? submittedCase : item));
    } else {
      throw new Error('Only an editable saved case can be submitted. Start an editable demo copy or generate a bundle from Manager Intake.');
    }
    setSubmitted(true); setDirty(true);
  }, [activeCase]);

  const updateTicketStatus = useCallback(async (ticketId: string, status: Ticket['status']) => {
    const current = tickets.find((ticket) => ticket.id === ticketId);
    if (!current) throw new Error('Ticket not found.');
    if (!canTransitionTicket(current.status, status)) throw new Error(`Invalid ticket transition: ${current.status} → ${status}.`);
    if (activeCase?.source === 'persistent' && activeCase.recordId) {
      const response = await nexusApi.updateTicket(activeCase.recordId, ticketId, { status });
      const nextTickets = tickets.map((ticket) => ticket.id === ticketId ? response.ticket : ticket);
      setTickets(nextTickets);
      setApplicationCases((previous) => previous.map((item) => item.recordId === activeCase.recordId ? { ...item, readiness: calculateReadinessScore(nextTickets) } : item));
      setAuditEvents((await nexusApi.listAudit(activeCase.recordId)).events);
    } else throw new Error('Ticket fulfillment can only be updated on an editable saved case.');
    setDirty(true);
  }, [activeCase, tickets]);

  const updateTicketDraft = useCallback(async (ticketId: string, update: Partial<Pick<ApiTicket, 'name' | 'category' | 'approvalPath' | 'description' | 'included'>>) => {
    if (!activeCase?.recordId || activeCase.source !== 'persistent') throw new Error('Save this case before editing ticket drafts.');
    const response = await nexusApi.updateTicket(activeCase.recordId, ticketId, update);
    setTickets((items) => items.map((ticket) => ticket.id === ticketId ? response.ticket : ticket));
    setAuditEvents((await nexusApi.listAudit(activeCase.recordId)).events);
    setDirty(true);
  }, [activeCase]);

  const updatePrerequisite = useCallback(async (prerequisiteId: string, status: PrerequisiteStatus, owner: string, evidence: string) => {
    if (!activeCase?.recordId || activeCase.source !== 'persistent') throw new Error('Save this case before updating Day-One Preflight.');
    const response = await nexusApi.updatePrerequisite(activeCase.recordId, prerequisiteId, { status, owner, evidence });
    setWorkTasks(response.tasks); setAuditEvents((await nexusApi.listAudit(activeCase.recordId)).events); setDirty(true);
  }, [activeCase]);

  const markComplete = useCallback(async () => {
    if (!activeCase?.recordId || activeCase.source !== 'persistent') throw new Error('Start or open an editable saved case before completing it.');
    const tracked = tickets.filter((ticket) => ticket.included !== false).map((ticket) => ({ ...ticket, required: ticket.required ?? true }));
    if (!canCompleteCase(tracked)) { const blockers = incompleteRequiredTickets(tracked); throw new Error(`${blockers.length} required ticket${blockers.length === 1 ? '' : 's'} remain incomplete.`); }
    const prerequisiteBlockers = workTasks.flatMap((task) => task.prerequisites).filter((item) => item.required && item.status !== 'verified');
    if (prerequisiteBlockers.length) throw new Error(`${prerequisiteBlockers.length} required Day-One prerequisite${prerequisiteBlockers.length === 1 ? '' : 's'} remain unverified.`);
    const response = await nexusApi.completeCase(activeCase.recordId); const completed = fromApi(response.case);
    setAuditEvents((await nexusApi.listAudit(activeCase.recordId)).events);
    setActiveCase(completed); setApplicationCases((previous) => previous.map((item) => item.recordId === completed.recordId ? completed : item)); setDirty(false);
  }, [activeCase, tickets, workTasks]);

  const reassignOwner = useCallback(() => updateField('manager', ''), [updateField]);
  const clearActiveCase = useCallback(() => { setActiveCase(null); setForm(scenarios.blank.form); setBundleGenerated(false); setTickets([]); setSubmitted(false); setWorkTasks([]); setAuditEvents([]); setBriefGeneratedState(false); setHandoverNotes(''); setDirty(false); }, []);
  const archiveCase = useCallback(async (selected: TransitionCase) => {
    if (selected.source !== 'persistent' || !selected.recordId) throw new Error('Only persistent cases can be archived.');
    await nexusApi.archiveCase(selected.recordId);
    setApplicationCases((previous) => previous.filter((item) => item.recordId !== selected.recordId));
    if (activeCase?.recordId === selected.recordId) clearActiveCase();
  }, [activeCase, clearActiveCase]);
  const signIn = useCallback(async (accessCode: string) => { await nexusApi.signIn(accessCode); await refreshCases(); }, [refreshCases]);
  const signOut = useCallback(async () => { await nexusApi.signOut(); setApplicationCases([]); setBackendStatus('locked'); setBackendMessage('Enter the demo access code to load and save persistent cases.'); }, []);

  const dashboardRows = useMemo(() => generateDashboardRows(form, tickets), [form, tickets]);
  const taskReadiness = useMemo(() => workTasks.length ? Math.round((workTasks.filter((task) => task.ready).length / workTasks.length) * 100) : 0, [workTasks]);
  const cases = useMemo(() => [...applicationCases, ...fixtureCases], [applicationCases]);
  return <NexusContext.Provider value={{
    form, updateField, loadDemo, startCase, activeScenario, activeCase, cases, openCase, saveCase, startEditableDemo, archiveCase, markComplete, reassignOwner,
    hasUnsavedChanges: dirty, clearActiveCase, resetSession: clearActiveCase, bundleGenerated, generateBundle, tickets,
    dashboardRows, accessRows: generateAccessRows(form), briefSections: generateBriefSections(form, locale),
    justification: generateJustification(form, t, (date) => formatLocalizedDate(date, locale)), readinessScore: calculateReadinessScore(tickets),
    riskScanResults: generateRiskScanResults(form, tickets), submitted, submitBundle, updateTicketStatus, updateTicketDraft,
    workTasks, taskReadiness, auditEvents, updatePrerequisite, briefGenerated,
    setBriefGenerated: (value) => { setBriefGeneratedState(value); setDirty(true); }, handoverNotes, setHandoverNotes,
    backendStatus, backendMessage, signIn, signOut,
  }}>{children}</NexusContext.Provider>;
}
