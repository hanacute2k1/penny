'use client';

import { useI18n } from '@/contexts/I18nContext';
import { formatDayLabel, shortMonthLabel } from '@/lib/helper/date';
import type { PeriodSummary } from '@/lib/helper/period';

/** Spending as bars: one per day for short periods, one per month for long ones. */
export function TrendChart({ summary }: { summary: PeriodSummary }) {
  const { t, tx, locale, money } = useI18n();
  const { series, unit } = summary;
  const max = Math.max(1, ...series.map((p) => p.expense));
  const label = (key: string) =>
    unit === 'day' ? formatDayLabel(key, locale) : shortMonthLabel(key, locale);
  const tick = (key: string) => (unit === 'day' ? String(Number(key.slice(8))) : label(key));
  const ticks =
    series.length > 2
      ? [series[0], series[Math.floor(series.length / 2)], series[series.length - 1]]
      : series;

  return (
    <section className="panel p-5 md:p-6">
      <h2 className="section-title mb-3">
        {unit === 'day' ? t.dashboard.trendDay : t.dashboard.trendMonth}
      </h2>
      <div className="flex h-36 items-end gap-[3px] md:h-44">
        {series.map((point) => (
          <div
            key={point.key}
            className="flex-1 rounded-t-sm bg-chart-1"
            style={{
              height: `${Math.max((point.expense / max) * 100, point.expense > 0 ? 6 : 2)}%`,
              opacity: point.expense > 0 ? 1 : 0.25,
            }}
            title={tx(t.dashboard.point, { label: label(point.key), amount: money(point.expense) })}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-muted">
        {ticks.map((point) => (
          <span key={point.key}>{tick(point.key)}</span>
        ))}
      </div>
    </section>
  );
}
