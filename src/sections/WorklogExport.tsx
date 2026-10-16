import { useState } from 'react';
import { useNexus } from '../store';
import { Card, SectionTitle, EmptyState, ConfirmationDialog, StatusPill } from '../ui';
import { CheckCircle2, Eye, Package, Trash2 } from 'lucide-react';

export default function WorklogExport({ onToast }: { onToast: (message: string) => void }) {
  const { form, tickets, workTasks, bundleGenerated, resetSession } = useNexus();
  const [preview, setPreview] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  if (!bundleGenerated) return <div className="animate-fade-in"><SectionTitle eyebrow="Step 6" title="Worklog Preview" description="" /><EmptyState icon={Package} title="No worklog to preview" description="Generate a transition bundle first." /></div>;

  function closeView() {
    setConfirmClose(false); resetSession();
    onToast('Active case view closed. Persistent Neon records were not deleted.');
  }

  return <div className="animate-fade-in">
    <SectionTitle eyebrow="Step 6" title="Worklog Preview" description="Review a local on-screen summary. PDF download is not implemented in this MVP." />
    <Card className="mb-6 border-blue-100 bg-blue-50/40"><p className="text-sm text-slate-700"><strong>Truthful data boundary:</strong> closing this view clears the active browser state only. Saved cases, tickets, prerequisites, and audit events remain in Neon. No external ticketing records exist.</p></Card>
    <div className="grid gap-6 lg:grid-cols-3"><Card><h3 className="font-semibold">Actions</h3><button onClick={() => setPreview(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Eye className="h-4 w-4" />Generate On-Screen Preview</button><button onClick={() => setConfirmClose(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700"><Trash2 className="h-4 w-4" />Close Active Case View</button><p className="mt-3 text-xs text-slate-500">This does not sign out, delete the saved case, or erase its audit trail.</p></Card>
      <div className="lg:col-span-2">{!preview ? <Card className="flex min-h-80 flex-col items-center justify-center text-center"><Eye className="mb-3 h-9 w-9 text-slate-300" /><p className="font-semibold">Preview not generated</p><p className="mt-1 text-sm text-slate-500">Use the button to assemble current browser and persisted case state.</p></Card> : <Card><div className="flex items-center justify-between border-b pb-4"><div><p className="text-xs font-semibold uppercase text-slate-500">Onboard worklog preview</p><h3 className="text-xl font-semibold">{form.name || 'Employee'} · {form.newRole || 'Role'}</h3></div><span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />On-screen only</span></div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-500">Transition</dt><dd>{form.transitionType === 'Ministry Transfer' ? 'Internal Transfer' : form.transitionType}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Destination</dt><dd>{[form.newMinistry, form.newTeam].filter(Boolean).join(' / ')}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Manager</dt><dd>{form.manager}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Start date</dt><dd>{form.startDate}</dd></div></dl>
        <h4 className="mt-6 font-semibold">Internal requests</h4><ul className="mt-2 space-y-2">{tickets.map((ticket) => <li key={ticket.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm"><span>{ticket.name}{ticket.included === false ? ' (excluded)' : ''}</span><StatusPill status={ticket.status} /></li>)}</ul>
        <h4 className="mt-6 font-semibold">Day-One tasks</h4><ul className="mt-2 space-y-2">{workTasks.map((task) => <li key={task.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{task.name}</strong><span className={`ml-2 text-xs font-semibold ${task.ready ? 'text-emerald-700' : 'text-rose-700'}`}>{task.ready ? 'Ready' : 'Blocked'}</span><p className="mt-1 text-xs text-slate-500">{task.prerequisites.filter((item) => item.required && item.status !== 'verified').length} required prerequisites unresolved</p></li>)}</ul>
      </Card>}</div></div>
    <ConfirmationDialog open={confirmClose} title="Close the active case view?" description="Local form and note state will be cleared. Persistent Neon records will remain available in My Transition Cases." confirmLabel="Close View" onConfirm={closeView} onClose={() => setConfirmClose(false)} />
  </div>;
}
