'use client';

import {
  ArrowDown,
  CircleCheck,
  Clock,
  ExternalLink,
  MapPinOff,
  Shuffle,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import {
  adviseRoute,
  dayRoutePoints,
  directionsUrls,
  formatDuration,
  formatKm,
  hasRoute,
  type RoutePoint,
} from '@/lib/helper/route';
import { formatDayShort, itineraryByDay } from '@/lib/helper/spendPlans';
import type { PlanActivity, SpendPlan } from '@/lib/type';
import { RouteMap } from './RouteMap';

type Props = {
  plan: Pick<SpendPlan, 'startDate' | 'endDate' | 'activities'>;
  date: string;
  onDateChange: (date: string) => void;
  /** Leave out on the read-only shared page. */
  onReorder?: (activityIds: string[]) => void;
  onEditStop?: (activity: PlanActivity) => void;
  onClose: () => void;
};

/** Spread wider than this in one day gets a "consider splitting" note. */
const WIDE_DAY_KM = 40;

/**
 * One day's route: its stops on a map in order, the distance and rough time of
 * each move, and warnings when the order doubles back, a move doesn't fit the
 * schedule, or the stops are far apart. Real roads open in Google Maps.
 */
export function RouteSheet({ open, ...props }: Props & { open: boolean }) {
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ plan, date, onDateChange, onReorder, onEditStop, onClose }: Props) {
  const { t, tx, locale } = useI18n();
  const [focus, setFocus] = useState<string | null>(null);
  const { days } = itineraryByDay(plan);
  const dayIndex = Math.max(
    0,
    days.findIndex((d) => d.date === date),
  );
  const day = days[dayIndex];
  const routeDays = days.filter(hasRoute);

  const points = day ? dayRoutePoints(day) : [];
  const advice = adviseRoute(points);
  const located = points.filter(
    (p): p is RoutePoint & { point: NonNullable<RoutePoint['point']> } => Boolean(p.point),
  );
  const number = new Map(located.map((p, i) => [p.key, i + 1]));
  const links = directionsUrls(points);
  const km = (value: number) => formatKm(value, locale, t, tx);
  const time = (minutes: number) => formatDuration(minutes, t, tx);
  const activityOf = (p: RoutePoint) => plan.activities.find((a) => a.id === p.activityId);

  const roleLabel = (p: RoutePoint) =>
    p.role === 'start'
      ? t.spendPlans.routeStart
      : p.role === 'end'
        ? t.spendPlans.routeEnd
        : p.role === 'checkIn'
          ? t.spendPlans.checkIn
          : p.role === 'checkOut'
            ? t.spendPlans.checkOut
            : p.role === 'depart'
              ? t.spendPlans.depart
              : p.role === 'arrive'
                ? t.spendPlans.arrive
                : null;

  const dayName = tx(t.spendPlans.dayLabel, { n: dayIndex + 1 });
  const hasWarnings =
    Boolean(advice.better) || advice.tight.length > 0 || advice.spreadKm > WIDE_DAY_KM;

  return (
    <Sheet title={tx(t.spendPlans.routeTitle, { day: dayName })} onClose={onClose} wide>
      {routeDays.length > 1 ? (
        <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 md:-mx-6 md:px-6">
          {routeDays.map((d) => {
            const n = days.indexOf(d) + 1;
            const active = d.date === day?.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  setFocus(null);
                  onDateChange(d.date);
                }}
                aria-pressed={active}
                className={`tap shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                  active ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink-soft'
                }`}
              >
                {tx(t.spendPlans.dayLabel, { n })}
                <span className="num ml-1.5 font-normal opacity-75">
                  {formatDayShort(d.date, locale)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {located.length ? (
        <RouteMap points={located} focusKey={focus} label={t.spendPlans.route} />
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          {t.spendPlans.routeEmpty}
        </p>
      )}

      {advice.legs.length ? (
        <div className="mt-3">
          <p className="num text-lg font-semibold">
            {tx(t.spendPlans.routeSummary, {
              km: km(advice.totalKm),
              time: time(advice.totalMinutes),
            })}
          </p>
          <p className="text-sm text-ink-muted">{t.spendPlans.routeEstimateHint}</p>
        </div>
      ) : null}

      {advice.legs.length >= 2 ? (
        <div className="mt-3 space-y-2">
          {advice.better ? (
            <div className="rounded-2xl bg-chart-4/45 px-4 py-3">
              <p className="flex items-center gap-2 font-semibold">
                <Shuffle size={17} aria-hidden="true" />
                {t.spendPlans.routeDetour}
              </p>
              <p className="mt-0.5 text-[0.9375rem]">
                {tx(t.spendPlans.routeDetourBody, {
                  order: advice.better.order.map((p) => number.get(p.key)).join(' → '),
                  km: km(advice.better.savedKm),
                })}
              </p>
              {onReorder ? (
                <button
                  type="button"
                  onClick={() => onReorder(advice.better!.activityIds)}
                  className="btn-primary tap mt-2.5 min-h-11 rounded-xl px-4 text-sm font-semibold"
                >
                  {t.spendPlans.routeReorder}
                </button>
              ) : null}
            </div>
          ) : null}
          {advice.tight.map(({ leg, gapMinutes }) => (
            <p
              key={`${leg.from.key}-${leg.to.key}`}
              className="flex items-start gap-2 rounded-2xl bg-coral-soft px-4 py-3 text-[0.9375rem]"
            >
              <Clock size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-coral" />
              {tx(t.spendPlans.routeTight, {
                from: leg.from.title,
                to: leg.to.title,
                need: time(leg.minutes),
                gap: time(gapMinutes),
              })}
            </p>
          ))}
          {advice.spreadKm > WIDE_DAY_KM ? (
            <p className="flex items-start gap-2 rounded-2xl bg-paper px-4 py-3 text-[0.9375rem]">
              <TriangleAlert size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
              {tx(t.spendPlans.routeSpread, { km: km(advice.spreadKm) })}
            </p>
          ) : null}
          {!hasWarnings ? (
            <p className="flex items-center gap-2 rounded-2xl bg-chart-3/45 px-4 py-3 text-[0.9375rem] font-medium">
              <CircleCheck size={17} aria-hidden="true" />
              {t.spendPlans.routeGood}
            </p>
          ) : null}
        </div>
      ) : null}

      <ol className="mt-4">
        {points.map((p) => {
          const n = number.get(p.key);
          const leg = advice.legs.find((l) => l.from.key === p.key);
          const role = roleLabel(p);
          const activity = activityOf(p);
          const legUrl = leg ? directionsUrls([leg.from, leg.to])[0] : null;
          return (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => {
                  if (p.point) setFocus(p.key);
                  else if (activity && onEditStop) onEditStop(activity);
                }}
                className="tap flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-paper"
              >
                {n ? (
                  <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold">
                    {n}
                  </span>
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-dashed border-line text-ink-muted">
                    <MapPinOff size={14} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-medium ${n ? '' : 'text-ink-muted'}`}>
                    {role ? <span className="text-ink-muted">{role} · </span> : null}
                    {p.title}
                  </span>
                  {!n ? (
                    <span className="block text-xs text-ink-muted">
                      {t.spendPlans.routeMissingHint}
                    </span>
                  ) : null}
                </span>
                {p.time ? (
                  <span className="num shrink-0 text-sm font-semibold text-ink-soft">{p.time}</span>
                ) : null}
              </button>
              {leg ? (
                <div className="flex items-center gap-3 py-0.5 pl-1">
                  <span className="grid w-8 shrink-0 place-items-center text-ink-muted">
                    <ArrowDown size={15} aria-hidden="true" />
                  </span>
                  <span className="num text-sm text-ink-muted">
                    {leg.transit
                      ? tx(t.spendPlans.routeScheduled, {
                          km: km(leg.km),
                          time: time(leg.minutes),
                        })
                      : `${km(leg.km)} · ~${time(leg.minutes)}`}
                  </span>
                  {legUrl ? (
                    <a
                      href={legUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t.spendPlans.openMap}: ${leg.from.title} → ${leg.to.title}`}
                      className="tap grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:text-ink"
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {advice.missing.length && located.length ? (
        <p className="mt-2 text-sm text-ink-muted">
          {tx(t.spendPlans.routeMissing, { count: advice.missing.length })}
        </p>
      ) : null}

      {links.length ? (
        <div className={`mt-5 grid gap-2 ${links.length > 1 ? 'grid-cols-2' : ''}`}>
          {links.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary tap flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 font-semibold"
            >
              <ExternalLink size={17} aria-hidden="true" />
              {links.length > 1 ? tx(t.spendPlans.routePart, { n: i + 1 }) : t.spendPlans.routeOpen}
            </a>
          ))}
        </div>
      ) : null}
    </Sheet>
  );
}
