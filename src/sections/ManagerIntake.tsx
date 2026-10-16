import { useState } from 'react';
import { useNexus } from '../store';
import { useLocale } from '../locale';
import { intakeToggles, locationOptions, scenarios, type FormState } from '../data';
import { Card, SectionTitle, ActionButton, ProgressBar, Toggle } from '../ui';
import {
  User,
  ArrowRight,
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  Laptop,
  Folder,
  Smartphone,
  ShieldCheck,
  KeyRound,
  Printer,
  ClipboardList,
  Sparkles,
  Package,
} from 'lucide-react';

const textIcons: Record<string, typeof User> = {
  user: User,
  'arrow-right': ArrowRight,
  building: Building2,
  briefcase: Briefcase,
  calendar: Calendar,
  'map-pin': MapPin,
};

const toggleIcons: Record<string, typeof Laptop> = {
  laptop: Laptop,
  folder: Folder,
  'message-square': KeyRound,
  mail: User,
  smartphone: Smartphone,
  shield: ShieldCheck,
  key: KeyRound,
  printer: Printer,
};

const textFields: { key: keyof FormState; label: string; icon: string }[] = [
  { key: 'name', label: 'Employee name', icon: 'user' },
  { key: 'transitionType', label: 'Transition type', icon: 'arrow-right' },
  { key: 'previousMinistry', label: 'Previous organization', icon: 'building' },
  { key: 'newMinistry', label: 'Destination organization', icon: 'building' },
  { key: 'newTeam', label: 'Destination team / division', icon: 'building' },
  { key: 'newRole', label: 'Role', icon: 'briefcase' },
  { key: 'startDate', label: 'Start date', icon: 'calendar' },
  { key: 'location', label: 'Location', icon: 'map-pin' },
  { key: 'manager', label: 'Manager', icon: 'user' },
];

