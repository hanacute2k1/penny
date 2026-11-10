import { addDays, differenceInCalendarDays, format, parse } from 'date-fns';
import type { PlanActivity, SpendPlan, SpendPlanItem, Transaction } from '@/lib/type';
import type { Dictionary, Locale } from '@/lib/i18n';
import { dateLocales } from './date';

export type SpendPlanSummary = {
  /** Sum of planned estimates (extras have none). */
  estimate: number;
  /** Sum of all filled-in actuals, planned items + extras. */
  actual: number;
  /** Actual cost of unplanned extras only. */
  extras: number;
  /**
   * Planned − actual, counting only items already filled in (plus extras), so an
   * item you haven't checked yet doesn't look like money saved.
   * Positive = money left over, negative = overspent.
   */
  diff: number;
  /** Planned items that have an actual filled in. */
  checked: number;
  /** Planned items in total. */
  planned: number;
  /** True once at least one actual (or extra) has been entered. */
  hasActuals: boolean;
  /** Paid ahead of the trip (deposits), across all items. */
  deposit: number;
  /** Best guess of the full cost: each item's actual if known, else its estimate. */
  expected: number;
  /** Still to pay: expected − deposits (never below 0). */
  remaining: number;
  /** expected ÷ people, rounded. */
  perPerson: number;
};

export function summarizeSpendPlan(
  plan: Pick<SpendPlan, 'items'> & { people?: number },
): SpendPlanSummary {
  let estimate = 0;
  let deposit = 0;
  let expected = 0;
  let checkedEstimate = 0;
  let actual = 0;
  let extras = 0;
  let checked = 0;
  let planned = 0;
  for (const item of plan.items) {
    deposit += item.deposit ?? 0;
    expected += item.actual ?? (item.isExtra ? 0 : item.estimate);
    if (item.isExtra) {
      extras += item.actual ?? 0;
    } else {
      planned += 1;
      estimate += item.estimate;
      if (item.actual !== null) {
        checked += 1;
        checkedEstimate += item.estimate;
      }
    }
    actual += item.actual ?? 0;
  }
  return {
    estimate,
    actual,
    extras,
    diff: checkedEstimate - actual,
    checked,
    planned,
    hasActuals: checked > 0 || extras > 0,
    deposit,
    expected,
    remaining: Math.max(0, expected - deposit),
    perPerson: Math.round(expected / Math.max(1, plan.people ?? 1)),
  };
}

/** Fills fields added later (deposit, people, itinerary, checklist) on plans saved before them. */
export function normalizeSpendPlan(plan: SpendPlan): SpendPlan {
  return {
    ...plan,
    people: Math.max(1, plan.people ?? 1),
    items: (plan.items ?? []).map((item) => ({ ...item, deposit: item.deposit ?? 0 })),
    activities: plan.activities ?? [],
    checklist: plan.checklist ?? [],
  };
}

/** Longest itinerary shown day by day; longer ranges are cut here. */
export const MAX_PLAN_DAYS = 60;

