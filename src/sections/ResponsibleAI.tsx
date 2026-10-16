import { useNexus } from '../store';
import { responsibleAIPoints } from '../data';
import { Card, SectionTitle } from '../ui';
import { AlertTriangle, ArrowRight, Database, FileText, Lock, ShieldCheck, Sparkles } from 'lucide-react';

export default function ResponsibleAI() {
  const { justification, form } = useNexus();
  return <div className="animate-fade-in">
    <SectionTitle eyebrow="Step 6" title="Data Security and Automation Boundaries" description="What Onboard currently stores, what it simulates, and what remains future scope." />
    <div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2">
      <Card><h3 className="mb-4 flex items-center gap-2 font-semibold text-navy-900"><ShieldCheck className="h-4 w-4" />Current implementation boundaries</h3><ul className="space-y-3">{responsibleAIPoints.map((point) => <li key={point} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"><Database className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" /><p className="text-sm leading-relaxed text-slate-700">{point}</p></li>)}</ul></Card>
      <Card className="mt-6 border-amber-200 bg-amber-50/30"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" /><div><h3 className="font-semibold">Production review required</h3><p className="mt-1 text-sm text-slate-700">Production use requires approved identity and authorization, privacy and retention decisions, threat modelling, least-privilege database roles, operational monitoring, and system-owner approval.</p></div></div></Card>
    </div><div className="space-y-6">
      <Card className="bg-navy-50/40"><h3 className="mb-2 flex items-center gap-2 font-semibold"><ArrowRight className="h-4 w-4" />External request integration — future scope</h3><p className="text-sm leading-relaxed text-slate-600">The MVP stores request drafts and simulated internal submission only. A future approved connector could map reviewed drafts to ONRequest, ServiceNow, or another service desk; no external record is created today.</p></Card>
      <Card><h3 className="mb-2 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Rule-generated justification</h3><p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{justification}</p><p className="mt-2 flex gap-2 text-xs text-slate-500"><Sparkles className="h-3.5 w-3.5" />Generated deterministically from intake fields for {form.name || 'this employee'} — not AI.</p></Card>
      <Card><h3 className="mb-2 flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" />Data handling</h3><p className="text-sm leading-relaxed text-slate-600">Cases, request states, prerequisites, and audit events persist in Neon. Raw handover notes stay in active browser state until cleared or the active case view is closed. No AI provider is called.</p></Card>
    </div></div>
  </div>;
}
