'use client';

import { useMemo, useState } from 'react';
import { AddFab } from '@/components/Base/AddFab';
import { LoadingText } from '@/components/Base/LoadingText';
import { MoneySummary } from '@/components/Base/MoneySummary';
import { TransactionSheet } from '@/components/Transactions/TransactionSheet';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { useMonth } from '@/hooks/useMonth';
import { yearFromYearMonth } from '@/lib/helper/date';
import {
  monthPeriod,
  orderPeriod,
  summarizePeriod,
  yearPeriod,
  type Period,
} from '@/lib/helper/period';
import { CategoryBreakdown } from './CategoryBreakdown';
import { PeriodPicker, type PeriodKind } from './PeriodPicker';
import { TrendChart } from './TrendChart';

/**
 * Overview: income, spending and the gap for the period you pick (a month, a
 * year or any dates), then where the money went and how it moved over time.
 */
export function DashboardView() {
  const { yearMonth, shift } = useMonth();
  const { t, tx, money } = useI18n();
  const { ready, transactions, categories, addTransaction } = useStore();
  const [kind, setKind] = useState<PeriodKind>('month');
  const [custom, setCustom] = useState<Period>(() => monthPeriod(yearMonth));
  const [sheetOpen, setSheetOpen] = useState(false);

  const year = yearFromYearMonth(yearMonth);
  const period =
    kind === 'month'
      ? monthPeriod(yearMonth)
      : kind === 'year'
        ? yearPeriod(year)
        : orderPeriod(custom);
  const summary = useMemo(
    () => summarizePeriod(transactions, period),
    // `period` is rebuilt every render; its ends are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, period.from, period.to],
  );

  if (!ready) return <LoadingText />;

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight md:text-[1.75rem]">
        {t.nav.overview}
      </h1>

      <div className="mx-auto grid max-w-5xl gap-4 md:gap-5 lg:grid-cols-2">
        <div className="space-y-4 md:space-y-5">
          <div className="panel p-3 md:p-4">
            <PeriodPicker
              kind={kind}
              onKind={setKind}
              year={year}
              onYear={(delta) => shift(delta * 12)}
              custom={custom}
              onCustom={setCustom}
            />
          </div>
          <MoneySummary
            income={summary.income}
            expense={summary.expense}
            footer={
              summary.count
                ? `${tx(t.dashboard.count, { count: summary.count })} · ${tx(t.dashboard.perDay, {
                    amount: money(summary.expensePerDay, { compact: true }),
                  })}`
                : t.dashboard.empty
            }
          />
        </div>

        <TrendChart summary={summary} />

        <div className="lg:col-span-2">
          <CategoryBreakdown summary={summary} categories={categories} />
        </div>
      </div>

      <div className="md:hidden">
        <AddFab label={t.transactions.add} onClick={() => setSheetOpen(true)} />
      </div>
      <TransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        initial={null}
        onSave={(input) => addTransaction(input)}
      />
    </>
  );
}