/** Every day of the plan, start to end ("YYYY-MM-DD"). One-day plans have one. */
export function planDays(plan: Pick<SpendPlan, 'startDate' | 'endDate'>): string[] {
  const start = parse(plan.startDate, 'yyyy-MM-dd', new Date());
  const last = plan.endDate && plan.endDate > plan.startDate ? plan.endDate : plan.startDate;
  const count = Math.min(
    MAX_PLAN_DAYS,
    differenceInCalendarDays(parse(last, 'yyyy-MM-dd', new Date()), start) + 1,
  );
  return Array.from({ length: count }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

/** A stay with a check-out day after its check-in: shows up on both days and the nights between. */
export function isOvernightStay(activity: PlanActivity): boolean {
  return activity.kind === 'stay' && Boolean(activity.endDate && activity.endDate > activity.date);
}

/**
 * Transport with somewhere to leave from or an arrival time: a bus, train or
 * flight there or back, rather than a quick ride across town.
 */
export function isJourney(activity: PlanActivity): boolean {
  return activity.kind === 'move' && Boolean(activity.from || activity.endTime || activity.endDate);
}

/** A journey that arrives on a later day than it leaves (night bus, long flight). */
export function isOvernightJourney(activity: PlanActivity): boolean {
  return isJourney(activity) && Boolean(activity.endDate && activity.endDate > activity.date);
}

/**
 * One line of a day's itinerary. Most entries are a single `visit`. An overnight
 * stay becomes a `checkIn` on its first day and a `checkOut` on its last; a
 * journey is a `depart` (with its arrival when that is the same day), plus an
 * `arrive` on a later day.
 */
export type ItineraryStop = {
  key: string;
  activity: PlanActivity;
  role: 'visit' | 'checkIn' | 'checkOut' | 'depart' | 'arrive';
  date: string;
  time?: string;
  done: boolean;
};

export type ItineraryDay = {
  date: string;
  stops: ItineraryStop[];
  /** Where the night before was spent (the day starts there). */
  wakeAt?: PlanActivity;
  /** Where tonight is spent (the day ends there). */
  sleepAt?: PlanActivity;
};

/** Stops of an activity: two for an overnight stay or night journey, else one. */
export function activityStops(activity: PlanActivity): ItineraryStop[] {
  const { id, date, time, done } = activity;
  const twoDays = isOvernightStay(activity) || isOvernightJourney(activity);
  const first: ItineraryStop['role'] =
    activity.kind === 'stay' && twoDays ? 'checkIn' : isJourney(activity) ? 'depart' : 'visit';
  if (!twoDays) return [{ key: id, activity, role: first, date, time, done }];
  const stay = activity.kind === 'stay';
  return [
    { key: `${id}:${stay ? 'in' : 'go'}`, activity, role: first, date, time, done },
    {
      key: `${id}:${stay ? 'out' : 'arrive'}`,
      activity,
      role: stay ? 'checkOut' : 'arrive',
      date: activity.endDate as string,
      time: activity.endTime,
      done: Boolean(activity.endDone),
    },
  ];
}

/** Timed stops in time order first, then untimed ones in the order they were added. */
function sortStops(stops: ItineraryStop[]): ItineraryStop[] {
  return stops
    .map((stop, index) => ({ stop, index }))
    .sort((a, b) => {
      const ta = a.stop.time;
      const tb = b.stop.time;
      if (ta && tb && ta !== tb) return ta.localeCompare(tb);
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      return a.index - b.index;
    })
    .map(({ stop }) => stop);
}

/**
 * The itinerary as one list per day, with each day's lodging before and after.
 * Stops whose date falls outside the plan (after its dates were changed) come
 * back in `unscheduled` so nothing is lost.
 */
export function itineraryByDay(plan: Pick<SpendPlan, 'startDate' | 'endDate' | 'activities'>): {
  days: ItineraryDay[];
  unscheduled: ItineraryStop[];
} {
  const dates = planDays(plan);
  const byDate = new Map<string, ItineraryStop[]>(dates.map((d) => [d, []]));
  const unscheduled: ItineraryStop[] = [];
  for (const activity of plan.activities) {
    for (const stop of activityStops(activity)) {
      const list = byDate.get(stop.date);
      if (list) list.push(stop);
      else unscheduled.push(stop);
    }
  }
  const stays = plan.activities.filter(isOvernightStay);
  return {
    days: dates.map((date) => ({
      date,
      stops: sortStops(byDate.get(date) ?? []),
      // Night of `date`: check-in on or before it, check-out after it.
      sleepAt: stays.find((s) => s.date <= date && date < (s.endDate as string)),
      // Night before `date`: check-in before it, check-out on or after it.
      wakeAt: stays.find((s) => s.date < date && date <= (s.endDate as string)),
    })),
    unscheduled: sortStops(unscheduled),
  };
}

/** Path that joins a plan to edit it together (needs an account or guest). */
export function joinPath(inviteId: string): string {
  return `/join/${inviteId}`;
}

/** Path of a plan's public read-only page. */
export function sharePath(shareId: string): string {
  return `/share/${shareId}`;
}

/** estimate − actual for one planned line, or null while it isn't filled in. */
export function itemDiff(item: SpendPlanItem): number | null {
  if (item.isExtra || item.actual === null) return null;
  return item.estimate - item.actual;
}

export type SpendPlanPhase = 'upcoming' | 'review' | 'done';

/** upcoming = still ahead, review = date has passed but not closed out, done = closed. */
export function spendPlanPhase(plan: SpendPlan, today: string): SpendPlanPhase {
  if (plan.status === 'done') return 'done';
  return plan.startDate > today ? 'upcoming' : 'review';
}

/** Transactions for every item with a real cost, dated on the plan's last day. */
export function spendPlanTransactions(plan: SpendPlan): Transaction[] {
  const date = plan.endDate && plan.endDate > plan.startDate ? plan.endDate : plan.startDate;
  const createdAt = new Date().toISOString();
  return plan.items
    .filter((item) => (item.actual ?? 0) > 0)
    .map((item) => ({
      id: `t-${crypto.randomUUID()}`,
      categoryId: item.categoryId,
      amount: item.actual ?? 0,
      type: 'expense' as const,
      date,
      note: `${plan.title} · ${item.name}`,
      spendPlanId: plan.id,
      createdAt,
    }));
}

/** Whole days from today until the plan starts (0 = today, negative = started). */
export function daysUntilPlan(plan: Pick<SpendPlan, 'startDate'>): number {
  return differenceInCalendarDays(parse(plan.startDate, 'yyyy-MM-dd', new Date()), new Date());
}

/** Review (needs checking) first, then the nearest upcoming ones. */
export function openSpendPlans(plans: SpendPlan[], today: string): SpendPlan[] {
  const review = plans
    .filter((p) => spendPlanPhase(p, today) === 'review')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const upcoming = plans
    .filter((p) => spendPlanPhase(p, today) === 'upcoming')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return [...review, ...upcoming];
}

const PLAN_DATE_PATTERNS: Record<Locale, { full: string; short: string }> = {
  vi: { full: 'd/M/yyyy', short: 'd/M' },
  en: { full: 'MMM d, yyyy', short: 'MMM d' },
  ko: { full: 'yyyy년 M월 d일', short: 'M월 d일' },
};

/** "21/11 – 23/11/2026" (vi), "Nov 21 – Nov 23, 2026" (en), "11월 21일 – 11월 23일" (ko). */
export function formatPlanDates(
  plan: Pick<SpendPlan, 'startDate' | 'endDate'>,
  locale: Locale,
): string {
  const start = parse(plan.startDate, 'yyyy-MM-dd', new Date());
  const opts = { locale: dateLocales[locale] };
  const { full, short } = PLAN_DATE_PATTERNS[locale];
  if (!plan.endDate || plan.endDate <= plan.startDate) return format(start, full, opts);
  const end = parse(plan.endDate, 'yyyy-MM-dd', new Date());
  // Korean reads naturally without repeating the year: "11월 21일 – 11월 23일".
  const endPattern = locale === 'ko' ? short : full;
  return `${format(start, short, opts)} – ${format(end, endPattern, opts)}`;
}

/** Starter item lists so a plan can be made in a couple of taps. */
export const SPEND_PLAN_TEMPLATES = [
  {
    key: 'outing',
    icon: 'outing',
    items: [
      { key: 'travel', categoryId: 'c-transport' },
      { key: 'food', categoryId: 'c-food' },
      { key: 'tickets', categoryId: 'c-fun' },
    ],
  },
  {
    key: 'trip',
    icon: 'luggage',
    items: [
      { key: 'travel', categoryId: 'c-transport' },
      { key: 'stay', categoryId: 'c-home' },
      { key: 'food', categoryId: 'c-food' },
      { key: 'tickets', categoryId: 'c-fun' },
      { key: 'gifts', categoryId: 'c-shop' },
    ],
  },
  {
    key: 'party',
    icon: 'party',
    items: [
      { key: 'food', categoryId: 'c-food' },
      { key: 'drinks', categoryId: 'c-food' },
      { key: 'decor', categoryId: 'c-shop' },
      { key: 'gifts', categoryId: 'c-shop' },
    ],
  },
  {
    key: 'shopping',
    icon: 'bag',
    items: [
      { key: 'clothes', categoryId: 'c-shop' },
      { key: 'household', categoryId: 'c-home' },
    ],
  },
] as const;

export type SpendPlanTemplateKey = (typeof SPEND_PLAN_TEMPLATES)[number]['key'];
export type SpendPlanItemKey = (typeof SPEND_PLAN_TEMPLATES)[number]['items'][number]['key'];

/** "Hôm nay" / "Ngày mai" / "Còn 18 ngày" for a plan that hasn't started yet. */
export function countdownLabel(
  days: number,
  t: Dictionary,
  tx: (template: string, vars?: Record<string, string | number>) => string,
): string {
  if (days <= 0) return t.spendPlans.today;
  if (days === 1) return t.spendPlans.tomorrow;
  return tx(t.spendPlans.inDays, { count: days });
}

const DAY_HEADER_PATTERNS: Record<Locale, string> = {
  vi: 'EEEE, d/M',
  en: 'EEEE, MMM d',
  ko: 'M월 d일 EEEE',
};

/** "Thứ Bảy, 21/11" / "Saturday, Nov 21" / "11월 21일 토요일" for a day of the itinerary. */
export function formatDayHeader(date: string, locale: Locale): string {
  const text = format(parse(date, 'yyyy-MM-dd', new Date()), DAY_HEADER_PATTERNS[locale], {
    locale: dateLocales[locale],
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Short "21/11" / "Nov 21" / "11월 21일" for day chips. */
export function formatDayShort(date: string, locale: Locale): string {
  return format(parse(date, 'yyyy-MM-dd', new Date()), PLAN_DATE_PATTERNS[locale].short, {
    locale: dateLocales[locale],
  });
}
