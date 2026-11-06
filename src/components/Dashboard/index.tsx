'use client';

import { useMemo, useState } from 'react';
import { LoadingText } from '@/components/Base/LoadingText';
import { TransactionSheet } from '@/components/Transactions/TransactionSheet';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { useMonth } from '@/hooks/useMonth';
import { currentYearMonth, shiftYearMonth, todayIso } from '@/lib/helper/date';
import { plansForMonth, upcomingPlans } from '@/lib/helper/monthPlans';
import { ruleAppliesToMonth, sumFixedForMonth } from '@/lib/helper/recurring';
import { openSpendPlans } from '@/lib/helper/spendPlans';
import type { Transaction } from '@/lib/type';
import { HeroCard } from './HeroCard';
import {
  CategoriesCard,
  FixedCostsCard,
  MonthPlansCard,
  RecentCard,
  SpendPlansCard,
} from './Sections';

/** Overview: the month's status card, then recent activity and the smaller cards. */
export function DashboardView() {
  const { yearMonth } = useMonth();
  const { t } = useI18n();
  const {
    ready,
    categories,
    recurringRules,
    monthPlans,
    spendPlans,
    getMonthView,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useStore();
  const view = useMemo(() => getMonthView(yearMonth), [getMonthView, yearMonth]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [sheetType, setSheetType] = useState<'expense' | 'income'>('expense');
  // Read once on mount; the page is rendered per request, so server and browser agree.
  const [nowMonth] = useState(currentYearMonth);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const isFutureMonth = yearMonth > nowMonth;

  const fixedRules = useMemo(
    () => recurringRules.filter((r) => r.type === 'expense' && ruleAppliesToMonth(r, yearMonth)),
    [recurringRules, yearMonth],
  );
  const monthNotes = useMemo(() => plansForMonth(monthPlans, yearMonth), [monthPlans, yearMonth]);
  const upcoming = useMemo(
    () => upcomingPlans(monthPlans, shiftYearMonth(nowMonth, 1)).slice(0, 4),
    [monthPlans, nowMonth],
  );

  if (!ready) return <LoadingText />;

  const today = todayIso();
  const activePlans = openSpendPlans(spendPlans, today).slice(0, 3);
  const planItems = isFutureMonth ? monthNotes : upcoming;
  const topCategories = view.categories.filter((c) => c.limit > 0 || c.spent > 0).slice(0, 4);

  const openNew = (type: 'expense' | 'income') => {
    setEditing(null);
    setSheetType(type);
    setSheetOpen(true);
  };

  return (
    <>
      <h1 className="sr-only">{t.nav.overview}</h1>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <HeroCard view={view} yearMonth={yearMonth} onAdd={openNew} />

        <RecentCard
          yearMonth={yearMonth}
          transactions={view.recentTransactions.slice(0, 6)}
          catMap={catMap}
          onOpen={(tx) => {
            setEditing(tx);
            setSheetOpen(true);
          }}
        />

        <div className="flex flex-col gap-4 md:gap-5">
          {activePlans.length > 0 ? <SpendPlansCard plans={activePlans} today={today} /> : null}
          <CategoriesCard yearMonth={yearMonth} items={topCategories} catMap={catMap} />
          {!isFutureMonth ? (
            <FixedCostsCard
              rules={fixedRules}
              total={sumFixedForMonth(recurringRules, yearMonth, 'expense')}
              catMap={catMap}
            />
          ) : null}
          {planItems.length > 0 ? (
            <MonthPlansCard plans={planItems} isFutureMonth={isFutureMonth} catMap={catMap} />
          ) : null}
        </div>
      </div>

      <TransactionSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        categories={categories}
        initial={editing}
        defaultType={sheetType}
        onSave={(input) => {
          if (editing) updateTransaction(editing.id, input);
          else addTransaction(input);
        }}
        onDelete={editing ? () => deleteTransaction(editing.id) : undefined}
      />
    </>
  );
}
