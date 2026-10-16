import { useNexus } from './store';
import { MiniScoreRing } from './ui';
import { useLocale, formatLocalizedDate } from './locale';

export default function EmployeeHeader() {
  const { form, readinessScore, bundleGenerated } = useNexus();
  const { locale, t } = useLocale();
  const initials = (form.name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="employee-context border-b border-slate-200/70 bg-white">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="employee-context__avatar flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
            {initials || '?'}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{form.name || t('employee.unnamed')}</p>
            <p className="text-xs text-slate-500">
              {form.transitionType || '—'} · {form.newRole || 'Role TBD'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          {form.newMinistry && <HeaderItem label={t('employee.destination')} value={[form.newMinistry, form.newTeam].filter(Boolean).join(' / ')} />}
          {form.startDate && <HeaderItem label={t('employee.start')} value={formatLocalizedDate(form.startDate, locale)} />}
          {form.location && <HeaderItem label={t('employee.location')} value={form.location} />}
        </div>

        {bundleGenerated && (
          <div className="employee-context__score ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <MiniScoreRing score={readinessScore} size={36} />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t('header.readiness')}</p>
              <p className="text-sm font-bold text-slate-900">{readinessScore}/100</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
