import { useState } from 'react';
import { NexusProvider, useNexus } from './store';
import { Toast } from './ui';
import EmployeeHeader from './EmployeeHeader';
import ManagerIntake from './sections/ManagerIntake';
import TicketLaunchpad from './sections/TicketLaunchpad';
import ReadinessDashboard from './sections/ReadinessDashboard';
import AccessCleanupReview from './sections/AccessCleanupReview';
import AIStarterBrief from './sections/AIStarterBrief';
import ResponsibleAI from './sections/ResponsibleAI';
import WorklogExport from './sections/WorklogExport';
import TransitionCases from './sections/TransitionCases';
import AccessibilityPanel from './AccessibilityPanel';
import WelcomeScreen from './WelcomeScreen';
import { Home, Save, CheckCircle2, UserRound } from 'lucide-react';

type Tab = 'welcome' | 'intake' | 'launchpad' | 'dashboard' | 'access' | 'brief' | 'rai' | 'worklog' | 'cases';
const caseTabs: { id: Tab; label: string }[] = [
  { id: 'welcome', label: 'Home' }, { id: 'intake', label: 'Manager Intake' },
  { id: 'launchpad', label: 'Request Launchpad' }, { id: 'dashboard', label: 'Day-One Preflight' },
  { id: 'access', label: 'Access Review' }, { id: 'brief', label: 'Starter Brief' },
  { id: 'worklog', label: 'Worklog Preview' }, { id: 'cases', label: 'My Transition Cases' },
];

