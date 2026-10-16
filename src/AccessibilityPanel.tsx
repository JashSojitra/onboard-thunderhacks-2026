import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Accessibility, X, RotateCcw } from 'lucide-react';
import { useLocale } from './locale';

type Prefs = { size: string; contrast: string; motion: boolean; spacing: boolean; underline: boolean; focus: boolean };
const defaults: Prefs = { size: '100', contrast: 'default', motion: false, spacing: false, underline: false, focus: false };

export default function AccessibilityPanel() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [statement, setStatement] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(() => { try { return { ...defaults, ...JSON.parse(localStorage.getItem('nexus-accessibility') || '{}') }; } catch { return defaults; } });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    localStorage.setItem('nexus-accessibility', JSON.stringify(prefs));
    const root = document.documentElement;
    root.dataset.contrast = prefs.contrast; root.dataset.theme = prefs.contrast; root.dataset.motion = String(prefs.motion);
    root.dataset.spacing = String(prefs.spacing); root.dataset.underline = String(prefs.underline); root.dataset.focus = String(prefs.focus);
    root.style.fontSize = `${prefs.size}%`;
  }, [prefs]);
  useEffect(() => { if (open) panel.current?.focus(); else trigger.current?.focus(); }, [open]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); setStatement(false); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs(current => ({ ...current, [key]: value }));
  const close = () => setOpen(false);

  return <>
    <button
      ref={trigger}
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t('accessibility')}
      aria-expanded={open}
      aria-controls="accessibility-panel"
      data-label={t('accessibility')}
      className="accessibility-trigger"
    >
      <Accessibility className="accessibility-trigger__glyph" aria-hidden="true" />
      <span className="sr-only">{t('accessibility')}</span>
    </button>
    {open && createPortal(<aside id="accessibility-panel" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="access-title" className="accessibility-panel">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Onboard</p><h2 id="access-title" className="mt-1 text-xl font-semibold">{t('accessibility.title')}</h2></div>
        <button type="button" onClick={close} aria-label={t('close')} className="accessibility-icon-button"><X aria-hidden="true" /></button>
      </div>
      <div className="mt-6 space-y-6">
        <Field label={t('accessibility.textSize')}><div className="grid grid-cols-4 gap-2">{['100', '125', '150', '200'].map(size => <button key={size} type="button" aria-pressed={prefs.size === size} onClick={() => update('size', size)} className={`accessibility-choice ${prefs.size === size ? 'is-selected' : ''}`}>{size}%</button>)}</div></Field>
        <Field label={t('accessibility.contrast')}><select value={prefs.contrast} onChange={event => update('contrast', event.target.value)} className="accessibility-select"><option value="default">{t('accessibility.default')}</option><option value="high">{t('accessibility.high')}</option><option value="dark">{t('accessibility.dark')}</option></select></Field>
        {([['motion', 'accessibility.motion', 'accessibility.motionDesc'], ['spacing', 'accessibility.spacing', 'accessibility.spacingDesc'], ['underline', 'accessibility.underline', ''], ['focus', 'accessibility.focus', '']] as const).map(([key, label, description]) => <label key={key} className="accessibility-option"><input type="checkbox" checked={prefs[key]} onChange={event => update(key, event.target.checked)} /><span><span className="block text-sm font-semibold">{t(label)}</span>{description && <span className="mt-1 block text-xs text-slate-500">{t(description)}</span>}</span></label>)}
        <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--border)] pt-5"><button type="button" onClick={() => setPrefs(defaults)} className="accessibility-text-action"><RotateCcw className="h-4 w-4" />{t('accessibility.reset')}</button><button type="button" onClick={() => setStatement(true)} className="accessibility-text-action">{t('accessibility.statement')}</button></div>
      </div>
    </aside>, document.body)}
    {statement && createPortal(<div role="dialog" aria-modal="true" aria-labelledby="statement-title" className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4"><div className="accessibility-statement w-full max-w-lg rounded-2xl p-6"><h2 id="statement-title" className="text-lg font-semibold">{t('accessibility.statementTitle')}</h2><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{t('accessibility.statementText')}</p><button type="button" onClick={() => setStatement(false)} className="premium-button mt-5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">{t('close')}</button></div></div>, document.body)}
  </>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-semibold">{label}</label>{children}</div>; }
