'use client';

import { useI18n } from '@/contexts/I18nContext';

/** Income, spending and what's left over (or the deficit) for a stretch of time. */
export function MoneySummary({
  income,
  expense,
  title,
  footer,
}: {
  income: number;
  expense: number;
  title?: string;
  footer?: string;
}) {
  const { t, tx, money } = useI18n();
  const net = income - expense;
  const netText =
    net > 0
      ? tx(t.dashboard.surplus, { amount: money(net) })
      : net < 0
        ? tx(t.dashboard.deficit, { amount: money(-net) })
        : t.dashboard.even;

  return (
    <section className="panel p-5 md:p-6">
      {title ? <p className="eyebrow">{title}</p> : null}
      <p
        className={`num text-[min(2rem,9vw)] font-semibold leading-tight ${
          net < 0 ? 'text-coral' : net > 0 ? 'text-income' : ''
        } ${title ? 'mt-1' : ''}`}
      >
        {netText}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-2xl bg-paper px-3 py-2.5">
          <dt className="truncate text-sm text-ink-soft">{t.dashboard.income}</dt>
          <dd className="num mt-0.5 truncate font-semibold text-income">
            {income > 0 ? '+' : ''}
            {money(income)}
          </dd>
        </div>
        <div className="min-w-0 rounded-2xl bg-paper px-3 py-2.5">
          <dt className="truncate text-sm text-ink-soft">{t.dashboard.expense}</dt>
          <dd className="num mt-0.5 truncate font-semibold">
            {expense > 0 ? '−' : ''}
            {money(expense)}
          </dd>
        </div>
      </dl>
      {footer ? <p className="mt-3 text-sm text-ink-muted">{footer}</p> : null}
    </section>
  );
}
