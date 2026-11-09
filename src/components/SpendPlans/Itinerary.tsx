'use client';

import {
  ArrowRight,
  ArrowRightFromLine,
  ArrowRightToLine,
  BedDouble,
  Bus,
  Check,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Route,
  type LucideIcon,
} from 'lucide-react';
import { CopyButton } from '@/components/Base/CopyButton';
import { useI18n } from '@/contexts/I18nContext';
import { todayIso } from '@/lib/helper/date';
import { stopMapUrl } from '@/lib/helper/maps';
import { hasRoute } from '@/lib/helper/route';
import {
  formatDayHeader,
  formatDayShort,
  isJourney,
  isOvernightJourney,
  itineraryByDay,
  type ItineraryStop,
} from '@/lib/helper/spendPlans';
import type { PlanActivity, PlanActivityInput, SpendPlan } from '@/lib/type';
import { KindBadge } from './kinds';

type Props = {
  plan: Pick<SpendPlan, 'startDate' | 'endDate' | 'activities'>;
  /** Leave the editing handlers out for a read-only itinerary (the shared page). */
  /** Add a stop on a day, optionally with some fields filled in. */
  onAdd?: (date: string, prefill?: Partial<PlanActivityInput>) => void;
  onEdit?: (activity: PlanActivity) => void;
  onToggle?: (activityId: string, part: 'main' | 'end') => void;
  /** Opens the day's route on the map. */
  onRoute?: (date: string) => void;
};

const dayId = (date: string) => `day-${date}`;

/**
 * The trip day by day: one card per day with its stops in time order, each with
 * its kind, place (opens Google Maps, copyable) and note. A stay shows as check-in
 * and check-out on their days and as the night's lodging in between; a ride there
 * or back shows where it leaves from and arrives. Multi-day trips get a row of
 * day chips on top and quick buttons for the ride there, the stay and the ride back.
 */
