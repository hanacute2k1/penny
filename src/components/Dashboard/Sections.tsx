import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/Base/Icon';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { DiffLabel } from '@/components/SpendPlans/shared';
import { TransactionRow } from '@/components/Transactions/TransactionRow';
import { useI18n } from '@/contexts/I18nContext';
import { categoryTone } from '@/lib/helper/categoryTone';
import { labelYearMonth } from '@/lib/helper/date';
import {
  countdownLabel,
  daysUntilPlan,
  spendPlanPhase,
  summarizeSpendPlan,
} from '@/lib/helper/spendPlans';
import type {
  Category,
  CategoryProgress,
  MonthPlan,
  RecurringRule,
  SpendPlan,
  Transaction,
} from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

type CatMap = Map<string, Category>;

/** Card title with an "All ›" style link on the right. */
function CardHeader({
  title,
  href,
  linkLabel,
  module,
  className = 'mb-2',
}: {
  title: ReactNode;
  href: string;
  linkLabel: ReactNode;
  /** Hides the link together with that optional section (Settings → sections). */
  module?: string;
  className?: string;
}) {
  return (
    <div className={`${className} flex items-center justify-between gap-2`}>
      <h2 className="section-title">{title}</h2>
      <Link href={href} data-module={module} className="link-action">
        {linkLabel}
        <Icon name="chevronRight" size={16} />
      </Link>
    </div>
  );
}

export function RecentCard({
  yearMonth,
  transactions,
  catMap,
  onOpen,
}: {
  yearMonth: string;
  transactions: Transaction[];
  catMap: CatMap;
  onOpen: (tx: Transaction) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="panel p-5 md:p-6">
      <CardHeader
        title={t.dashboard.recent}
        href={`/transactions?month=${yearMonth}`}
        linkLabel={t.common.all}
      />
      {transactions.length === 0 ? (
        <p className="py-8 text-center text-[0.9375rem] text-ink-muted">
          {t.dashboard.noTransactions}
        </p>
      ) : (
        <div className="-mx-2 space-y-0.5">
          {transactions.map((item) => (
            <TransactionRow
              key={item.id}
              tx={item}
              category={catMap.get(item.categoryId)}
              onClick={() => onOpen(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function SpendPlansCard({ plans, today }: { plans: SpendPlan[]; today: string }) {
  const { t, tx, money } = useI18n();
  return (
    <section data-module="plan" className="panel p-5 md:p-6">
      <CardHeader
        className="mb-1"
        title={t.spendPlans.title}
        href="/plan"
        linkLabel={t.common.all}
      />
      <ul className="-mx-2 divide-y divide-line">
        {plans.map((plan) => {
          const summary = summarizeSpendPlan(plan);
          const needsReview = spendPlanPhase(plan, today) === 'review';
          return (
            <li key={plan.id}>
              <Link
                href={`/plan/${plan.id}`}
                className="tap flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-paper"
              >
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-xl"
                >
                  <ItemIcon value={plan.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{plan.title}</span>
                  <span className="block text-sm text-ink-muted">
                    {needsReview ? t.spendPlans.review : countdownLabel(daysUntilPlan(plan), t, tx)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="num font-semibold">
                    {money(summary.hasActuals ? summary.actual : summary.estimate, {
                      compact: true,
                    })}
                  </span>
                  {summary.hasActuals ? (
                    <DiffLabel diff={summary.diff} />
                  ) : (
                    <span className="text-xs text-ink-muted">{t.spendPlans.estimate}</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CategoriesCard({
  yearMonth,
  items,
  catMap,
}: {
  yearMonth: string;
  items: CategoryProgress[];
  catMap: CatMap;
}) {
  const { t, categoryName, money } = useI18n();
  return (
    <section className="panel p-5 md:p-6">
      <CardHeader
        className="mb-4"
        title={t.dashboard.byCategory}
        href={`/budgets?month=${yearMonth}`}
        linkLabel={t.nav.budget}
        module="budgets"
      />
      {items.length === 0 ? (
        <p className="py-4 text-center text-[0.9375rem] text-ink-muted">
          {t.dashboard.noTransactions}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((c) => {
            const cat = catMap.get(c.categoryId);
            const over = c.limit > 0 && c.spent > c.limit;
            return (
              <Link
                key={c.categoryId}
                href={`/transactions?month=${yearMonth}&category=${c.categoryId}`}
                className="tap -mx-2 block rounded-xl px-2 py-1 hover:bg-paper"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <ItemIcon value={c.icon} size={18} className="text-ink-soft" />
                    <span className="truncate">{cat ? categoryName(cat) : c.name}</span>
                  </span>
                  <span className="num shrink-0 text-sm text-ink-soft">
                    <span className={`font-semibold ${over ? 'text-coral' : 'text-ink'}`}>
                      {money(c.spent, { compact: true })}
                    </span>
                    {c.limit > 0 ? ` / ${money(c.limit, { compact: true })}` : null}
                  </span>
                </div>
                <ProgressBar percent={c.percent} color={categoryTone(cat)} />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function FixedCostsCard({
  rules,
  total,
  catMap,
}: {
  rules: RecurringRule[];
  total: number;
  catMap: CatMap;
}) {
  const { t, money } = useI18n();
  return (
    <section className="panel p-5 md:p-6">
      <CardHeader
        title={t.dashboard.fixedThisMonth}
        href="/settings/fixed"
        linkLabel={t.dashboard.manageFixed.replace(' ›', '')}
      />
      {rules.length === 0 ? (
        <p className="text-[0.9375rem] text-ink-muted">{t.fixed.empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rules.slice(0, 3).map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3 py-3">
              <span className="flex min-w-0 items-center gap-2">
                <ItemIcon
                  value={catMap.get(rule.categoryId)?.icon}
                  fallback="pin"
                  size={18}
                  className="text-ink-soft"
                />
                <span className="truncate">{rule.name}</span>
              </span>
              <span className="num shrink-0 font-medium">
                {money(rule.amount, { compact: true })}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 pt-3 font-semibold">
            <span>{t.fixed.totalMonthly}</span>
            <span className="num">{money(total, { compact: true })}</span>
          </li>
        </ul>
      )}
    </section>
  );
}

/** Planned one-off costs: this month's when looking ahead, otherwise the next few coming up. */
export function MonthPlansCard({
  plans,
  isFutureMonth,
  catMap,
}: {
  plans: MonthPlan[];
  isFutureMonth: boolean;
  catMap: CatMap;
}) {
  const { t, locale, money } = useI18n();
  return (
    <section className="panel p-5 md:p-6">
      <CardHeader
        title={isFutureMonth ? t.plans.forMonth : t.dashboard.upcomingNotes}
        href="/settings/plans"
        linkLabel={t.dashboard.managePlans.replace(' ›', '')}
      />
      <ul className="divide-y divide-line">
        {plans.map((plan) => (
          <li key={plan.id} className="flex items-center justify-between gap-3 py-3">
            <span className="flex min-w-0 items-center gap-2">
              <ItemIcon
                value={catMap.get(plan.categoryId)?.icon}
                fallback="note"
                size={18}
                className="text-ink-soft"
              />
              <span className="min-w-0">
                <span className="block truncate">{plan.title}</span>
                {!isFutureMonth ? (
                  <span className="block text-sm capitalize text-ink-muted">
                    {labelYearMonth(plan.targetMonth, locale)}
                  </span>
                ) : null}
              </span>
            </span>
            <span
              className={`num shrink-0 font-medium ${plan.type === 'income' ? 'text-income' : ''}`}
            >
              {plan.type === 'expense' ? '−' : '+'}
              {money(plan.amount, { compact: true })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
