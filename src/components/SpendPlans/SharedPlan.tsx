'use client';

import { CalendarDays, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BrandMark } from '@/components/Base/BrandMark';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { Segmented } from '@/components/Base/Segmented';
import { useI18n } from '@/contexts/I18nContext';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import { formatMoney } from '@/lib/helper/format';
import { formatPlanDates, planDays, summarizeSpendPlan } from '@/lib/helper/spendPlans';
import type { SpendPlan } from '@/lib/type';
import { Checklist } from './Checklist';
import { Itinerary } from './Itinerary';
import { RouteSheet } from './RouteSheet';

type Tab = 'itinerary' | 'costs' | 'prepare';

/** What someone sees when they open a shared plan link: everything, read-only. */
export function SharedPlanView({ plan }: { plan: SpendPlan | null }) {
  const { t, tx, locale } = useI18n();
  const [tab, setTab] = useState<Tab>('itinerary');
  const [routeDay, setRouteDay] = useState<string | null>(null);

  const topBar = (
    <header className="mb-6 flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2.5">
        <BrandMark size={34} />
        <span className="text-lg font-semibold tracking-tight">{t.brand}</span>
      </Link>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft">
        <Eye size={15} aria-hidden="true" />
        {t.spendPlans.readOnly}
      </span>
    </header>
  );

  if (!plan) {
    return (
      <main className="mx-auto min-h-dvh max-w-3xl px-4 py-6 md:px-8">
        {topBar}
        <div className="panel px-6 py-12 text-center">
          <p className="text-ink-soft">{t.spendPlans.sharedNotFound}</p>
          <Link
            href="/"
            className="btn-primary tap mt-5 inline-flex min-h-12 items-center rounded-2xl px-5 font-semibold"
          >
            {t.spendPlans.sharedCta}
          </Link>
        </div>
      </main>
    );
  }

  const days = planDays(plan);
  const summary = summarizeSpendPlan(plan);
  // The owner's currency, not the viewer's: these are their amounts.
  const compact = (value: number) =>
    formatMoney(value, { currency: plan.currency ?? DEFAULT_CURRENCY, locale, compact: true });
  const planned = plan.items.filter((item) => !item.isExtra || (item.actual ?? 0) > 0);
  const stats = [
    {
      label: summary.hasActuals ? t.spendPlans.actual : t.spendPlans.expected,
      value: summary.expected,
    },
    ...(plan.people > 1 ? [{ label: t.spendPlans.perPerson, value: summary.perPerson }] : []),
    { label: t.spendPlans.deposit, value: summary.deposit },
    { label: t.spendPlans.remaining, value: summary.remaining },
  ];

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-6 md:px-8">
      {topBar}
      <p className="mb-2 text-sm font-semibold text-ink-muted">{t.spendPlans.sharedFrom}</p>

      <div className="space-y-4">
        <section className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface shadow-[var(--shadow)]"
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
            {plan.note ? <p className="mt-1 text-sm text-ink-muted">{plan.note}</p> : null}
          </div>
        </section>

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
          <Itinerary plan={plan} onRoute={setRouteDay} />
        ) : tab === 'costs' ? (
          <section className="panel p-5 md:p-6">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0 rounded-2xl bg-paper px-3 py-2.5">
                  <dt className="truncate text-sm text-ink-soft">{stat.label}</dt>
                  <dd className="num mt-0.5 truncate font-semibold">{compact(stat.value)}</dd>
                </div>
              ))}
            </dl>
            {planned.length ? (
              <ul className="mt-4 divide-y divide-line">
                {planned.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {item.name || t.spendPlans.extras}
                      </span>
                      {item.deposit > 0 ? (
                        <span className="num block text-sm text-ink-muted">
                          {t.spendPlans.deposit} {compact(item.deposit)}
                        </span>
                      ) : null}
                    </span>
                    <span className="num shrink-0 text-right font-semibold">
                      {compact(item.actual ?? item.estimate)}
                      <span className="block text-xs font-normal text-ink-muted">
                        {item.actual !== null ? t.spendPlans.actual : t.spendPlans.estimate}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : (
          <Checklist items={plan.checklist} />
        )}

        <RouteSheet
          open={routeDay !== null}
          plan={plan}
          date={routeDay ?? days[0]}
          onDateChange={setRouteDay}
          onClose={() => setRouteDay(null)}
        />

        <div className="pb-6 pt-4 text-center">
          <Link
            href="/"
            className="btn-secondary tap inline-flex min-h-12 items-center rounded-2xl px-5 font-semibold"
          >
            {t.spendPlans.sharedCta}
          </Link>
        </div>
      </div>
    </main>
  );
}
