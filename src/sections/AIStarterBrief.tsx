import { useMemo, useState } from 'react';
import { useNexus } from '../store';
import { Card, SectionTitle, ActionButton, EmptyState } from '../ui';
import { AlertTriangle, CheckCircle2, FileText, Package, Sparkles } from 'lucide-react';
import { buildRuleBasedBrief } from '../domain/starterBrief';

export default function AIStarterBrief({ onToast }: { onToast: (message: string) => void }) {
  const { form, briefGenerated, setBriefGenerated, handoverNotes, setHandoverNotes, bundleGenerated } = useNexus();
  const [reviewed, setReviewed] = useState(false);
  const sections = useMemo(() => buildRuleBasedBrief(handoverNotes, form.name, form.newRole, form.manager), [handoverNotes, form.name, form.newRole, form.manager]);

  if (!bundleGenerated) return <div className="animate-fade-in"><SectionTitle eyebrow="Step 5" title="Starter Brief" description="" /><EmptyState icon={Package} title="No brief available yet" description="Generate a transition bundle first." /></div>;

  function generate() {
    setReviewed(false); setBriefGenerated(true);
    onToast('Rule-based draft generated locally. This output was not created by AI.');
  }

  return <div className="animate-fade-in">
    <SectionTitle eyebrow="Step 5" title="Starter Brief — Rule-Based Fallback" description="A transparent local parser organizes fictional handover notes. It is not AI and requires manager review." />
    <Card className="mb-6 border-amber-200 bg-amber-50/40"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" /><div><h3 className="font-semibold text-slate-900">RULE-BASED, NOT AI</h3><p className="mt-1 text-sm text-slate-600">No AI provider key is configured. Onboard uses deterministic keyword grouping in the browser. Notes remain in active UI state until cleared; no deletion, retention, or provider-training guarantee is claimed.</p></div></div></Card>
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2"><label htmlFor="handover-notes" className="mb-2 block text-sm font-semibold text-navy-900">Fictional handover notes</label><textarea id="handover-notes" value={handoverNotes} onChange={(event) => { setHandoverNotes(event.target.value); setBriefGenerated(false); setReviewed(false); }} rows={18} placeholder="Paste fictional notes. Avoid personal, confidential, or production data." className="min-h-[22rem] w-full resize-y rounded-xl border border-slate-300 p-4 text-sm leading-relaxed" /><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-500">{handoverNotes.length} characters · active UI state</span><div className="flex gap-2"><button onClick={() => { setHandoverNotes(''); setBriefGenerated(false); }} disabled={!handoverNotes} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50">Clear notes</button><ActionButton onClick={generate} disabled={!handoverNotes.trim()}><Sparkles className="h-4 w-4" />Generate Rule-Based Draft</ActionButton></div></div></Card>
      <div className="lg:col-span-3">{!briefGenerated ? <Card className="flex min-h-[420px] flex-col items-center justify-center text-center"><FileText className="mb-3 h-10 w-10 text-slate-300" /><h3 className="text-lg font-semibold">No draft generated</h3><p className="mt-1 max-w-md text-sm text-slate-500">The fallback sorts sentences into six fixed sections and flags unsupported details for confirmation.</p></Card> : <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800"><FileText className="h-4 w-4" />Rule-based draft for {form.name || 'employee'} · manager review required</div>
        <div className="grid gap-4 md:grid-cols-2">{sections.map((section) => <Card key={section.heading}><h3 className="mb-3 font-semibold text-navy-900">{section.heading}</h3><ul className="space-y-2">{section.items.map((item, index) => <li key={`${section.heading}-${index}`} className="rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{item}</li>)}</ul></Card>)}</div>
        <Card><label className="flex items-start gap-3"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} className="mt-1" /><span><strong className="block text-sm text-slate-900">Manager review</strong><span className="text-sm text-slate-600">I reviewed this deterministic draft and will confirm unresolved statements before sharing it.</span></span></label>{reviewed && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Reviewed in this session (not yet persisted as a finalized document).</p>}</Card>
      </div>}</div>
    </div>
  </div>;
}
