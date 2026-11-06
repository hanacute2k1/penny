'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { buildYearOverview } from '@/lib/helper/aggregations';
import { formatVnd } from '@/lib/helper/format';
import {
  currentYearMonth,
  labelYearMonth,
  shortMonthLabel,
  shiftYear,
  shiftYearMonth,
  yearFromYearMonth,
} from '@/lib/helper/date';
import { upcomingPlans } from '@/lib/helper/monthPlans';
import { Amount } from '@/components/Base/Amount';
import { DeltaBadge } from './DeltaBadge';

export function YearReviewView() {
  const { yearMonth, setMonth } = useMonth();
  const { ready, transactions, monthPlans } = useStore();
  const { t, tx, locale } = useI18n();
  const year = yearFromYearMonth(yearMonth);
  // Read once on mount; the page is rendered per request, so server and browser agree.
  const [nowMonth] = useState(currentYearMonth);

  const overview = useMemo(
    () => buildYearOverview(year, transactions, { upToMonth: nowMonth }),
    [year, transactions, nowMonth],
  );

  const upcoming = useMemo(
    () =>
      upcomingPlans(monthPlans, shiftYearMonth(nowMonth, 1)).filter((p) =>
        p.targetMonth.startsWith(String(year)),
      ),
    [monthPlans, nowMonth, year],
  );

  const maxExpense = Math.max(...overview.months.map((m) => m.expense), 1);

  if (!ready) {
    return <LoadingText />;
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label={t.year.previous}
          onClick={() => setMonth(shiftYear(yearMonth, -1))}
          className="tap grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-lg text-ink-soft"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="eyebrow">{t.year.title}</p>
          <p className="font-display text-2xl font-semibold md:text-3xl">{year}</p>
          {year === yearFromYearMonth(nowMonth) ? (
            <p className="mt-1 text-[11px] text-ink-muted">
              {tx(t.year.upToNow, {
                month: labelYearMonth(nowMonth, locale),
              })}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={t.year.next}
          onClick={() => setMonth(shiftYear(yearMonth, 1))}
          className="tap grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-lg text-ink-soft"
        >
          ›
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel p-5 md:p-6 lg:col-span-4">
          <p className="eyebrow mb-3">{t.year.yearTotals}</p>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-4">
            <div>
              <p className="text-[11px] text-income">{t.dashboard.income}</p>
              <Amount value={overview.totals.income} size="md" tone="income" compact />
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">{t.dashboard.expense}</p>
              <Amount value={overview.totals.expense} size="md" tone="ink" compact />
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">{t.year.balance}</p>
              <Amount
                value={overview.totals.balance}
                size="md"
                tone={overview.totals.balance >= 0 ? 'income' : 'ink'}
                compact
              />
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            {tx(t.year.activeMonths, { count: overview.activeMonths })} ·{' '}
            {tx(t.year.avgExpense, {
              amount: formatVnd(overview.averages.expense, { compact: true, locale }),
            })}
          </p>
        </section>

        <section className="panel p-5 md:p-6 lg:col-span-8">
          <h2 className="mb-4 section-title">{t.year.monthlySpend}</h2>
          <div className="flex h-36 items-end gap-1.5 md:h-44 md:gap-2">
            {overview.months.map((m) => {
              const isFuture = m.yearMonth > nowMonth;
              const height = m.hasActivity
                ? Math.max((m.expense / maxExpense) * 100, 8)
                : isFuture
                  ? 6
                  : 4;
              const active = m.yearMonth === yearMonth;
              const noteCount = monthPlans.filter(
                (p) => p.targetMonth === m.yearMonth && !p.isPosted,
              ).length;
              return (
                <button
                  key={m.yearMonth}
                  type="button"
                  title={`${shortMonthLabel(m.yearMonth, locale)}: ${
                    isFuture ? tx(t.year.notesCount, { count: noteCount }) : formatVnd(m.expense)
                  }`}
                  onClick={() => setMonth(m.yearMonth)}
                  className="tap flex h-full min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-md ${
                        active ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                      } ${m.hasActivity ? '' : 'bg-paper-2'}`}
                      style={{
                        height: `${height}%`,
                        background: m.hasActivity
                          ? `var(--chart-${((m.month - 1) % 6) + 1})`
                          : undefined,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-ink-muted md:text-xs">
                    {m.month}
                    {isFuture && noteCount > 0 ? '·' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {(overview.highestExpenseMonth || overview.bestBalanceMonth) && (
          <section className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-2">
            {overview.highestExpenseMonth ? (
              <div className="rounded-2xl bg-paper px-4 py-3.5">
                <p className="text-[11px] font-semibold text-ink-muted">{t.year.highestSpend}</p>
                <p className="mt-1 font-medium">
                  {shortMonthLabel(overview.highestExpenseMonth.yearMonth, locale)}
                </p>
                <Amount value={overview.highestExpenseMonth.expense} size="sm" tone="ink" compact />
              </div>
            ) : null}
            {overview.bestBalanceMonth ? (
              <div className="rounded-2xl bg-paper px-4 py-3.5">
                <p className="text-[11px] font-semibold text-ink-muted">{t.year.bestBalance}</p>
                <p className="mt-1 font-medium">
                  {shortMonthLabel(overview.bestBalanceMonth.yearMonth, locale)}
                </p>
                <Amount value={overview.bestBalanceMonth.balance} size="sm" tone="income" compact />
              </div>
            ) : null}
          </section>
        )}

        {upcoming.length > 0 ? (
          <section className="panel p-5 md:p-6 lg:col-span-12">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">{t.year.upcomingNotes}</h2>
              <Link
                href="/settings/plans"
                className="text-xs font-semibold text-accent hover:text-accent-deep"
              >
                {t.dashboard.managePlans}
              </Link>
            </div>
            <ul className="grid gap-2 md:grid-cols-2">
              {upcoming.map((plan) => (
                <li
                  key={plan.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-paper/80 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{plan.title}</p>
                    <p className="text-[11px] text-ink-muted">
                      {labelYearMonth(plan.targetMonth, locale)}
                      {plan.note ? ` · ${plan.note}` : ''}
                    </p>
                  </div>
                  <span
                    className={`num shrink-0 font-semibold ${
                      plan.type === 'expense' ? 'text-ink' : 'text-income'
                    }`}
                  >
                    {plan.type === 'expense' ? '-' : '+'}
                    {formatVnd(plan.amount, { compact: true, locale })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="lg:col-span-12">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="section-title">{t.year.monthList}</h2>
            <p className="text-[11px] text-ink-muted">{t.year.vsPrevious}</p>
          </div>

          {overview.activeMonths === 0 ? (
            <p className="panel py-10 text-center text-sm text-ink-muted">{t.year.empty}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[...overview.months].reverse().map((m) => {
                if (!m.hasActivity) return null;
                return (
                  <Link
                    key={m.yearMonth}
                    href={`/?month=${m.yearMonth}`}
                    className={`tap panel block px-4 py-3.5 hover:border-accent/30 ${
                      m.yearMonth === yearMonth ? 'ring-2 ring-accent/25' : ''
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-display font-semibold capitalize">
                        {shortMonthLabel(m.yearMonth, locale)} {year}
                      </span>
                      <Amount
                        value={m.balance}
                        size="sm"
                        tone={m.balance >= 0 ? 'income' : 'ink'}
                        compact
                      />
                    </div>
                    <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-ink-soft">
                      <span>
                        {t.dashboard.income}:{' '}
                        <span className="num font-semibold text-income">
                          {formatVnd(m.income, { compact: true, locale })}
                        </span>
                      </span>
                      <span className="text-right">
                        {t.dashboard.expense}:{' '}
                        <span className="num font-semibold text-ink">
                          {formatVnd(m.expense, { compact: true, locale })}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-ink-muted">
                        {t.year.expenseDelta}
                      </span>
                      <DeltaBadge
                        value={m.delta.expenseDelta}
                        percent={m.delta.expenseDeltaPercent}
                        invert
                      />
                      <span className="text-xs font-medium text-ink-muted">
                        {t.year.balanceDelta}
                      </span>
                      <DeltaBadge value={m.delta.balanceDelta} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
