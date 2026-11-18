'use client';

import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '@/components/Base/Icon';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { Segmented } from '@/components/Base/Segmented';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { todayIso } from '@/lib/helper/date';
import {
  formatDayHeader,
  groupCostItems,
  itemDiff,
  planDays,
  summarizeSpendPlan,
} from '@/lib/helper/spendPlans';
import type { SpendPlan, SpendPlanItem } from '@/lib/type';
import { CostSheet } from './CostSheet';
import { DiffLabel } from './shared';

export type CostStage = 'before' | 'after';

/**
 * The money side of a trip, in two steps:
 * - before: each cost typed in (what, where, when, how much) and the deposit paid;
 * - after: what each cost really was, unplanned extras, and the gap against the
 *   plan (deficit or money left), then posting it all to Transactions.
 * Costs are listed in the order they are paid, by day and time.
 */
export function Costs({
  plan,
  canSettle = true,
  initialStage = 'before',
}: {
  plan: SpendPlan;
  /** Closing out posts costs into the owner's transactions, so friends can't. */
  canSettle?: boolean;
  initialStage?: CostStage;
}) {
  const [stage, setStage] = useState<CostStage>(initialStage);
  /** Open cost form: the cost being edited, or null for a new one. */
  const [form, setForm] = useState<{ item: SpendPlanItem | null } | null>(null);
  const { t, tx, money, locale } = useI18n();
  const {
    addSpendPlanItem,
    updateSpendPlanItem,
    removeSpendPlanItem,
    settleSpendPlan,
    reopenSpendPlan,
  } = useStore();

  const summary = summarizeSpendPlan(plan);
  const compact = (value: number) => money(value, { compact: true });
  const editing = form?.item ?? null;

  // New costs start on today while the trip is on, else on its first day.
  const today = todayIso();
  const newCostDate = planDays(plan).includes(today) ? today : plan.startDate;

  const paidPercent =
    summary.expected > 0 ? Math.round((summary.deposit / summary.expected) * 100) : 0;

  const statBox = (stat: { label: string; value: number }) => (
    <div key={stat.label} className="min-w-0 rounded-2xl bg-paper px-3 py-2.5">
      <dt className="truncate text-sm text-ink-soft">{stat.label}</dt>
      <dd className="num mt-0.5 truncate font-semibold">{compact(stat.value)}</dd>
    </div>
  );

  return (
    <div className="space-y-4">
      <Segmented
        value={stage}
        onChange={setStage}
        ariaLabel={t.spendPlans.tabCosts}
        options={[
          { value: 'before', label: t.spendPlans.costsBefore },
          { value: 'after', label: t.spendPlans.costsAfter },
        ]}
      />

      {stage === 'before' ? (
        <section className="panel p-5 md:p-6">
          <p className="eyebrow">{t.spendPlans.planned}</p>
          <p className="num mt-1 text-[min(2.25rem,10vw)] font-semibold leading-tight">
            {money(summary.estimate)}
          </p>
          <div className="mt-4">
            <ProgressBar percent={paidPercent} />
          </div>
          <dl className={`mt-4 grid gap-2 ${plan.people > 1 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[
              { label: t.spendPlans.deposit, value: summary.deposit },
              {
                label: t.spendPlans.remaining,
                value: Math.max(0, summary.estimate - summary.deposit),
              },
              ...(plan.people > 1
                ? [
                    {
                      label: t.spendPlans.perPerson,
                      value: Math.round(summary.estimate / plan.people),
                    },
                  ]
                : []),
            ].map(statBox)}
          </dl>
          <p className="mt-3 text-sm text-ink-muted">{t.spendPlans.beforeHint}</p>
        </section>
      ) : (
        <section className="panel p-5 md:p-6">
          <p className="eyebrow">{t.spendPlans.gap}</p>
          {summary.hasActuals ? (
            <div className="mt-1.5">
              <DiffLabel diff={summary.diff} size="md" />
            </div>
          ) : (
            <p className="mt-1 text-[0.9375rem] text-ink-soft">{t.spendPlans.afterEmpty}</p>
          )}
          <dl className={`mt-4 grid gap-2 ${plan.people > 1 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[
              { label: t.spendPlans.planned, value: summary.estimate },
              { label: t.spendPlans.spentReal, value: summary.actual },
              ...(plan.people > 1
                ? [
                    {
                      label: t.spendPlans.perPerson,
                      value: Math.round(summary.actual / plan.people),
                    },
                  ]
                : []),
            ].map(statBox)}
          </dl>
          <p className="mt-3 text-sm text-ink-muted">{t.spendPlans.afterHint}</p>
        </section>
      )}

      <section className="panel p-3 md:p-4">
        <div className="flex items-center justify-between px-2 pb-1 pt-1">
          <h2 className="section-title">{t.spendPlans.costList}</h2>
          {stage === 'after' && summary.planned > 0 ? (
            <span className="text-sm text-ink-muted">
              {tx(t.spendPlans.checked, { checked: summary.checked, planned: summary.planned })}
            </span>
          ) : null}
        </div>

        {plan.items.length === 0 ? (
          <p className="px-2 py-3 text-[0.9375rem] text-ink-muted">{t.spendPlans.costEmpty}</p>
        ) : (
          groupCostItems(plan.items).map((group) => (
            <div key={group.date ?? 'none'} className="mt-2">
              <h3 className="px-2 pb-1 text-sm font-semibold text-ink-soft">
                {group.date ? formatDayHeader(group.date, locale) : t.spendPlans.costNoDate}
              </h3>
              <ul className="divide-y divide-line">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <CostRow item={item} stage={stage} onOpen={() => setForm({ item })} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => setForm({ item: null })}
          className="tap mx-2 mb-1 mt-3 flex min-h-11 w-[calc(100%-1rem)] items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
        >
          <Icon name="plus" size={18} />
          {t.spendPlans.addCost}
        </button>
      </section>

      <CostSheet
        open={form !== null}
        item={editing}
        defaultDate={newCostDate}
        onSave={(input) =>
          editing
            ? updateSpendPlanItem(plan.id, editing.id, input)
            : addSpendPlanItem(plan.id, input, { isExtra: stage === 'after' })
        }
        onDelete={editing ? () => removeSpendPlanItem(plan.id, editing.id) : undefined}
        onClose={() => setForm(null)}
      />

      {stage === 'after' ? (
        <>
          {canSettle ? (
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
                  <p className="px-2 text-center text-sm text-ink-muted">
                    {t.spendPlans.settleHint}
                  </p>
                </>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** One cost: time, what and where on the left; planned or real amount on the right. */
function CostRow({
  item,
  stage,
  onOpen,
}: {
  item: SpendPlanItem;
  stage: CostStage;
  onOpen: () => void;
}) {
  const { t, tx, money } = useI18n();
  const sp = t.spendPlans;
  const diff = itemDiff(item);
  const before = stage === 'before';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="tap flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left hover:bg-paper"
    >
      <span className="num w-11 shrink-0 pt-0.5 text-sm font-semibold text-ink-soft">
        {item.time ?? '—'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-medium">{item.name}</span>
          {item.isExtra ? (
            <span className="shrink-0 rounded-full bg-chart-4/50 px-2 py-px text-xs font-semibold">
              {sp.extras}
            </span>
          ) : null}
        </span>
        {item.place ? (
          <span className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
            <MapPin size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{item.place}</span>
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end">
        {before ? (
          <>
            <span className="num font-semibold">{money(item.estimate)}</span>
            {item.deposit > 0 ? (
              <span className="num text-sm text-ink-muted">
                {tx(sp.costPaidAhead, { amount: money(item.deposit, { compact: true }) })}
              </span>
            ) : null}
          </>
        ) : (
          <>
            {item.actual === null ? (
              <span className="text-sm text-ink-muted">{sp.notFilled}</span>
            ) : (
              <span className="num font-semibold">{money(item.actual)}</span>
            )}
            {!item.isExtra && diff !== null && diff !== 0 ? (
              <DiffLabel diff={diff} />
            ) : !item.isExtra ? (
              <span className="num text-sm text-ink-muted">
                {tx(sp.estimateShort, { amount: money(item.estimate, { compact: true }) })}
              </span>
            ) : null}
          </>
        )}
      </span>
    </button>
  );
}