function Content() {
  const [tab, setTab] = useState<Tab>('welcome');
  const [toast, setToast] = useState({ msg: '', show: false });
  const [confirm, setConfirm] = useState(false);
  const { form, activeCase, hasUnsavedChanges, saveCase, markComplete, reassignOwner, clearActiveCase, backendStatus } = useNexus();
  const flash = (msg: string) => { setToast({ msg, show: true }); window.setTimeout(() => setToast((value) => ({ ...value, show: false })), 3000); };
  const go = (next: Tab) => {
    if (next === 'welcome' && hasUnsavedChanges) { setConfirm(true); return; }
    if (['launchpad', 'dashboard', 'access', 'brief', 'worklog'].includes(next) && !activeCase && !form.name) { flash('Create or open a Transition Case first.'); setTab('intake'); return; }
    setTab(next);
  };
  const save = async (close = false) => {
    try { await saveCase(); flash('Case saved to persistent storage.'); if (close) { clearActiveCase(); setTab('welcome'); } }
    catch (error) { flash(error instanceof Error ? error.message : 'Unable to save case.'); }
  };
  const complete = async () => {
    try { await markComplete(); flash('Case marked complete.'); }
    catch (error) { flash(error instanceof Error ? error.message : 'Unable to complete case.'); }
  };
  const home = async (shouldSave: boolean) => {
    if (shouldSave) { try { await saveCase(); } catch (error) { flash(error instanceof Error ? error.message : 'Unable to save case.'); return; } }
    clearActiveCase(); setConfirm(false); setTab('welcome');
  };

  if (tab === 'welcome') return <><WelcomeScreen onContinue={() => setTab('intake')} onCases={() => setTab('cases')} /><AccessibilityPanel /><Dialog open={confirm} onSave={() => void home(true)} onDiscard={() => void home(false)} onCancel={() => setConfirm(false)} /></>;

  return <div className="flex min-h-screen bg-[var(--app)]">
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <button onClick={() => go('welcome')} className="w-full border-b border-slate-200 p-5 text-left"><span className="block text-sm font-bold">Onboard</span><span className="mt-1 block text-[11px] text-slate-500">One intake. Every request. Ready for day one.</span></button>
      <nav className="space-y-1 p-3" aria-label="Main navigation">{caseTabs.map((item) => { const disabled = ['launchpad', 'dashboard', 'access', 'brief', 'worklog'].includes(item.id) && !activeCase && !form.name; return <button key={item.id} onClick={() => go(item.id)} disabled={disabled} title={disabled ? 'Create or open a Transition Case first.' : undefined} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${tab === item.id ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-40`}>{item.label}</button>;})}</nav>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-3">
        <button onClick={() => go('welcome')} className="font-bold">Onboard</button>
        <span className="ml-3 text-sm text-slate-500">{activeCase ? `${activeCase.id} · ${form.name}` : 'New Transition Case'}</span>
        <span className={`ml-3 rounded-full px-2 py-1 text-[11px] font-semibold ${activeCase?.source === 'persistent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{activeCase?.source === 'persistent' ? 'Editable saved case' : activeCase?.source === 'fixture' ? 'Read-only fictional fixture' : backendStatus === 'connected' ? 'Unsaved editable draft' : 'Persistence unavailable'}</span>
      </header>
      {tab !== 'cases' && tab !== 'rai' && <EmployeeHeader />}
      <main className="px-4 py-7 sm:px-7"><div className="mx-auto max-w-[1180px]">
        <div className="mb-5 flex flex-wrap gap-2">
          <button onClick={() => go('welcome')} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><Home className="mr-1 inline h-3.5 w-3.5" />Back to Home</button>
          {tab !== 'cases' && tab !== 'rai' && <>
            <button onClick={() => void save()} className="rounded-lg border px-3 py-2 text-xs font-semibold"><Save className="mr-1 inline h-3.5 w-3.5" />Save Draft</button>
            <button onClick={() => void save(true)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Save and Close</button>
            <button onClick={() => void complete()} className="rounded-lg border px-3 py-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Mark Complete</button>
            <button onClick={() => { reassignOwner(); flash('Enter the authorized replacement manager, then save.'); }} className="rounded-lg border px-3 py-2 text-xs font-semibold"><UserRound className="mr-1 inline h-3.5 w-3.5" />Reassign Owner</button>
          </>}
        </div>
        {tab === 'intake' && <ManagerIntake onGenerate={() => go('launchpad')} />}
        {tab === 'launchpad' && <TicketLaunchpad onToast={flash} />}
        {tab === 'dashboard' && <ReadinessDashboard />}
        {tab === 'access' && <AccessCleanupReview onToast={flash} />}
        {tab === 'brief' && <AIStarterBrief onToast={flash} />}
        {tab === 'rai' && <ResponsibleAI />}
        {tab === 'worklog' && <WorklogExport onToast={flash} />}
        {tab === 'cases' && <TransitionCases onOpen={(destination = 'intake') => setTab(destination)} />}
      </div></main>
      <footer className="border-t border-slate-200 bg-white p-4 text-xs text-slate-500">Persistent cases and ticket status changes are stored through the server API and logged as audit events. Presentation fixtures are labeled separately and are never written to the application database.</footer>
    </div>
    <Toast message={toast.msg} show={toast.show} /><AccessibilityPanel />
    <Dialog open={confirm} onSave={() => void home(true)} onDiscard={() => void home(false)} onCancel={() => setConfirm(false)} />
  </div>;
}

function Dialog({ open, onSave, onDiscard, onCancel }: { open: boolean; onSave: () => void; onDiscard: () => void; onCancel: () => void }) {
  if (!open) return null;
  return <div role="dialog" aria-modal="true" aria-labelledby="unsaved" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="unsaved" className="text-lg font-bold">Unsaved case changes</h2><p className="mt-2 text-sm text-slate-600">You have unsaved changes. Save this case before returning home?</p><div className="mt-5 flex gap-2"><button autoFocus onClick={onCancel} className="px-3 py-2 text-sm">Cancel</button><button onClick={onDiscard} className="rounded-lg border px-3 py-2 text-sm">Return Without Saving</button><button onClick={onSave} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">Save and Return Home</button></div></div></div>;
}

export default function App() { return <NexusProvider><Content /></NexusProvider>; }
