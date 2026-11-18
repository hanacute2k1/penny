'use client';

import { useI18n } from '@/contexts/I18nContext';

/** "Dư 50k" in green, "Thâm hụt 60k" in red, or "Đúng dự tính". */
export function DiffLabel({
  diff,
  size = 'sm',
}: {
  /** estimate − actual */
  diff: number;
  size?: 'sm' | 'md';
}) {
  const { t, tx, money } = useI18n();
  const amount = money(Math.abs(diff), { compact: true });
  const text =
    diff > 0
      ? tx(t.spendPlans.left, { amount })
      : diff < 0
        ? tx(t.spendPlans.over, { amount })
        : t.spendPlans.onTarget;
  const tone =
    diff > 0
      ? 'bg-chart-3/45 text-income'
      : diff < 0
        ? 'bg-coral-soft text-coral'
        : 'bg-paper text-ink-soft';

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold ${tone} ${
        size === 'md' ? 'text-sm' : 'text-xs'
      }`}
    >
      {text}
    </span>
  );
}
