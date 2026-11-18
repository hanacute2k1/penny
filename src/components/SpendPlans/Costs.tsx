'use client';

import { MapPin } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { AmountInput } from '@/components/Base/AmountInput';
import { Icon } from '@/components/Base/Icon';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { Segmented } from '@/components/Base/Segmented';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import {
  costsByDay,
  formatDayHeader,
  itemDiff,
  summarizeSpendPlan,
  type CostStop,
} from '@/lib/helper/spendPlans';
import type { PlanActivity, SpendPlan, SpendPlanItem, SpendPlanItemInput } from '@/lib/type';
import { CostSheet } from './CostSheet';
import { KindBadge } from './kinds';
import { DiffLabel } from './shared';

export type CostStage = 'before' | 'after';

/**
 * The money side of a trip, in two steps:
 * - before: the price of each itinerary stop, day by day, plus costs of their own;
 * - after: what each cost really was, unplanned extras, and the gap against the
 *   plan (deficit or money left), then posting it all to Transactions.
 * Each day lists that day's itinerary with a price box per stop; costs that
 * aren't in the itinerary (phát sinh) are added, edited and deleted per day.
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
  /**
   * Open cost form: the cost being edited (null = new), the day a new cost goes
   * on, or the itinerary stop being priced.
   */
  const [form, setForm] = useState<{
    item: SpendPlanItem | null;
    date?: string;
    stop?: PlanActivity;
  } | null>(null);
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

  const { days, general } = costsByDay(plan);

  /** Typing a stop's price: before the trip it's the estimate, after it what it really cost. */
  const setStopAmount = (
    stop: PlanActivity,
    item: SpendPlanItem | undefined,
    value: number | null,
  ) => {
    const field = stage === 'before' ? { estimate: value ?? 0 } : { actual: value };
    if (item) updateSpendPlanItem(plan.id, item.id, { ...costInput(item), ...field });
    else if (value !== null)
      addSpendPlanItem(
        plan.id,
        {
          name: stop.title,
          place: stop.place,
          date: stop.date,
          activityId: stop.id,
          estimate: 0,
          deposit: 0,
          actual: null,
          ...field,
        },
        { isExtra: false },
      );
  };

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

      {general.length > 0 || days.length === 0 ? (
        <CostGroup
          title={t.spendPlans.costGeneral}
          hint={t.spendPlans.costGeneralHint}
          extras={general}
          stage={stage}
          onEdit={(item) => setForm({ item })}
          onAdd={() => setForm({ item: null })}
        />
      ) : null}

      {days.map((day, index) => (
        <CostGroup
          key={day.date}
          title={`${tx(t.spendPlans.dayLabel, { n: index + 1 })} · ${formatDayHeader(day.date, locale)}`}
          stops={day.stops}
          extras={day.extras}
          stage={stage}
          onStopAmount={(stop, value) => setStopAmount(stop.activity, stop.item, value)}
          onOpenStop={(stop) => setForm({ item: stop.item ?? null, stop: stop.activity })}
          onEdit={(item) => setForm({ item, date: day.date })}
          onAdd={() => setForm({ item: null, date: day.date })}
        />
      ))}

      {days.length > 0 && general.length === 0 ? (
        <button
          type="button"
          onClick={() => setForm({ item: null })}
          className="tap mx-auto block text-sm font-semibold text-ink-soft hover:text-ink"
        >
          + {t.spendPlans.costAddGeneral}
        </button>
      ) : null}

      <CostSheet
        open={form !== null}
        item={editing}
        date={form?.date}
        stop={form?.stop}
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

/** The fields of a cost as the form edits them. */
function costInput(item: SpendPlanItem): SpendPlanItemInput {
  const { name, estimate, deposit, actual, date, place, activityId } = item;
  return { name, estimate, deposit, actual, date, place, activityId };
}

