'use client';

import { formatAmountText } from '@/lib/helper/format';

import { useI18n } from '@/contexts/I18nContext';
import { categoryTint } from '@/lib/helper/categoryTone';
import type { Category, Transaction } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

export function TransactionRow({
  tx,
  category,
  onClick,
}: {
  tx: Transaction;
  category?: Category;
  onClick?: () => void;
}) {
  const { t, categoryName, currency, currencySymbol } = useI18n();
  const isExpense = tx.type === 'expense';
  const label = category ? categoryName(category) : undefined;
  const title = tx.note || label || t.transactions.fallbackName;

  return (
    <button
      type="button"
      onClick={onClick}
      className="tap flex min-h-16 w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-paper"
    >
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
        style={{ background: categoryTint(category) }}
      >
        <ItemIcon value={category?.icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{title}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-ink-muted">
          {label && label !== title ? <span>{label}</span> : null}
          {tx.recurringRuleId ? (
            <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-ink-soft">
              {t.fixed.postedBadge}
            </span>
          ) : null}
        </span>
      </span>
      <span className={`num shrink-0 font-semibold ${isExpense ? 'text-ink' : 'text-income'}`}>
        {isExpense ? '−' : '+'}
        {formatAmountText(tx.amount, currency)}
        {currencySymbol}
      </span>
    </button>
  );
}