export default function ManagerIntake({ onGenerate }: { onGenerate: () => void }) {
  const { form, updateField, loadDemo, activeScenario, activeCase, startEditableDemo, generateBundle, bundleGenerated, backendStatus, backendMessage } = useNexus();
  const { t, locale } = useLocale();
  const isTransfer = form.transitionType === 'Ministry Transfer';
  const [generationError, setGenerationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [generating, setGenerating] = useState(false);
  const [copyingDemo, setCopyingDemo] = useState(false);

  async function makeFixtureEditable() {
    if (!activeCase || activeCase.source !== 'fixture') return;
    setCopyingDemo(true); setGenerationError('');
    try { await startEditableDemo(activeCase); onGenerate(); }
    catch (error) { setGenerationError(error instanceof Error ? error.message : 'Unable to create an editable demo copy.'); }
    finally { setCopyingDemo(false); }
  }

  async function handleGenerate() {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errors.name = 'Employee name is required.';
    if (!form.transitionType) errors.transitionType = 'Choose New Hire or Internal Transfer.';
    if (isTransfer && !form.previousMinistry.trim()) errors.previousMinistry = 'Previous organization is required for an internal transfer.';
    if (!form.newMinistry.trim()) errors.newMinistry = 'Destination organization is required.';
    if (!form.newRole.trim()) errors.newRole = 'Role is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';
    if (!form.location.trim()) errors.location = 'Location or work arrangement is required.';
    if (!form.manager.trim()) errors.manager = 'Manager is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) { setGenerationError('Review the highlighted fields before generating the bundle.'); return; }
    setGenerating(true);
    setGenerationError('');
    try { await generateBundle(); onGenerate(); }
    catch (error) { setGenerationError(error instanceof Error ? error.message : 'Unable to generate the ticket bundle.'); }
    finally { setGenerating(false); }
  }

  const activeCount = intakeToggles.filter((t) => form[t.key]).length;

  return (
    <div className="animate-fade-in">
      <SectionTitle
        eyebrow="Step 1"
        title={t('intake.title')}
        description="One guided intake creates a persistent Transition Case. The form starts empty; optional demo data is available for the presentation."
      />

      {backendStatus !== 'connected' && (
        <Card className="mb-6 border-rose-200 bg-rose-50/70">
          <h3 className="font-semibold text-rose-900">Persistent workflow unavailable</h3>
          <p className="mt-1 text-sm text-rose-800">{backendMessage} Return to Home, run the app with <code>npx vercel dev</code> if needed, and select <strong>Unlock persistence</strong>. Request generation is disabled because local-only drafts cannot support secure editing or readiness updates.</p>
        </Card>
      )}

      {activeCase?.source === 'fixture' ? (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-700">
          <div><p className="font-semibold text-amber-950">Read-only fictional fixture</p><p className="mt-1">This example is intentionally immutable and is not a saved employee case. Create a new editable working copy to use ticket submission and Day-One Preflight.</p></div>
          <ActionButton onClick={() => void makeFixtureEditable()} loading={copyingDemo} disabled={backendStatus !== 'connected'} className="shrink-0">Start Editable Demo</ActionButton>
        </div>
      ) : (activeScenario === 'transfer' || activeScenario === 'newhire') && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-slate-700">
          <p>{locale === 'fr' ? 'Une copie fictive modifiable est prête. Elle deviendra un dossier enregistré lorsque vous générerez les demandes.' : `${scenarios[activeScenario].label} is loaded as a new editable draft. Generate the bundle to create a separate saved case; no existing Neon record will be overwritten.`}</p>
          <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-900">Editable demo draft</span>
        </div>
      )}


      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-700 text-white">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-navy-900">{t('intake.form')}</h3>
                <p className="text-sm text-slate-500">
                  {form.manager ? `Submitted by ${form.manager}` : 'Enter manager name'}
                </p>
              </div>
            </div>

            {/* text fields */}
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {textFields.map((f) => {
                const isPrevMinistry = f.key === 'previousMinistry';
                const Icon = textIcons[f.icon] ?? User;
                return (
                  <div key={f.key} className={isPrevMinistry && !isTransfer ? 'opacity-40' : ''}>
                    <label htmlFor={`intake-${f.key}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {f.label}
                      {isPrevMinistry && !isTransfer && <span className="ml-1.5 text-slate-300">(N/A for new hire)</span>}
                    </label>
                    <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                      <Icon className="h-4 w-4 shrink-0 text-navy-500" />
                      {f.key === 'transitionType' ? (
                        <select
                          id={`intake-${f.key}`}
                          aria-invalid={Boolean(fieldErrors[f.key])}
                          value={form.transitionType}
                          onChange={(e) => { updateField('transitionType', e.target.value as FormState['transitionType']); setFieldErrors((current) => ({ ...current, transitionType: undefined })); }}
                          className="h-10 w-full appearance-none bg-transparent text-sm font-medium text-slate-900 outline-none"
                        >
                          <option value="">Select transition type</option>
                          <option value="Ministry Transfer">Internal Transfer</option>
                          <option value="New Hire">New Hire</option>
                        </select>
                      ) : (
                        <input
                          id={`intake-${f.key}`}
                          list={f.key === 'location' ? 'location-suggestions' : undefined}
                          type={f.key === 'startDate' ? 'date' : 'text'}
                          value={form[f.key] as string}
                          disabled={isPrevMinistry && !isTransfer}
                          aria-invalid={Boolean(fieldErrors[f.key])}
                          onChange={(e) => { updateField(f.key, e.target.value as FormState[typeof f.key]); setFieldErrors((current) => ({ ...current, [f.key]: undefined })); }}
                          className="h-10 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                        />
                      )}
                    </div>
                    {fieldErrors[f.key] && <p className="mt-1 text-xs font-medium text-rose-700">{fieldErrors[f.key]}</p>}
                  </div>
                );
              })}
            </div>

            {/* toggle fields */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Onboarding requirements
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {intakeToggles.map((t) => {
                  const Icon = toggleIcons[t.icon] ?? Laptop;
                  return (
                    <Toggle
                      key={t.key}
                      checked={form[t.key] as boolean}
                      onChange={(v) => updateField(t.key, v as FormState[typeof t.key])}
                      label={t.label}
                      icon={<Icon className="h-4 w-4 shrink-0 text-navy-500" />}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
              <button type="button" onClick={() => loadDemo(isTransfer ? 'transfer' : 'newhire')} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">{locale === 'fr' ? `Charger la démo fictive de ${isTransfer ? 'Jim Halpert' : 'Maryam Arif'}` : `Load ${isTransfer ? 'Jim Halpert' : 'Maryam Arif'} fictional demo`}</button>
              <ActionButton onClick={handleGenerate} loading={generating} disabled={backendStatus !== 'connected' || activeCase?.source === 'fixture'} className="disabled:opacity-50">
                <Package className="h-4 w-4" />
                {t('form.generate')}
              </ActionButton>
              {bundleGenerated && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 animate-scale-in">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Bundle generated
                </span>
              )}
              {generationError && <p role="alert" className="w-full text-sm font-medium text-rose-700">{generationError}</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-navy-900">{t('intake.completeness')}</h3>
            <div className="space-y-3">
              {[
                { label: 'Employee identity', val: form.name && form.transitionType ? 100 : 50 },
                { label: 'Role & destination', val: form.newRole && form.newMinistry ? 100 : 50 },
                { label: 'Logistics & location', val: form.startDate && form.location ? 100 : 50 },
                { label: 'Onboarding requirements', val: Math.round((activeCount / 8) * 100) },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-navy-700">{row.val}%</span>
                  </div>
                  <ProgressBar value={row.val} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-50/70">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-navy-900">What happens next</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Onboard generates editable internal request drafts and a Day-One Preflight for {form.name || 'the employee'}.
                  External service-desk submission remains future scope.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <datalist id="location-suggestions">{locationOptions.map((option) => <option key={option} value={option} />)}</datalist>
    </div>
  );
}
