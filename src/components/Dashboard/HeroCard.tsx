import Link from 'next/link';
import { Amount } from '@/components/Base/Amount';
import { Icon } from '@/components/Base/Icon';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { useI18n } from '@/contexts/I18nContext';
import type { MonthView } from '@/lib/type';

type Props = {
  view: MonthView;
  yearMonth: string;
  onAdd: (type: 'expense' | 'income') => void;
};

/** Month at a glance: what's left of the budget, income/expense and the two add buttons. */
export function HeroCard({ view, yearMonth, onAdd }: Props) {
  const { t, tx, money } = useI18n();
  const compact = (value: number) => money(value, { compact: true });

  const hasBudget = view.budgetTotal > 0;
  const overBy = hasBudget && view.budgetRemaining < 0 ? -view.budgetRemaining : 0;
  const status = !hasBudget
    ? null
    : overBy > 0
      ? { tone: 'over' as const, text: tx(t.dashboard.overBudget, { amount: compact(overBy) }) }
      : view.budgetPercent >= 85
        ? { tone: 'near' as const, text: t.dashboard.nearLimit }
        : null;

  /* Card tint: mint = comfortable, peach = close to limit, pink = over. */
  const tint = hasBudget
    ? `color-mix(in srgb, var(--chart-${
        overBy > 0 ? 2 : view.budgetPercent >= 85 ? 4 : 3
      }) var(--hero-mix), var(--surface))`
    : null;

  return (
    <section
      className="panel p-5 md:p-6 lg:col-span-2"
      style={tint ? { background: tint } : undefined}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
        <div>
          <p className="eyebrow">{t.dashboard.remainingBudget}</p>
          <div className="mt-1">
            <Amount
              value={hasBudget ? view.budgetRemaining : view.remainingCashflow}
              size="xl"
              tone={overBy > 0 ? 'coral' : 'ink'}
            />
          </div>
          {hasBudget ? (
            <>
              <div className="mt-4">
                <ProgressBar percent={view.budgetPercent} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-soft">
                  {tx(t.dashboard.budgetSpent, {
                    budget: compact(view.budgetTotal),
                    spent: compact(view.expense),
                  })}
                </span>
                <span className="num font-semibold text-ink-soft">{view.budgetPercent}%</span>
              </div>
            </>
          ) : null}
          {status ? (
            <p
              className={`mt-3 inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-medium ${
                status.tone === 'over' ? 'bg-coral-soft text-coral' : 'bg-paper text-ink'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${status.tone === 'over' ? 'bg-coral' : 'bg-ink-muted'}`}
              />
              {status.text}
            </p>
          ) : hasBudget ? null : (
            <Link
              href={`/budgets?month=${yearMonth}`}
              data-module="budgets"
              className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-2xl bg-paper px-3 py-1.5 text-sm font-medium text-ink-soft"
            >
              {t.dashboard.noBudget}
              <span className="whitespace-nowrap font-semibold text-ink">
                {t.dashboard.setBudget}
              </span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface/70 px-4 py-3">
            <p className="text-sm text-ink-soft">{t.dashboard.income}</p>
            <p className="num mt-1 text-lg font-semibold text-income">{compact(view.income)}</p>
          </div>
          <div className="rounded-2xl bg-surface/70 px-4 py-3">
            <p className="text-sm text-ink-soft">{t.dashboard.expense}</p>
            <p className="num mt-1 text-lg font-semibold">{compact(view.expense)}</p>
          </div>
          <button
            type="button"
            onClick={() => onAdd('expense')}
            className="btn-primary tap flex min-h-12 items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-center text-[0.9375rem] font-semibold leading-tight"
          >
            <Icon name="minus" size={18} />
            {t.dashboard.addExpense}
          </button>
          <button
            type="button"
            onClick={() => onAdd('income')}
            className="btn-secondary tap flex min-h-12 items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-center text-[0.9375rem] font-semibold leading-tight"
          >
            <Icon name="plus" size={18} />
            {t.dashboard.addIncome}
          </button>
        </div>
      </div>
    </section>
  );
}
