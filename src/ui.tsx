import type { RiskLevel, TicketStatus } from './data';
import { FileText, X } from 'lucide-react';
import { useLocale } from './locale';

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const { t } = useLocale();
  const map: Record<RiskLevel, { label: string; cls: string; dot: string }> = {
    low: { label: 'Low risk', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    medium: { label: 'At risk', cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    high: { label: 'Blocked', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  };
  const s = map[risk];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {t(`risk.${risk}`)}
    </span>
  );
}

export function StatusPill({ status }: { status: TicketStatus }) {
  const { t } = useLocale();
  const map: Record<TicketStatus, { label: string; cls: string }> = {
    'draft-ready': { label: 'Draft ready', cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
    optional: { label: 'Optional', cls: 'bg-slate-100 text-slate-600' },
    'needs-approval': { label: 'Pending approval', cls: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200' },
    attention: { label: 'Attention required', cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
    submitted: { label: 'Submitted', cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200' },
    'pending-approval': { label: 'Pending approval', cls: 'bg-indigo-50 text-indigo-700' },
    'in-progress': { label: 'In progress', cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
    waiting: { label: 'Blocked', cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
    'not-started': { label: 'Not started', cls: 'bg-slate-100 text-slate-600' },
    complete: { label: 'Complete', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  };
  const s = map[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>{t(`status.${status}`)}</span>;
}

export function ApprovalTag({ path }: { path: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
      {path}
    </span>
  );
}

export function ProgressBar({ value, tone = 'navy' }: { value: number; tone?: 'navy' | 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    navy: 'bg-navy-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${tones[tone]} transition-all duration-700 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Card({
  children,
  className = '',
  padded = true,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
}) {
  return (
    <div className={`premium-card rounded-[20px] border ${interactive ? 'premium-interactive' : ''} ${padded ? 'p-6 sm:p-7' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-7">
      {eyebrow && <p className="mb-2 text-xs font-medium text-blue-600">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[28px]">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-600 active:from-blue-700 active:to-indigo-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
    success: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`premium-button inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  );
}

export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-navy-900">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ready</span>
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-navy-800">
        {icon}
        {label}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

export function Toast({ message, show, tone = 'success', onDismiss }: { message: string; show: boolean; tone?: 'success' | 'warning' | 'error' | 'info'; onDismiss?: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`nexus-toast nexus-toast--${tone} ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs">✓</span>
      <span className="nexus-toast__message">{message}</span>
      {onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="nexus-toast__dismiss"><X className="h-4 w-4" /></button>}
    </div>
  );
}

export function MiniScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-bold text-navy-900">{score}</span>
    </div>
  );
}

export function StepProgress({ steps, activeIndex }: { steps: { label: string }[]; activeIndex: number }) {
  return (
    <div className="hidden items-center gap-3 border-t border-slate-100 px-6 py-2.5 md:flex">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center">
              <span
                className={`text-xs font-medium ${isActive ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-400'}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-px flex-1 ${isDone ? 'bg-blue-500' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>
    </Card>
  );
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4" role="presentation" onMouseDown={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-cardLg animate-scale-in"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirmation-title" className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
            <p id="confirmation-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={onConfirm}>{confirmLabel}</ActionButton>
        </div>
      </div>
    </div>
  );
}
