'use client';

import { useI18n } from '@/contexts/I18nContext';
import { categoryTint } from '@/lib/helper/categoryTone';
import type { Category } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { iconText } from '@/lib/helper/icons';

/** Compact category picker: shows just the emoji on a tinted tile. */
export function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  categories: Category[];
}) {
  const { t, categoryName } = useI18n();
  const current = categories.find((c) => c.id === value);

  return (
    <label
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
      style={{ background: categoryTint(current) }}
    >
      <ItemIcon value={current?.icon} size={20} />
      <select
        aria-label={t.transactions.category}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {iconText(c.icon)}
            {categoryName(c)}
          </option>
        ))}
      </select>
    </label>
  );
}

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
