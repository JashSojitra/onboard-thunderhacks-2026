import { useMemo, useState } from 'react';
import { Archive, Copy, FolderOpen, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useNexus, type CaseStatus, type TransitionCase } from '../store';
import { Card, ConfirmationDialog, SectionTitle } from '../ui';
import { formatLocalizedDate, useLocale } from '../locale';

export default function TransitionCases({ onOpen }: { onOpen: (destination?: 'intake' | 'launchpad') => void }) {
  const { cases, openCase, startEditableDemo, archiveCase, backendStatus, backendMessage } = useNexus();
  const { locale } = useLocale();
  const [filter, setFilter] = useState<'All' | CaseStatus>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated');
  const [archiveTarget, setArchiveTarget] = useState<TransitionCase | null>(null);
  const [message, setMessage] = useState('');
  const [copyingId, setCopyingId] = useState('');

  const rows = useMemo(() => cases
    .filter((item) => (filter === 'All' || item.status === filter)
      && `${item.form.name} ${item.id}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'readiness'
      ? (b.readiness ?? 0) - (a.readiness ?? 0)
      : sort === 'start'
        ? a.form.startDate.localeCompare(b.form.startDate)
        : b.lastUpdated.localeCompare(a.lastUpdated)), [cases, filter, query, sort]);

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveCase(archiveTarget);
      setMessage(`${archiveTarget.id} archived. It is hidden from active case lists but retained in the database audit trail.`);
      setArchiveTarget(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The case could not be archived.');
    }
  };

  const copyFixture = async (selected: TransitionCase) => {
    setCopyingId(selected.id); setMessage('');
    try {
      await startEditableDemo(selected);
      onOpen('launchpad');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The editable demo could not be created.');
    } finally {
      setCopyingId('');
    }
  };

  return (
    <div className="animate-fade-in">
      <SectionTitle
        eyebrow="Cases"
        title={locale === 'fr' ? 'Mes dossiers de transition' : 'My Transition Cases'}
        description={locale === 'fr' ? 'Rouvrez les dossiers actifs et poursuivez le travail.' : 'Reopen active cases, review blockers, and continue previous work.'}
      />
      <Card className="mb-6 border-blue-100 bg-blue-50/40">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <div>
            <h3 className="font-semibold text-slate-900">Case access and ownership</h3>
            <p className="mt-1 text-sm text-slate-600">The release candidate uses an explicit time-limited demo session enforced by the server. The manager label is presentation context and does not grant authorization.</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Persistent records come from Neon PostgreSQL; labeled demo fixtures remain read-only and separate.</p>
            {backendStatus !== 'connected' && <p className="mt-2 text-xs font-semibold text-rose-700">{backendMessage} Return Home and unlock persistence before creating or reopening saved work.</p>}
          </div>
        </div>
      </Card>
      {message && <p role="status" className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</p>}
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <span className="sr-only">Search cases</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === 'fr' ? 'Rechercher un employé ou un numéro' : 'Search employee or Case ID'} className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm" />
        </label>
        <select aria-label="Sort cases" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-slate-300 px-3 text-sm">
          <option value="updated">Last updated</option><option value="readiness">Readiness</option><option value="start">Start date</option>
        </select>
        {(['All', 'Active', 'At Risk', 'Waiting', 'Completed'] as const).map((value) => (
          <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-xl px-3 py-2 text-xs font-semibold ${filter === value ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600'}`}>{value}</button>
        ))}
      </div>
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Transition cases</caption>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Employee', 'Case ID', 'Transition', 'Readiness', 'Main blocker', 'Status', 'Source', 'Last updated', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody>{rows.map((item) => (
              <tr key={`${item.source}-${item.id}`} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 font-semibold text-slate-900">{item.form.name}</td><td className="whitespace-nowrap px-4 py-3">{item.id}</td><td className="px-4 py-3">{item.form.transitionType}</td><td className="px-4 py-3">{item.readiness ?? '—'}{item.readiness !== undefined && '%'}</td><td className="max-w-64 px-4 py-3">{item.blocker || '—'}</td><td className="px-4 py-3 font-medium">{item.status}</td>
                <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${item.source === 'persistent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.source === 'persistent' ? 'Persistent' : 'Fictional fixture'}</span></td>
                <td className="whitespace-nowrap px-4 py-3">{formatLocalizedDate(item.lastUpdated, locale)}</td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { void openCase(item).then(() => onOpen('intake')).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'The case could not be opened.')); }} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"><FolderOpen className="h-3.5 w-3.5" />{item.source === 'fixture' ? 'Preview' : 'Open'}</button>{item.source === 'fixture' ? <button disabled={backendStatus !== 'connected' || copyingId === item.id} onClick={() => void copyFixture(item)} title={backendStatus !== 'connected' ? 'Unlock persistence from Home first.' : 'Create a separate saved case from this fictional fixture.'} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Copy className="h-3.5 w-3.5" />{copyingId === item.id ? 'Creating…' : 'Start Editable Demo'}</button> : <button onClick={() => setArchiveTarget(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><Archive className="h-3.5 w-3.5" />Archive</button>}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><UserRound className="h-4 w-4" />Demo actor: demo-manager</p>
      <ConfirmationDialog open={Boolean(archiveTarget)} title="Archive this persistent case?" description="The case will disappear from active lists. Its database record and audit history are retained, so this is safer than deleting demo data." confirmLabel="Archive Case" onConfirm={() => { void confirmArchive(); }} onClose={() => setArchiveTarget(null)} />
    </div>
  );
}
