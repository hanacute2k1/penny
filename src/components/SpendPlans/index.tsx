'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatVnd } from '@/lib/helper/format';
import { todayIso } from '@/lib/helper/date';
import {
  daysUntilPlan,
  formatPlanDates,
  planDays,
  spendPlanPhase,
  summarizeSpendPlan,
  type SpendPlanPhase,
} from '@/lib/helper/spendPlans';
import { AddFab } from '@/components/Base/AddFab';
import { Icon } from '@/components/Base/Icon';
import { DiffLabel } from './shared';
import { countdownLabel } from '@/lib/helper/spendPlans';
import { SpendPlanSheet } from './SpendPlanSheet';
import type { SpendPlan } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

const PHASE_ORDER: SpendPlanPhase[] = ['review', 'upcoming', 'done'];

export function SpendPlansView() {
  const { t } = useI18n();
  const router = useRouter();
  const { ready, spendPlans, categories, addSpendPlan } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const grouped = useMemo(() => {
    const today = todayIso();
    const groups: Record<SpendPlanPhase, SpendPlan[]> = {
      review: [],
      upcoming: [],
      done: [],
    };
    for (const plan of spendPlans) groups[spendPlanPhase(plan, today)].push(plan);
    groups.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
    groups.review.sort((a, b) => b.startDate.localeCompare(a.startDate));
    groups.done.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return groups;
  }, [spendPlans]);

  if (!ready) {
    return <LoadingText />;
  }

  const phaseTitle: Record<SpendPlanPhase, string> = {
    review: t.spendPlans.review,
    upcoming: t.spendPlans.upcoming,
    done: t.spendPlans.done,
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            {t.spendPlans.title}
          </h1>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">{t.spendPlans.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="btn-primary tap hidden min-h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold md:inline-flex"
        >
          <Icon name="plus" size={20} />
          {t.spendPlans.create}
        </button>
      </div>

      {spendPlans.length === 0 ? (
        <div className="panel mx-auto max-w-xl px-6 py-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-paper text-ink-soft">
            <ItemIcon value="luggage" size={30} />
          </span>
          <p className="mt-3 text-[0.9375rem] text-ink-soft">{t.spendPlans.empty}</p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="btn-primary tap mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-semibold"
          >
            <Icon name="plus" size={20} />
            {t.spendPlans.create}
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          {PHASE_ORDER.map((phase) =>
            grouped[phase].length ? (
              <section key={phase}>
                <h2 className="mb-2 px-1 text-sm font-semibold text-ink-soft">
                  {phaseTitle[phase]} · {grouped[phase].length}
                </h2>
                <ul className="space-y-2">
                  {grouped[phase].map((plan) => (
                    <li key={plan.id}>
                      <SpendPlanCard plan={plan} phase={phase} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}

      <div className="md:hidden">
        <AddFab label={t.spendPlans.create} onClick={() => setSheetOpen(true)} />
      </div>

      <SpendPlanSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        onSave={(input) => {
          const id = addSpendPlan(input);
          router.push(`/plan/${id}`);
        }}
      />
    </>
  );
}

function SpendPlanCard({ plan, phase }: { plan: SpendPlan; phase: SpendPlanPhase }) {
  const { t, tx, locale } = useI18n();
  const summary = summarizeSpendPlan(plan);

  const days = planDays(plan).length;
  const when = [
    formatPlanDates(plan, locale),
    days > 1 ? tx(t.spendPlans.dayCount, { count: days }) : null,
    plan.people > 1 ? tx(t.spendPlans.peopleCount, { count: plan.people }) : null,
    plan.activities.length
      ? tx(t.spendPlans.activityCount, { count: plan.activities.length })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const countdown = phase === 'upcoming' ? countdownLabel(daysUntilPlan(plan), t, tx) : null;

  return (
    <Link
      href={`/plan/${plan.id}`}
      className="panel tap flex items-center gap-3 px-4 py-3.5 hover:bg-paper"
    >
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper text-2xl"
      >
        <ItemIcon value={plan.icon} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{plan.title}</span>
        <span className="block text-sm text-ink-muted">{when}</span>
        {countdown ? (
          <span className="block text-sm font-medium text-ink-soft">{countdown}</span>
        ) : null}
        {phase === 'review' || summary.hasActuals ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {summary.hasActuals ? <DiffLabel diff={summary.diff} /> : null}
            {phase === 'review' ? (
              <span className="text-sm text-ink-soft">
                {tx(t.spendPlans.checked, {
                  checked: summary.checked,
                  planned: summary.planned,
                })}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="num font-semibold">
          {formatVnd(summary.expected, { compact: true, locale })}
        </span>
        <span className="text-xs text-ink-muted">
          {summary.hasActuals ? t.spendPlans.actual : t.spendPlans.expected}
        </span>
        {summary.deposit > 0 ? (
          <span className="num text-xs text-ink-soft">
            {t.spendPlans.deposit} {formatVnd(summary.deposit, { compact: true, locale })}
          </span>
        ) : null}
      </span>
      <Icon name="chevronRight" size={18} className="text-ink-muted" />
    </Link>
  );
}
