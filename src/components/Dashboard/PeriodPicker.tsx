'use client';

import { Segmented } from '@/components/Base/Segmented';
import { Icon } from '@/components/Base/Icon';
import { useI18n } from '@/contexts/I18nContext';
import type { Period } from '@/lib/helper/period';

export type PeriodKind = 'month' | 'year' | 'custom';

/**
 * Month (follows the month at the top of the screen), a whole year, or any two
 * dates.
 */
export function PeriodPicker({
  kind,
  onKind,
  year,
  onYear,
  custom,
  onCustom,
}: {
  kind: PeriodKind;
  onKind: (kind: PeriodKind) => void;
  year: number;
  onYear: (delta: number) => void;
  custom: Period;
  onCustom: (period: Period) => void;
}) {
  const { t } = useI18n();
  const dateInput =
    'min-h-11 w-full min-w-0 rounded-xl border border-line bg-paper px-3 text-[0.9375rem] outline-none focus:border-ink';

  return (
    <div className="space-y-3">
      <Segmented
        value={kind}
        onChange={onKind}
        ariaLabel={t.dashboard.periodLabel}
        options={[
          { value: 'month', label: t.dashboard.periodMonth },
          { value: 'year', label: t.dashboard.periodYear },
          { value: 'custom', label: t.dashboard.periodCustom },
        ]}
      />
      {kind === 'year' ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onYear(-1)}
            aria-label={t.dashboard.previousYear}
            title={t.dashboard.previousYear}
            className="tap grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <p aria-live="polite" className="num min-w-16 text-center text-lg font-semibold">
            {year}
          </p>
          <button
            type="button"
            onClick={() => onYear(1)}
            aria-label={t.dashboard.nextYear}
            title={t.dashboard.nextYear}
            className="tap grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
      ) : kind === 'custom' ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="min-w-0">
            <span className="field-label mb-1 block">{t.dashboard.from}</span>
            <input
              type="date"
              value={custom.from}
              onChange={(e) => e.target.value && onCustom({ ...custom, from: e.target.value })}
              className={dateInput}
            />
          </label>
          <label className="min-w-0">
            <span className="field-label mb-1 block">{t.dashboard.to}</span>
            <input
              type="date"
              value={custom.to}
              onChange={(e) => e.target.value && onCustom({ ...custom, to: e.target.value })}
              className={dateInput}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
