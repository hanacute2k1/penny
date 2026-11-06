import { differenceInCalendarDays, format, parse } from 'date-fns';
import type { SpendPlan, SpendPlanItem, Transaction } from '@/lib/type';
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
};

export function summarizeSpendPlan(plan: Pick<SpendPlan, 'items'>): SpendPlanSummary {
  let estimate = 0;
  let checkedEstimate = 0;
  let actual = 0;
  let extras = 0;
  let checked = 0;
  let planned = 0;
  for (const item of plan.items) {
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
  };
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
