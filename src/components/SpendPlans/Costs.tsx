'use client';

import { useMemo } from 'react';
import { AmountInput } from '@/components/Base/AmountInput';
import { Icon } from '@/components/Base/Icon';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { formatVnd } from '@/lib/helper/format';
import { itemDiff, summarizeSpendPlan } from '@/lib/helper/spendPlans';
import type { SpendPlan, SpendPlanItem } from '@/lib/type';
import { CategorySelect, DiffLabel } from './shared';

const EXTRA_CATEGORY = 'c-other';

/**
 * The money side of a trip. Each planned item has its estimate, the deposit paid
 * before leaving, and the real total entered afterwards; unplanned extras below.
 */
export function Costs({ plan }: { plan: SpendPlan }) {
  const { t, tx, locale } = useI18n();
  const { categories, setSpendPlanItems, settleSpendPlan, reopenSpendPlan } = useStore();

  const expenseCats = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense' && !c.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const summary = summarizeSpendPlan(plan);
  const planned = plan.items.filter((item) => !item.isExtra);
  const extras = plan.items.filter((item) => item.isExtra);
  const money = (value: number) => formatVnd(value, { locale });
  const compact = (value: number) => formatVnd(value, { compact: true, locale });

  const setItems = (items: SpendPlanItem[]) => setSpendPlanItems(plan.id, items);
  const patchItem = (id: string, patch: Partial<SpendPlanItem>) =>
    setItems(plan.items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const paidPercent =
    summary.expected > 0 ? Math.round((summary.deposit / summary.expected) * 100) : 0;

  const stats = [
    { label: t.spendPlans.estimate, value: summary.estimate },
    { label: t.spendPlans.deposit, value: summary.deposit },
    { label: t.spendPlans.remaining, value: summary.remaining },
    ...(plan.people > 1 ? [{ label: t.spendPlans.perPerson, value: summary.perPerson }] : []),
  ];

  const inputBox =
    'flex min-h-11 items-center rounded-xl border border-line bg-paper px-3 focus-within:border-ink';

  return (
    <div className="space-y-4">
      <section className="panel p-5 md:p-6">
        <p className="eyebrow">
          {summary.hasActuals ? t.spendPlans.actual : t.spendPlans.expected}
        </p>
        <p className="num mt-1 text-[min(2.25rem,10vw)] font-semibold leading-tight">
          {money(summary.expected)}
        </p>
        {summary.hasActuals ? (
          <div className="mt-2">
            <DiffLabel diff={summary.diff} size="md" />
          </div>
        ) : null}

        <div className="mt-4">
          <ProgressBar percent={paidPercent} />
          <p className="mt-1.5 text-sm text-ink-muted">
            {t.spendPlans.deposit} {compact(summary.deposit)} · {t.spendPlans.remaining}{' '}
            {compact(summary.remaining)}
          </p>
        </div>

        <dl
          className={`mt-4 grid gap-2 ${stats.length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-2xl bg-paper px-3 py-2.5">
              <dt className="truncate text-sm text-ink-soft">{stat.label}</dt>
              <dd className="num mt-0.5 truncate font-semibold">{compact(stat.value)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-muted">{t.spendPlans.costsHint}</p>
      </section>

      <section className="panel p-3 md:p-4">
        <div className="flex items-center justify-between px-2 pb-1 pt-1">
          <h2 className="section-title">{t.spendPlans.items}</h2>
          <span className="text-sm text-ink-muted">
            {tx(t.spendPlans.checked, { checked: summary.checked, planned: summary.planned })}
          </span>
        </div>
        <ul className="divide-y divide-line">
          {planned.map((item) => {
            const diff = itemDiff(item);
            return (
              <li key={item.id} className="px-2 py-3">
                <div className="flex items-center gap-3">
                  <CategorySelect
                    value={item.categoryId}
                    categories={expenseCats}
                    onChange={(categoryId) => patchItem(item.id, { categoryId })}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="num text-sm text-ink-muted">
                      {tx(t.spendPlans.estimateShort, { amount: compact(item.estimate) })}
                    </p>
                  </div>
                  {diff !== null && diff !== 0 ? <DiffLabel diff={diff} /> : null}
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:pl-14">
                  <label className="min-w-0">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t.spendPlans.deposit}
                    </span>
                    <span className={inputBox}>
                      <AmountInput
                        value={item.deposit || null}
                        onChange={(deposit) => patchItem(item.id, { deposit: deposit ?? 0 })}
                        ariaLabel={`${t.spendPlans.deposit} ${item.name}`}
                        placeholder="0"
                        className="w-full"
                      />
                    </span>
                  </label>
                  <label className="min-w-0">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t.spendPlans.totalAfter}
                    </span>
                    <span className={inputBox}>
                      <AmountInput
                        value={item.actual}
                        onChange={(actual) => patchItem(item.id, { actual })}
                        ariaLabel={`${t.spendPlans.totalAfter} ${item.name}`}
                        placeholder={t.spendPlans.notFilled}
                        className="w-full"
                      />
                    </span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel p-3 md:p-4">
        <div className="px-2 pb-2 pt-1">
          <h2 className="section-title">{t.spendPlans.extras}</h2>
          <p className="text-sm text-ink-muted">{t.spendPlans.extrasHint}</p>
        </div>
        {extras.length ? (
          <ul className="divide-y divide-line">
            {extras.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-2 py-3">
                <CategorySelect
                  value={item.categoryId}
                  categories={expenseCats}
                  onChange={(categoryId) => patchItem(item.id, { categoryId })}
                />
                <input
                  value={item.name}
                  onChange={(e) => patchItem(item.id, { name: e.target.value })}
                  placeholder={t.spendPlans.extraPlaceholder}
                  aria-label={t.spendPlans.extraPlaceholder}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 outline-none placeholder:text-ink-muted focus:border-ink"
                />
                <div className={`${inputBox} w-28 shrink-0`}>
                  <AmountInput
                    value={item.actual}
                    onChange={(actual) => patchItem(item.id, { actual })}
                    ariaLabel={`${t.spendPlans.actual} ${item.name}`}
                    className="w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setItems(plan.items.filter((i) => i.id !== item.id))}
                  aria-label={t.spendPlans.removeItem}
                  title={t.spendPlans.removeItem}
                  className="tap grid h-11 w-9 shrink-0 place-items-center rounded-xl text-ink-muted hover:text-coral"
                >
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={() =>
            setItems([
              ...plan.items,
              {
                id: `spi-${crypto.randomUUID()}`,
                name: '',
                categoryId: expenseCats.some((c) => c.id === EXTRA_CATEGORY)
                  ? EXTRA_CATEGORY
                  : (expenseCats[0]?.id ?? EXTRA_CATEGORY),
                estimate: 0,
                deposit: 0,
                actual: null,
                isExtra: true,
              },
            ])
          }
          className="tap mx-2 mb-1 mt-2 flex min-h-11 w-[calc(100%-1rem)] items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
        >
          <Icon name="plus" size={18} />
          {t.spendPlans.addExtra}
        </button>
      </section>

      <section className="space-y-2 pt-2">
        {plan.status === 'done' ? (
          <>
            <p className="flex items-center justify-center gap-2 text-[0.9375rem] font-medium text-income">
              <Icon name="plan" size={18} />
              {tx(t.spendPlans.settled, { count: plan.postedCount })}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => settleSpendPlan(plan.id)}
                className="btn-primary tap min-h-12 rounded-2xl px-3 font-semibold"
              >
                {t.spendPlans.resettle}
              </button>
              <button
                type="button"
                onClick={() => reopenSpendPlan(plan.id)}
                className="btn-secondary tap min-h-12 rounded-2xl px-3 font-semibold"
              >
                {t.spendPlans.reopen}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!summary.hasActuals}
              onClick={() => settleSpendPlan(plan.id)}
              className="btn-primary tap min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.spendPlans.settle}
            </button>
            <p className="px-2 text-center text-sm text-ink-muted">{t.spendPlans.settleHint}</p>
          </>
        )}
      </section>
    </div>
  );
}