export function Itinerary({ plan, onAdd, onEdit, onToggle, onRoute }: Props) {
  const { t, tx, locale } = useI18n();
  const { days, unscheduled } = itineraryByDay(plan);
  const today = todayIso();
  const editable = Boolean(onAdd);

  return (
    <div className="space-y-4">
      {days.length > 1 ? (
        <nav
          aria-label={t.spendPlans.jumpToDay}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
          {days.map((day, index) => (
            <a
              key={day.date}
              href={`#${dayId(day.date)}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(dayId(day.date))
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`tap flex shrink-0 flex-col rounded-2xl border px-3.5 py-2 text-left ${
                day.date === today
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-surface hover:bg-paper'
              }`}
            >
              <span className="text-sm font-semibold">
                {tx(t.spendPlans.dayLabel, { n: index + 1 })}
              </span>
              <span className="num text-xs opacity-75">
                {formatDayShort(day.date, locale)}
                {day.stops.length ? ` · ${day.stops.length}` : ''}
              </span>
            </a>
          ))}
        </nav>
      ) : null}

      {editable && days.length > 1 ? (
        <LongTripCard
          activities={plan.activities}
          first={days[0].date}
          last={days[days.length - 1].date}
          onAdd={onAdd!}
        />
      ) : null}

      {days.map((day, index) => {
        const canRoute = Boolean(onRoute) && hasRoute(day);
        return (
          <section key={day.date} id={dayId(day.date)} className="panel scroll-mt-24 p-4 md:p-5">
            <header className="mb-3 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-center leading-none">
                <span className="num text-lg font-bold">{index + 1}</span>
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">
                  {tx(t.spendPlans.dayLabel, { n: index + 1 })}
                  {day.date === today ? (
                    <span className="ml-2 rounded-full bg-chart-3/60 px-2 py-0.5 text-xs font-semibold">
                      {t.spendPlans.today}
                    </span>
                  ) : null}
                </h3>
                <p className="text-sm text-ink-muted">
                  {formatDayHeader(day.date, locale)}
                  {day.stops.length
                    ? ` · ${tx(t.spendPlans.activityCount, { count: day.stops.length })}`
                    : ''}
                </p>
              </div>
              {canRoute ? (
                <button
                  type="button"
                  onClick={() => onRoute?.(day.date)}
                  className="tap inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-sm font-semibold text-ink-soft hover:text-ink"
                >
                  <Route size={16} aria-hidden="true" />
                  {t.spendPlans.route}
                </button>
              ) : null}
            </header>

            {day.wakeAt && day.stops[0]?.activity.id !== day.wakeAt.id ? (
              <LodgingLine activity={day.wakeAt} label={t.spendPlans.routeStart} />
            ) : null}

            {day.stops.length ? (
              <StopList stops={day.stops} onEdit={onEdit} onToggle={onToggle} />
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-4 text-center text-sm text-ink-muted">
                {t.spendPlans.dayEmpty}
              </p>
            )}

            {day.sleepAt ? (
              <LodgingLine
                activity={day.sleepAt}
                label={tx(t.spendPlans.sleepAt, { name: day.sleepAt.title })}
                night
              />
            ) : null}

            {editable ? (
              <button
                type="button"
                onClick={() => onAdd?.(day.date)}
                className="tap mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
              >
                <Plus size={18} strokeWidth={2} aria-hidden="true" />
                {t.spendPlans.addActivity}
              </button>
            ) : null}
          </section>
        );
      })}

      {unscheduled.length ? (
        <section className="panel p-4 md:p-5">
          <h3 className="font-semibold">{t.spendPlans.unscheduled}</h3>
          <p className="mb-3 text-sm text-ink-muted">{t.spendPlans.unscheduledHint}</p>
          <StopList stops={unscheduled} onEdit={onEdit} onToggle={onToggle} showDate />
        </section>
      ) : null}
    </div>
  );
}

/** "Leave from Hotel X" at the top of a day, "Night at Hotel X" at the bottom. */
function LodgingLine({
  activity,
  label,
  night = false,
}: {
  activity: PlanActivity;
  label: string;
  night?: boolean;
}) {
  const LineIcon = night ? Moon : BedDouble;
  return (
    <p
      className={`flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm text-ink-soft ${
        night ? 'mt-3' : 'mb-3'
      }`}
    >
      <LineIcon size={15} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {night ? label : `${label}: ${activity.title}`}
      </span>
    </p>
  );
}

function StopList({
  stops,
  onEdit,
  onToggle,
  showDate = false,
}: {
  stops: ItineraryStop[];
  onEdit?: (activity: PlanActivity) => void;
  onToggle?: (activityId: string, part: 'main' | 'end') => void;
  showDate?: boolean;
}) {
  const { t, tx, locale } = useI18n();

  return (
    <ol className="relative">
      {stops.map((stop, index) => {
        const { activity, role } = stop;
        const last = index === stops.length - 1;
        const name = activity.title || t.spendPlans.kinds[activity.kind];
        const roleTag = ROLE_TAGS[role];
        const journey = isJourney(activity);
        // Arrival time under a departure: "đến 14:00" or "đến 05:00, 18/11".
        const arrival =
          role === 'depart' && activity.endTime
            ? isOvernightJourney(activity)
              ? tx(t.spendPlans.arriveAtDay, {
                  time: activity.endTime,
                  day: formatDayShort(activity.endDate as string, locale),
                })
              : tx(t.spendPlans.arriveAt, { time: activity.endTime })
            : null;
        const secondHalf = role === 'checkOut' || role === 'arrive';
        const body = (
          <>
            {roleTag ? (
              <span className="mb-0.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <roleTag.icon size={13} aria-hidden="true" />
                {t.spendPlans[roleTag.label]}
                {arrival ? <span className="normal-case tracking-normal">· {arrival}</span> : null}
              </span>
            ) : null}
            <p
              className={`font-semibold ${stop.done ? 'text-ink-muted line-through decoration-ink-muted/60' : ''}`}
            >
              {name}
            </p>
            {activity.note && !secondHalf ? (
              <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{activity.note}</p>
            ) : null}
          </>
        );
        return (
          <li key={stop.key} className="relative flex gap-3">
            {/* Time column */}
            <span className="num w-12 shrink-0 pt-2 text-right text-sm font-semibold text-ink-soft">
              {showDate
                ? formatDayShort(stop.date, locale)
                : (stop.time ?? (
                    <span className="text-xs font-medium text-ink-muted">
                      {t.spendPlans.anyTime}
                    </span>
                  ))}
            </span>

            {/* Badge on a vertical line linking the stops */}
            <span className="relative flex shrink-0 flex-col items-center">
              <KindBadge kind={activity.kind} />
              {!last ? <span aria-hidden="true" className="w-px flex-1 bg-line" /> : null}
            </span>

            <div className={`min-w-0 flex-1 pt-1.5 ${last ? '' : 'pb-4'}`}>
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(activity)}
                  className="block w-full rounded-lg text-left hover:opacity-80"
                >
                  {body}
                </button>
              ) : (
                body
              )}
              {journey && role === 'depart' && activity.from ? (
                <span className="mt-1 flex max-w-full flex-wrap items-center gap-1">
                  <PlacePill
                    text={activity.from}
                    url={activity.fromMapUrl}
                    label={`${t.spendPlans.fromPlace}: ${name}`}
                  />
                  {!isOvernightJourney(activity) && (activity.place || activity.mapUrl) ? (
                    <>
                      <ArrowRight size={14} aria-hidden="true" className="text-ink-muted" />
                      <PlacePill
                        text={activity.place}
                        url={activity.mapUrl}
                        label={`${t.spendPlans.toPlace}: ${name}`}
                      />
                    </>
                  ) : null}
                </span>
              ) : activity.place || activity.mapUrl ? (
                <PlacePill text={activity.place} url={activity.mapUrl} label={name} />
              ) : null}
            </div>

            {onToggle ? (
              <button
                type="button"
                role="checkbox"
                aria-checked={stop.done}
                aria-label={`${t.spendPlans.markDone}: ${name}`}
                onClick={() => onToggle(activity.id, secondHalf ? 'end' : 'main')}
                className={`tap mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                  stop.done
                    ? 'border-income bg-income text-paper'
                    : 'border-line text-transparent hover:text-ink-muted'
                }`}
              >
                <Check size={16} strokeWidth={2.6} aria-hidden="true" />
              </button>
            ) : stop.done ? (
              <Check
                size={18}
                strokeWidth={2.4}
                aria-label={t.spendPlans.markDone}
                className="mt-2 shrink-0 text-income"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

const ROLE_TAGS: Record<
  ItineraryStop['role'],
  { icon: LucideIcon; label: 'checkIn' | 'checkOut' | 'depart' | 'arrive' } | null
> = {
  visit: null,
  checkIn: { icon: LogIn, label: 'checkIn' },
  checkOut: { icon: LogOut, label: 'checkOut' },
  depart: { icon: ArrowRightFromLine, label: 'depart' },
  arrive: { icon: ArrowRightToLine, label: 'arrive' },
};

/** A place that opens in Google Maps, with a copy button for its link or address. */
function PlacePill({ text, url, label }: { text?: string; url?: string; label: string }) {
  const { t } = useI18n();
  const href = stopMapUrl({ mapUrl: url, place: text });
  const copyText = url || text;
  if (!href) return null;
  return (
    <span className="mt-1 inline-flex max-w-full items-center rounded-full bg-paper">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={t.spendPlans.openMap}
        className="inline-flex min-w-0 items-center gap-1 py-1 pl-2.5 pr-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <MapPin size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{text || t.spendPlans.openMap}</span>
      </a>
      {copyText ? (
        <CopyButton text={copyText} label={label} className="h-7 w-8 rounded-full" />
      ) : null}
    </span>
  );
}

/**
 * "Going far?" with one-tap adds for what a long trip needs and doesn't have yet:
 * the ride there (day 1), the stay, and the ride back (last day, set up as the
 * ride there reversed).
 */
function LongTripCard({
  activities,
  first,
  last,
  onAdd,
}: {
  activities: PlanActivity[];
  first: string;
  last: string;
  onAdd: (date: string, prefill?: Partial<PlanActivityInput>) => void;
}) {
  const { t } = useI18n();
  const journeys = activities.filter(isJourney);
  const outbound = journeys.find((a) => a.date === first);
  const back = journeys.find((a) => a.date === last && a !== outbound);
  const hasStay = activities.some((a) => a.kind === 'stay');
  if (outbound && back && hasStay) return null;

  const buttons: { key: string; icon: LucideIcon; label: string; run: () => void }[] = [];
  if (!outbound)
    buttons.push({
      key: 'out',
      icon: Bus,
      label: t.spendPlans.addOutbound,
      run: () => onAdd(first, { kind: 'move', date: first }),
    });
  if (!hasStay)
    buttons.push({
      key: 'stay',
      icon: BedDouble,
      label: t.spendPlans.addStay,
      run: () => onAdd(first, { kind: 'stay', date: first }),
    });
  if (!back)
    buttons.push({
      key: 'back',
      icon: Bus,
      label: t.spendPlans.addReturn,
      run: () =>
        onAdd(last, {
          kind: 'move',
          date: last,
          title: t.spendPlans.returnTitle,
          // Home is where the ride there left from.
          from: outbound?.place,
          fromMapUrl: outbound?.mapUrl,
          fromLat: outbound?.lat,
          fromLng: outbound?.lng,
          place: outbound?.from,
          mapUrl: outbound?.fromMapUrl,
          lat: outbound?.fromLat,
          lng: outbound?.fromLng,
        }),
    });

  return (
    <section className="rounded-2xl border border-dashed border-line bg-surface px-4 py-3">
      <p className="font-semibold">{t.spendPlans.longTripTitle}</p>
      <p className="text-sm text-ink-muted">{t.spendPlans.longTripHint}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={b.run}
            className="tap inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            <Plus size={15} aria-hidden="true" />
            <b.icon size={16} aria-hidden="true" />
            {b.label}
          </button>
        ))}
      </div>
    </section>
  );
}