/** One day (or the trip's general costs): itinerary stops with a price box, then own costs. */
function CostGroup({
  title,
  hint,
  stops = [],
  extras,
  stage,
  onStopAmount,
  onOpenStop,
  onEdit,
  onAdd,
}: {
  title: string;
  hint?: string;
  stops?: CostStop[];
  extras: SpendPlanItem[];
  stage: CostStage;
  onStopAmount?: (stop: CostStop, value: number | null) => void;
  onOpenStop?: (stop: CostStop) => void;
  onEdit: (item: SpendPlanItem) => void;
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const sp = t.spendPlans;
  const before = stage === 'before';

  return (
    <section className="panel p-3 md:p-4">
      <div className="px-2 pb-1 pt-1">
        <h2 className="section-title">{title}</h2>
        {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      </div>

      {stops.length === 0 && extras.length === 0 && !hint ? (
        <p className="px-2 py-2 text-sm text-ink-muted">{sp.costDayEmpty}</p>
      ) : null}

      <ul className="divide-y divide-line">
        {stops.map((stop) => {
          const label = before ? sp.estimate : sp.actual;
          return (
            <li key={stop.activity.id} className="flex items-center gap-3 px-2 py-3">
              <button
                type="button"
                onClick={() => onOpenStop?.(stop)}
                className="tap flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <KindBadge kind={stop.activity.kind} size={32} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{stop.activity.title}</span>
                  <CostNote
                    item={stop.item}
                    stage={stage}
                    place={stop.activity.place}
                    time={stop.activity.time}
                  />
                </span>
              </button>
              <span className="flex min-h-11 w-28 shrink-0 items-center rounded-xl border border-line bg-paper px-3 focus-within:border-ink">
                <AmountInput
                  value={before ? stop.item?.estimate || null : (stop.item?.actual ?? null)}
                  onChange={(value) => onStopAmount?.(stop, value)}
                  ariaLabel={`${label} ${stop.activity.title}`}
                  placeholder={before ? '0' : sp.notFilled}
                  className="w-full"
                />
              </span>
            </li>
          );
        })}
        {extras.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="tap flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-paper"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{item.name}</span>
                  {item.isExtra ? (
                    <span className="shrink-0 rounded-full bg-chart-4/50 px-2 py-px text-xs font-semibold">
                      {sp.extras}
                    </span>
                  ) : null}
                </span>
                <CostNote item={item} stage={stage} place={item.place} />
              </span>
              <CostAmount item={item} stage={stage} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="tap mx-2 mb-1 mt-2 flex min-h-11 w-[calc(100%-1rem)] items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
      >
        <Icon name="plus" size={18} />
        {hint ? sp.addCost : sp.costAddExtra}
      </button>
    </section>
  );
}

/** Small line under a cost: where, the deposit before the trip, the gap after it. */
function CostNote({
  item,
  stage,
  place,
  time,
}: {
  item?: SpendPlanItem;
  stage: CostStage;
  place?: string;
  time?: string;
}) {
  const { t, tx, money } = useI18n();
  const sp = t.spendPlans;
  const diff = item ? itemDiff(item) : null;
  const parts: ReactNode[] = [];
  if (time) {
    parts.push(
      <span key="time" className="num shrink-0 font-semibold text-ink-soft">
        {time}
      </span>,
    );
  }
  if (place) {
    parts.push(
      <span key="place" className="inline-flex min-w-0 items-center gap-1">
        <MapPin size={13} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{place}</span>
      </span>,
    );
  }
  if (item && stage === 'before' && item.deposit > 0) {
    parts.push(
      <span key="deposit" className="num shrink-0">
        {tx(sp.costPaidAhead, { amount: money(item.deposit, { compact: true }) })}
      </span>,
    );
  }
  if (item && stage === 'after' && !item.isExtra) {
    parts.push(
      diff !== null && diff !== 0 ? (
        <DiffLabel key="diff" diff={diff} />
      ) : (
        <span key="est" className="num shrink-0">
          {tx(sp.estimateShort, { amount: money(item.estimate, { compact: true }) })}
        </span>
      ),
    );
  }
  if (!parts.length) return null;
  return (
    <span className="mt-0.5 flex min-w-0 items-center gap-2 text-sm text-ink-muted">{parts}</span>
  );
}

function CostAmount({ item, stage }: { item: SpendPlanItem; stage: CostStage }) {
  const { t, money } = useI18n();
  if (stage === 'before')
    return <span className="num shrink-0 font-semibold">{money(item.estimate)}</span>;
  return item.actual === null ? (
    <span className="shrink-0 text-sm text-ink-muted">{t.spendPlans.notFilled}</span>
  ) : (
    <span className="num shrink-0 font-semibold">{money(item.actual)}</span>
  );
}
