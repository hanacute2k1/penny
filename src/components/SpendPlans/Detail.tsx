'use client';

import { CalendarDays, Share2, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { Icon } from '@/components/Base/Icon';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { LoadingText } from '@/components/Base/LoadingText';
import { Segmented } from '@/components/Base/Segmented';
import { useI18n } from '@/contexts/I18nContext';
import { useStore } from '@/contexts/StoreContext';
import { todayIso } from '@/lib/helper/date';
import {
  countdownLabel,
  daysUntilPlan,
  formatPlanDates,
  planDays,
  spendPlanPhase,
  summarizeSpendPlan,
} from '@/lib/helper/spendPlans';
import type { PlanActivity, PlanActivityInput } from '@/lib/type';
import { ActivitySheet } from './ActivitySheet';
import { Checklist } from './Checklist';
import { Costs } from './Costs';
import { Itinerary } from './Itinerary';
import { RouteSheet } from './RouteSheet';
import { ShareSheet } from './ShareSheet';
import { SpendPlanSheet } from './SpendPlanSheet';

type Tab = 'itinerary' | 'costs' | 'prepare';

/** One trip: header with dates and people, then itinerary / costs / packing tabs. */
export function SpendPlanDetailView() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { t, tx, locale } = useI18n();
  const {
    ready,
    spendPlans,
    categories,
    updateSpendPlan,
    deleteSpendPlan,
    addPlanActivity,
    updatePlanActivity,
    togglePlanActivity,
    removePlanActivity,
    reorderPlanStops,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
  } = useStore();
  const [tab, setTab] = useState<Tab>('itinerary');
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Open activity form: a day to add to, or an existing stop to edit. */
  const [activityForm, setActivityForm] = useState<{
    date: string;
    prefill?: Partial<PlanActivityInput>;
    activity: PlanActivity | null;
  } | null>(null);
  /** Day whose route is open on the map. */
  const [routeDay, setRouteDay] = useState<string | null>(null);

  const plan = spendPlans.find((p) => p.id === planId);

  if (!ready) return <LoadingText />;

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

  const days = planDays(plan);
  const phase = spendPlanPhase(plan, todayIso());
  const until = daysUntilPlan(plan);
  const lastDay = days[days.length - 1];
  const happening = until <= 0 && todayIso() <= lastDay && plan.status !== 'done';
  /** Asks for the real totals only once the last day is over. */
  const tripOver = phase === 'review' && todayIso() > lastDay;
  const status = happening
    ? t.spendPlans.happening
    : phase === 'upcoming'
      ? countdownLabel(until, t, tx)
      : null;

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
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} aria-hidden="true" />
                {formatPlanDates(plan, locale)}
                {days.length > 1 ? ` · ${tx(t.spendPlans.dayCount, { count: days.length })}` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={16} aria-hidden="true" />
                {tx(t.spendPlans.peopleCount, { count: plan.people })}
              </span>
            </p>
            {status ? (
              <span className="mt-1.5 inline-block rounded-full bg-chart-4/50 px-2.5 py-0.5 text-sm font-semibold">
                {status}
              </span>
            ) : null}
            {plan.note ? <p className="mt-1 text-sm text-ink-muted">{plan.note}</p> : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={t.spendPlans.share}
              title={t.spendPlans.share}
              className={`tap grid h-11 w-11 place-items-center rounded-full border ${
                plan.shareId
                  ? 'border-accent/40 bg-accent-soft text-accent-deep'
                  : 'border-line bg-surface text-ink-soft hover:text-ink'
              }`}
            >
              <Share2 size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label={t.spendPlans.edit}
              title={t.spendPlans.edit}
              className="tap grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-soft hover:text-ink"
            >
              <Icon name="edit" size={20} />
            </button>
          </div>
        </header>

        {tripOver && !summarizeSpendPlan(plan).hasActuals && tab !== 'costs' ? (
          <button
            type="button"
            onClick={() => setTab('costs')}
            className="tap block w-full rounded-2xl bg-chart-4/40 px-4 py-3 text-left text-[0.9375rem] font-medium"
          >
            {t.spendPlans.reviewHint} ›
          </button>
        ) : null}

        <Segmented
          value={tab}
          onChange={setTab}
          ariaLabel={plan.title}
          options={[
            { value: 'itinerary', label: t.spendPlans.tabItinerary },
            { value: 'costs', label: t.spendPlans.tabCosts },
            { value: 'prepare', label: t.spendPlans.tabPrepare },
          ]}
        />

        {tab === 'itinerary' ? (
          <Itinerary
            plan={plan}
            onAdd={(date, prefill) => setActivityForm({ date, prefill, activity: null })}
            onEdit={(activity) => setActivityForm({ date: activity.date, activity })}
            onToggle={(id, part) => togglePlanActivity(plan.id, id, part)}
            onRoute={setRouteDay}
          />
        ) : tab === 'costs' ? (
          <Costs plan={plan} />
        ) : (
          <Checklist
            items={plan.checklist}
            onAdd={(text) => addChecklistItem(plan.id, text)}
            onToggle={(id) => toggleChecklistItem(plan.id, id)}
            onRemove={(id) => removeChecklistItem(plan.id, id)}
          />
        )}

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="tap flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-coral hover:bg-coral-soft"
        >
          <Icon name="trash" size={18} />
          {t.spendPlans.delete}
        </button>
      </div>

      <ActivitySheet
        open={activityForm !== null}
        days={days}
        defaultDate={activityForm?.date ?? days[0]}
        prefill={activityForm?.prefill}
        initial={activityForm?.activity}
        onClose={() => setActivityForm(null)}
        onSave={(input) => {
          const editing = activityForm?.activity;
          if (editing) updatePlanActivity(plan.id, editing.id, input);
          else addPlanActivity(plan.id, input);
        }}
        onDelete={() => {
          const editing = activityForm?.activity;
          if (editing) removePlanActivity(plan.id, editing.id);
        }}
      />

      <RouteSheet
        open={routeDay !== null}
        plan={plan}
        date={routeDay ?? days[0]}
        onDateChange={setRouteDay}
        onReorder={(ids) => reorderPlanStops(plan.id, ids)}
        onEditStop={(activity) => {
          setRouteDay(null);
          setActivityForm({ date: activity.date, activity });
        }}
        onClose={() => setRouteDay(null)}
      />

      <ShareSheet open={shareOpen} plan={plan} onClose={() => setShareOpen(false)} />

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
