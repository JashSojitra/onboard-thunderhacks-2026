import { useState } from 'react';
import { useNexus } from '../store';
import { ticketTransitions } from '../domain/workflow';
import { Card, SectionTitle, ActionButton, StatusPill, ApprovalTag, EmptyState } from '../ui';
import { Package, Rocket, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function TicketLaunchpad({ onToast }: { onToast: (message: string) => void }) {
  const { tickets, submitted, submitBundle, updateTicketStatus, updateTicketDraft, bundleGenerated, activeCase, startEditableDemo, backendStatus } = useNexus();
  const [submitting, setSubmitting] = useState(false);
  const [copyingDemo, setCopyingDemo] = useState(false);

  if (!bundleGenerated) return <div className="animate-fade-in"><SectionTitle eyebrow="Step 2" title="Ticket Launchpad" description="" /><EmptyState icon={Package} title="No bundle generated yet" description="Complete the Manager Intake and generate a transition bundle first." /></div>;

  const editable = !submitted && activeCase?.source === 'persistent';
  const included = tickets.filter((ticket) => ticket.included !== false);
  const needsApproval = included.filter((ticket) => ['needs-approval', 'attention', 'pending-approval'].includes(ticket.status)).length;

  async function saveDraft(ticketId: string, update: Parameters<typeof updateTicketDraft>[1], success: string) {
    try { await updateTicketDraft(ticketId, update); onToast(success); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Unable to update the draft.'); throw error; }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitBundle();
      onToast(activeCase?.source === 'persistent' ? 'Internal submission stored. No external service-desk tickets were created.' : 'Demo bundle changed locally; it is not persisted.');
    } catch (error) { onToast(error instanceof Error ? error.message : 'Unable to submit bundle.'); }
    finally { setSubmitting(false); }
  }

  async function makeFixtureEditable() {
    if (!activeCase || activeCase.source !== 'fixture') return;
    setCopyingDemo(true);
    try { await startEditableDemo(activeCase); onToast('Editable persistent demo created. Draft requests and Day-One Preflight are ready.'); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Unable to create an editable demo copy.'); }
    finally { setCopyingDemo(false); }
  }

  return <div className="animate-fade-in">
    <SectionTitle eyebrow="Step 2" title="Ticket Launchpad" description="Review and edit internal request drafts. Eligible optional drafts can be excluded before one simulated bulk submission." />
    {activeCase?.source === 'fixture' && <Card className="mb-5 border-amber-200 bg-amber-50/70"><div className="flex flex-wrap items-center gap-4"><div className="min-w-64 flex-1"><h3 className="font-semibold text-amber-950">Read-only fictional fixture</h3><p className="mt-1 text-sm text-amber-900">These requests are a preview. Start a separate persistent working copy to edit drafts, submit, update fulfillment, and verify readiness.</p></div><ActionButton onClick={() => void makeFixtureEditable()} loading={copyingDemo} disabled={backendStatus !== 'connected'}>Start Editable Demo</ActionButton></div>{backendStatus !== 'connected' && <p className="mt-3 text-xs font-medium text-rose-700">Return Home and unlock persistence before creating the editable copy.</p>}</Card>}
    <div className="mb-5 flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700"><Package className="h-3.5 w-3.5" />Generated from the intake</span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"><Info className="h-3.5 w-3.5" />Internal drafts only — no external connector</span>
    </div>
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {([['Generated', tickets.length], ['Included', included.length], ['Need approval', needsApproval], ['Bundle state', submitted ? 'Internal' : 'Draft']] as const).map(([label, value]) => <Card key={label} className="summary-card py-4"><p className="text-2xl font-bold text-navy-900">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></Card>)}
    </div>
    <Card padded={false} className="mb-6 overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-serif text-lg font-semibold text-navy-900">Generated request bundle</h3><p className="mt-1 text-xs text-slate-500">Required drafts cannot be excluded. Draft fields lock after internal submission.</p></div>
      <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><caption className="sr-only">Editable internal request drafts</caption>
        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Include</th><th className="px-4 py-3">Draft title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Approval path</th><th className="px-4 py-3">External system</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{tickets.map((ticket) => <tr key={ticket.id} className={ticket.included === false ? 'bg-slate-50 opacity-70' : ''}>
          <td className="px-4 py-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ticket.included !== false} disabled={!editable || ticket.required !== false} onChange={(event) => void saveDraft(ticket.id, { included: event.target.checked }, 'Draft inclusion saved.')} /><span>{ticket.required === false ? 'Optional' : 'Required'}</span></label></td>
          <td className="px-4 py-3">{editable ? <input aria-label={`Title for ${ticket.name}`} defaultValue={ticket.name} onBlur={(event) => { if (event.target.value !== ticket.name) void saveDraft(ticket.id, { name: event.target.value }, 'Draft title saved.').catch(() => { event.target.value = ticket.name; }); }} className="w-full min-w-56 rounded-md border border-slate-200 px-2 py-1.5 font-medium" /> : <span className="font-medium text-navy-900">{ticket.name}</span>}</td>
          <td className="px-4 py-3">{editable ? <input aria-label={`Category for ${ticket.name}`} defaultValue={ticket.category} onBlur={(event) => { if (event.target.value !== ticket.category) void saveDraft(ticket.id, { category: event.target.value }, 'Draft category saved.').catch(() => { event.target.value = ticket.category; }); }} className="w-36 rounded-md border border-slate-200 px-2 py-1.5" /> : ticket.category}</td>
          <td className="px-4 py-3"><div className="flex items-center gap-2"><StatusPill status={ticket.status} />{submitted && ticket.included !== false && ticketTransitions[ticket.status].length > 0 && <select aria-label={`Update ${ticket.name} status`} value={ticket.status} onChange={async (event) => { try { await updateTicketStatus(ticket.id, event.target.value as typeof ticket.status); onToast('Fulfillment status saved.'); } catch (error) { onToast(error instanceof Error ? error.message : 'Unable to update status.'); } }} className="rounded-md border border-slate-200 px-2 py-1 text-xs"><option value={ticket.status}>{ticket.status}</option>{ticketTransitions[ticket.status].map((status) => <option key={status} value={status}>{status}</option>)}</select>}</div></td>
          <td className="px-4 py-3">{editable ? <input aria-label={`Approval path for ${ticket.name}`} defaultValue={ticket.approvalPath} onBlur={(event) => { if (event.target.value !== ticket.approvalPath) void saveDraft(ticket.id, { approvalPath: event.target.value }, 'Approval path saved.').catch(() => { event.target.value = ticket.approvalPath; }); }} className="w-48 rounded-md border border-slate-200 px-2 py-1.5" /> : <ApprovalTag path={ticket.approvalPath} />}</td>
          <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">Future scope</span></td>
        </tr>)}</tbody>
      </table></div>
    </Card>
    <Card className="flex flex-wrap items-center gap-4">
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg text-white ${submitted ? 'bg-blue-600' : 'bg-navy-700'}`}>{submitted ? <CheckCircle2 className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}</span>
      <div className="min-w-64 flex-1"><h3 className="text-sm font-semibold text-navy-900">{submitted ? 'Internally submitted' : 'Simulate internal bulk submission'}</h3><p className="text-sm text-slate-500">{submitted ? 'The Onboard state and audit event are stored. No ONRequest, ServiceNow, facilities, or other external tickets were created.' : 'Included drafts move to internal submitted or pending-approval states. This does not fulfill access or equipment.'}</p></div>
      {needsApproval > 0 && !submitted && <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangle className="h-4 w-4" />Approval routing retained</span>}
      {submitted ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">Stored internally</span> : <ActionButton onClick={handleSubmit} loading={submitting} disabled={activeCase?.source !== 'persistent'}><Rocket className="h-4 w-4" />Simulate Bulk Submit</ActionButton>}
      {activeCase?.source !== 'persistent' && <p role="status" className="w-full text-xs text-amber-700">{activeCase?.source === 'fixture' ? 'This fixture is read-only. Select Start Editable Demo above.' : 'Generate the bundle from Manager Intake to create the saved case required for submission.'}</p>}
    </Card>
  </div>;
}
