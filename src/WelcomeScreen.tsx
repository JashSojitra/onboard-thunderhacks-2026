import { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, Building2, FolderOpen, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocale } from './locale';
import { useNexus } from './store';

export default function WelcomeScreen({ onContinue, onCases }: { onContinue: () => void; onCases: () => void }) {
  const { locale, setLocale, t } = useLocale();
  const { startCase, backendStatus, backendMessage, signIn, signOut } = useNexus();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'true');
  const phrases = locale === 'fr'
    ? ['Intégrer un nouvel employé', 'Coordonner une mutation interne', 'Rouvrir un dossier actif']
    : ['Onboard a new employee', 'Coordinate an internal transfer', 'Reopen an active case'];

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const refresh = () => setReduceMotion(query.matches || document.documentElement.dataset.motion === 'true');
    const observer = new MutationObserver(refresh);
    query.addEventListener('change', refresh); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] }); refresh();
    return () => { query.removeEventListener('change', refresh); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => setPhraseIndex((value) => (value + 1) % phrases.length), 3000);
    return () => window.clearInterval(interval);
  }, [reduceMotion, phrases.length]);

  const choices = [
    { id: 'New Hire' as const, icon: Briefcase, tone: 'newhire', title: locale === 'fr' ? 'Commencer une nouvelle embauche' : 'Start New Hire', description: locale === 'fr' ? 'Créer un dossier d’intégration pour un nouvel employé.' : 'Create a new employee onboarding case.' },
    { id: 'Ministry Transfer' as const, icon: Building2, tone: 'transfer', title: locale === 'fr' ? 'Commencer une mutation interne' : 'Start Internal Transfer', description: locale === 'fr' ? 'Créer un dossier de mutation avec révision des anciens accès.' : 'Create a transfer case with previous-access review and new-role requirements.' },
  ];
  const staticPhrase = locale === 'fr' ? 'Gérer une transition d’employé' : 'Manage an employee transition';

  return <main className="nexus-welcome">
    <header className="nexus-welcome__header"><div className="flex items-center gap-3"><span className="nexus-welcome__mark"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-semibold tracking-tight">Onboard</p><p className="text-xs text-[var(--text-muted)]">One intake. Every request. Ready for day one.</p></div></div><div className="flex items-center gap-3"><span className="nexus-welcome__security"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />{t('header.security')}</span><div className="nexus-welcome__language" role="group" aria-label={t('header.language')}>{(['en', 'fr'] as const).map((language) => <button key={language} onClick={() => setLocale(language)} aria-pressed={locale === language} className={locale === language ? 'is-selected' : ''}>{language.toUpperCase()}</button>)}</div></div></header>
    <section className="nexus-welcome__hero" aria-labelledby="welcome-title"><div className="nexus-welcome__eyebrow"><Sparkles className="h-4 w-4" aria-hidden="true" />Release candidate · fictional demo data</div><h1 id="welcome-title"><span className="sr-only">{staticPhrase}</span><span aria-hidden="true">{locale === 'fr' ? 'Commencez avec un parcours guidé' : 'Start with one guided workflow'}<span className="nexus-welcome__rotator" key={`${locale}-${phraseIndex}`}>{reduceMotion ? staticPhrase : phrases[phraseIndex]}</span></span></h1><p>{locale === 'fr' ? 'Une saisie. Chaque demande. Prêt dès le premier jour.' : 'One intake. Every request. Ready for day one.'}</p>
      <div className="nexus-welcome__chooser">{choices.map((choice) => { const Icon = choice.icon; return <button key={choice.id} className={`nexus-welcome__choice nexus-welcome__choice--${choice.tone}`} onClick={() => { startCase(choice.id); onContinue(); }}><span className="nexus-welcome__choice-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 text-left"><span className="block text-sm font-semibold">{choice.title}</span><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{choice.description}</span></span><ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" /></button>; })}<button className="nexus-welcome__choice nexus-welcome__choice--cases" onClick={onCases}><span className="nexus-welcome__choice-icon"><FolderOpen className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 text-left"><span className="block text-sm font-semibold">{locale === 'fr' ? 'Mes dossiers de transition' : 'My Transition Cases'}</span><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{locale === 'fr' ? 'Rouvrez les dossiers actifs et poursuivez le travail.' : 'Reopen saved cases, review blockers, and continue work.'}</span></span><ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" /></button></div>
      <div className="nexus-welcome__note"><p>{backendMessage}</p>{backendStatus === 'locked' && <form className="mt-3 flex gap-2" onSubmit={async (event) => { event.preventDefault(); setAccessBusy(true); setAccessError(''); try { await signIn(accessCode); setAccessCode(''); } catch (error) { setAccessError(error instanceof Error ? error.message : 'Access failed.'); } finally { setAccessBusy(false); } }}><label className="sr-only" htmlFor="demo-access">Demo access code</label><input id="demo-access" type="password" autoComplete="current-password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Demo access code" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button disabled={accessBusy || accessCode.length < 8} title={accessCode.length < 8 ? 'Enter the configured demo access code (at least 8 characters).' : undefined} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{accessBusy ? 'Connecting…' : 'Unlock persistence'}</button></form>}{backendStatus === 'connected' && <button onClick={() => void signOut()} className="mt-2 text-xs font-semibold underline">End demo session</button>}{accessError && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{accessError}</p>}<p className="mt-2 text-xs">The role display is presentation context only; authorization is enforced by the server session and database boundary.</p></div>
    </section>
  </main>;
}
