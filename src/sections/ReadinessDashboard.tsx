import { useEffect, useState } from 'react';
import { useNexus } from '../store';
import type { ApiPrerequisite, PrerequisiteStatus } from '../api';
import { Card, SectionTitle, ScoreRing, ProgressBar, EmptyState } from '../ui';
import { AlertTriangle, CheckCircle2, HelpCircle, Package, ShieldCheck, UserRound, Wrench } from 'lucide-react';

const categoryLabels: Record<ApiPrerequisite['category'], string> = {
  equipment: 'Equipment', account: 'Account', application_access: 'Application access',
  knowledge: 'Knowledge', approval: 'Approval', contact: 'Contact',
};

export default function ReadinessDashboard() {
  const { form, tickets, workTasks, taskReadiness, readinessScore, auditEvents, bundleGenerated, updatePrerequisite, activeCase, startEditableDemo, backendStatus } = useNexus();
  const [copyingDemo, setCopyingDemo] = useState(false);
  const [copyError, setCopyError] = useState('');
  if (!bundleGenerated) return <div className="animate-fade-in"><SectionTitle eyebrow="Step 3" title="Day-One Preflight" description="" /><EmptyState icon={Package} title="No transition bundle yet" description="Generate a transition bundle to create persisted first-work tasks and prerequisites." /></div>;

  const blockers = workTasks.flatMap((task) => task.prerequisites.map((item) => ({ ...item, taskName: task.name }))).filter((item) => item.required && item.status !== 'verified');
  const completeTickets = tickets.filter((ticket) => ticket.included !== false && ticket.status === 'complete').length;
  return <div className="animate-fade-in">
    <SectionTitle eyebrow="Step 3" title="Day-One Preflight" description={`Deterministic proof that ${form.name || 'the employee'} can perform meaningful first work — separate from administrative ticket progress.`} />
    {activeCase?.source === 'fixture' && <Card className="mb-6 border-amber-200 bg-amber-50/70"><div className="flex flex-wrap items-center gap-4"><div className="min-w-64 flex-1"><h3 className="font-semibold text-amber-950">Fixture preview has no editable readiness evidence</h3><p className="mt-1 text-sm text-amber-900">Start a persistent working copy to create real Day-One tasks, change prerequisite status, and recalculate readiness.</p></div><button disabled={copyingDemo || backendStatus !== 'connected'} onClick={async () => { setCopyingDemo(true); setCopyError(''); try { await startEditableDemo(activeCase); } catch (error) { setCopyError(error instanceof Error ? error.message : 'Unable to create the editable demo.'); } finally { setCopyingDemo(false); } }} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{copyingDemo ? 'Creating…' : 'Start Editable Demo'}</button></div>{backendStatus !== 'connected' && <p className="mt-3 text-xs font-medium text-rose-700">Return Home and unlock persistence first.</p>}{copyError && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">{copyError}</p>}</Card>}
    <Card className="mb-6 border-blue-100 bg-blue-50/40"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-blue-700" /><div><h3 className="font-semibold text-slate-900">Rule-based readiness, not AI</h3><p className="mt-1 text-sm text-slate-600">A task is ready only when every required prerequisite is explicitly verified with evidence. Closing a linked request never verifies that the employee can actually use the equipment or system.</p></div></div></Card>
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <Card className="readiness-score-card flex items-center gap-5"><ScoreRing score={taskReadiness} /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">First-work readiness</p><p className="mt-1 text-lg font-semibold text-navy-900">{workTasks.filter((task) => task.ready).length} of {workTasks.length} tasks ready</p><ProgressBar value={taskReadiness} tone={taskReadiness === 100 ? 'emerald' : 'amber'} /></div></Card>
      <Card><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocking prerequisites</p><p className="mt-2 text-3xl font-bold text-rose-700">{blockers.length}</p><p className="mt-1 text-sm text-slate-500">Owner and next action shown below</p></Card>
      <Card><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administrative workflow</p><p className="mt-2 text-3xl font-bold text-navy-900">{readinessScore}%</p><p className="mt-1 text-sm text-slate-500">{completeTickets} included tickets complete; this is not task proof</p></Card>
    </div>

    {workTasks.length === 0 ? <EmptyState icon={Wrench} title="Preflight not created for this legacy case" description="Regenerate an unsubmitted bundle to add persisted work tasks and prerequisites." /> : <div className="space-y-5">{workTasks.map((task) => <Card key={task.id}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">First meaningful task</p><h3 className="mt-1 text-lg font-semibold text-navy-900">{task.name}</h3><p className="mt-1 text-sm text-slate-600">{task.outcome}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${task.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{task.ready ? 'Ready to perform' : 'Blocked'}</span></div>
      <div className="space-y-3">{task.prerequisites.map((item) => <PrerequisiteEditor key={item.id} item={item} taskName={task.name} onSave={updatePrerequisite} />)}</div>
    </Card>)}</div>}
    <Card className="mt-6" padded={false}>
      <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold text-navy-900">Persistent audit history</h3><p className="mt-1 text-xs text-slate-500">Newest first · written transactionally with workflow changes</p></div>
      {auditEvents.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">Save this case to Neon to begin its audit history.</p> : <ol className="divide-y divide-slate-100">{auditEvents.slice(0, 12).map((event) => <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><div><p className="text-sm font-medium text-slate-900">{auditLabel(event.eventType)}</p><p className="text-xs text-slate-500">Actor: {event.actor}</p></div><time className="text-xs text-slate-500" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></li>)}</ol>}
    </Card>
  </div>;
}

function auditLabel(eventType: string) {
  const labels: Record<string, string> = {
    'case.created': 'Case saved', 'case.updated': 'Case details updated', 'case.status_changed': 'Case status changed',
    'bundle.generated': 'Request drafts generated', 'bundle.submitted_internal': 'SIMULATED bulk submission stored',
    'ticket.draft_updated': 'Request draft edited', 'ticket.status_changed': 'Request fulfillment status changed',
    'preflight.created': 'Day-One Preflight created', 'prerequisite.updated': 'Prerequisite evidence updated',
    'case.completed': 'Case completed', 'case.archived': 'Case archived',
  };
  return labels[eventType] ?? eventType;
}

function PrerequisiteEditor({ item, taskName, onSave }: { item: ApiPrerequisite; taskName: string; onSave: (id: string, status: PrerequisiteStatus, owner: string, evidence: string) => Promise<void> }) {
  const [status, setStatus] = useState(item.status);
  const [owner, setOwner] = useState(item.owner);
  const [evidence, setEvidence] = useState(item.evidence);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setStatus(item.status); setOwner(item.owner); setEvidence(item.evidence); }, [item]);
  const Icon = item.status === 'verified' ? CheckCircle2 : item.status === 'blocked' ? AlertTriangle : HelpCircle;
  async function save() {
    setSaving(true); setMessage('');
    try { await onSave(item.id, status, owner, evidence); setMessage('Saved to the case audit trail.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save prerequisite.'); }
    finally { setSaving(false); }
  }
  return <div className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap gap-3"><Icon className={`mt-0.5 h-5 w-5 ${item.status === 'verified' ? 'text-emerald-600' : item.status === 'blocked' ? 'text-rose-600' : 'text-amber-600'}`} /><div className="min-w-56 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">{categoryLabels[item.category]}</span><p className="font-medium text-slate-900">{item.name}</p></div><p className="mt-1 text-xs text-slate-500">Blocks: {taskName}</p><p className="mt-1 text-sm text-slate-600"><strong>Next:</strong> {item.nextAction}</p></div></div>
    <div className="mt-4 grid gap-3 md:grid-cols-[150px_1fr_1.4fr_auto]">
      <label className="text-xs font-semibold text-slate-600">Status<select value={status} onChange={(event) => setStatus(event.target.value as PrerequisiteStatus)} className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"><option value="unknown">Unknown</option><option value="blocked">Blocked</option><option value="verified">Verified</option></select></label>
      <label className="text-xs font-semibold text-slate-600">Owner (required)<div className="relative mt-1"><UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><input value={owner} onChange={(event) => setOwner(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-sm" /></div></label>
      <label className="text-xs font-semibold text-slate-600">Evidence {status === 'verified' && '(required)'}<input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Test performed, confirmation, or reference" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" /></label>
      <button onClick={() => void save()} disabled={saving || !owner.trim() || (status === 'verified' && !evidence.trim())} className="self-end rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? 'Saving…' : 'Save'}</button>
    </div>{message && <p role="status" className={`mt-2 text-xs ${message.startsWith('Saved') ? 'text-emerald-700' : 'text-rose-700'}`}>{message}</p>}
  </div>;
}
