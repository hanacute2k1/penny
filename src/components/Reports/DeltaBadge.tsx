'use client';

import { formatVnd } from '@/lib/helper/format';
import { useI18n } from '@/contexts/I18nContext';

export function DeltaBadge({
  value,
  percent,
  invert = false,
}: {
  value: number | null;
  percent?: number | null;
  /** When true, increase is bad (e.g. expense up). */
  invert?: boolean;
}) {
  const { t, locale } = useI18n();

  if (value === null) {
    return <span className="text-xs text-ink-muted">—</span>;
  }

  if (value === 0) {
    return (
      <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
        {t.year.noChange}
      </span>
    );
  }

  const up = value > 0;
  const positiveTone = invert ? !up : up;
  const tone = positiveTone ? 'text-accent bg-accent-soft' : 'text-ink-soft bg-paper';
  const sign = up ? '+' : '';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      <span>
        {sign}
        {formatVnd(value, { compact: true, locale })}
      </span>
      {percent !== null && percent !== undefined ? (
        <span className="opacity-80">
          ({sign}
          {percent}%)
        </span>
      ) : null}
    </span>
  );
}
