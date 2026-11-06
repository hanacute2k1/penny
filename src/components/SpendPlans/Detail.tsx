'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatVnd } from '@/lib/helper/format';
import { todayIso } from '@/lib/helper/date';
import {
  formatPlanDates,
  itemDiff,
  spendPlanPhase,
  summarizeSpendPlan,
} from '@/lib/helper/spendPlans';
import { AmountInput } from '@/components/Base/AmountInput';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { Icon } from '@/components/Base/Icon';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { CategorySelect } from './shared';
import { DiffLabel } from './shared';
import { SpendPlanSheet } from './SpendPlanSheet';
import type { SpendPlanItem } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

const EXTRA_CATEGORY = 'c-other';

export function SpendPlanDetailView() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { t, tx, locale } = useI18n();
  const {
    ready,
    spendPlans,
    categories,
    updateSpendPlan,
    setSpendPlanItems,
    settleSpendPlan,
    reopenSpendPlan,
    deleteSpendPlan,
  } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const plan = spendPlans.find((p) => p.id === planId);
  const expenseCats = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense' && !c.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (!ready) {
    return <LoadingText />;
  }

  if (!plan) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">{t.spendPlans.notFound}</p>
        <Link href="/plan" className="link-action mt-3">
          {t.spendPlans.back}
        </Link>
      </div>
    );
  }

  const summary = summarizeSpendPlan(plan);
  const phase = spendPlanPhase(plan, todayIso());
  const planned = plan.items.filter((item) => !item.isExtra);
  const extras = plan.items.filter((item) => item.isExtra);
  const money = (value: number) => formatVnd(value, { locale });

  const setItems = (items: SpendPlanItem[]) => setSpendPlanItems(plan.id, items);
  const patchItem = (id: string, patch: Partial<SpendPlanItem>) =>
    setItems(plan.items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  /* Card tint: mint when under plan, pink when over — only once real numbers exist. */
  const tint = summary.hasActuals
    ? `color-mix(in srgb, var(--chart-${summary.diff >= 0 ? 3 : 2}) var(--hero-mix), var(--surface))`
    : undefined;
  const usedPercent =
    summary.estimate > 0 ? Math.round((summary.actual / summary.estimate) * 100) : 0;

  return (
    <>
      <Link href="/plan" className="mb-3 inline-block text-sm font-semibold text-ink-soft">
        {t.spendPlans.back}
      </Link>

      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface text-3xl shadow-[var(--shadow)]"
          >
            <ItemIcon value={plan.icon} size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
            <p className="text-[0.9375rem] text-ink-soft">{formatPlanDates(plan, locale)}</p>
            {plan.note ? <p className="mt-0.5 text-sm text-ink-muted">{plan.note}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label={t.spendPlans.edit}
            title={t.spendPlans.edit}
            className="tap grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft hover:text-ink"
          >
            <Icon name="edit" size={20} />
          </button>
        </header>

        <section className="panel p-5 md:p-6" style={tint ? { background: tint } : undefined}>
          {summary.hasActuals ? (
            <>
              <p className="eyebrow">{t.spendPlans.diff}</p>
              <p
                className={`num mt-1 text-[min(2.25rem,10vw)] font-semibold leading-tight ${
                  summary.diff < 0 ? 'text-coral' : summary.diff > 0 ? 'text-income' : ''
                }`}
              >
                {summary.diff > 0 ? '+' : summary.diff < 0 ? '−' : ''}
                {money(Math.abs(summary.diff))}
              </p>
              <div className="mt-2">
                <DiffLabel diff={summary.diff} size="md" />
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">{t.spendPlans.estimate}</p>
              <p className="num mt-1 text-[min(2.25rem,10vw)] font-semibold leading-tight">
                {money(summary.estimate)}
              </p>
            </>
          )}

          <div className="mt-4">
            <ProgressBar percent={usedPercent} />
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: t.spendPlans.estimate, value: summary.estimate },
              { label: t.spendPlans.actual, value: summary.actual },
              { label: t.spendPlans.extras, value: summary.extras },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0 rounded-2xl bg-surface/70 px-3 py-2.5">
                <dt className="truncate text-sm text-ink-soft">{stat.label}</dt>
                <dd className="num mt-0.5 truncate font-semibold">
                  {formatVnd(stat.value, { compact: true, locale })}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-muted">
            {tx(t.spendPlans.checked, { checked: summary.checked, planned: summary.planned })}
          </p>
        </section>

        {phase === 'review' && !summary.hasActuals ? (
          <p className="rounded-2xl bg-chart-4/40 px-4 py-3 text-[0.9375rem] font-medium">
            {t.spendPlans.reviewHint}
          </p>
        ) : null}

        <section className="panel p-3 md:p-4">
          <div className="flex items-center justify-between px-2 pb-1 pt-1">
            <h2 className="section-title">{t.spendPlans.items}</h2>
            <span className="text-sm text-ink-muted">{t.spendPlans.actual}</span>
          </div>
          <ul className="divide-y divide-line">
            {planned.map((item) => {
              const diff = itemDiff(item);
              return (
                <li key={item.id} className="flex items-center gap-3 px-2 py-3">
                  <CategorySelect
                    value={item.categoryId}
                    categories={expenseCats}
                    onChange={(categoryId) => patchItem(item.id, { categoryId })}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="num text-sm text-ink-muted">
                      {t.spendPlans.estimate} {formatVnd(item.estimate, { compact: true, locale })}
                    </p>
                    {diff !== null && diff !== 0 ? (
                      <div className="mt-1">
                        <DiffLabel diff={diff} />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex min-h-11 w-32 shrink-0 items-center rounded-xl border border-line bg-paper px-3 focus-within:border-ink">
                    <AmountInput
                      value={item.actual}
                      onChange={(actual) => patchItem(item.id, { actual })}
                      ariaLabel={`${t.spendPlans.actual} ${item.name}`}
                      placeholder={t.spendPlans.notFilled}
                      className="w-full"
                    />
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
                  <div className="flex min-h-11 w-28 shrink-0 items-center rounded-xl border border-line bg-paper px-3 focus-within:border-ink">
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
                  categoryId: catMap.has(EXTRA_CATEGORY)
                    ? EXTRA_CATEGORY
                    : (expenseCats[0]?.id ?? EXTRA_CATEGORY),
                  estimate: 0,
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
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="tap mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            <Icon name="trash" size={18} />
            {t.spendPlans.delete}
          </button>
        </section>
      </div>

      <SpendPlanSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={plan}
        categories={categories}
        onSave={(input) => updateSpendPlan(plan.id, input)}
      />

      <ConfirmDialog
        open={confirmDelete}
        message={t.spendPlans.deleteConfirm}
        confirmLabel={t.common.delete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteSpendPlan(plan.id);
          router.push('/plan');
        }}
      />
    </>
  );
}
