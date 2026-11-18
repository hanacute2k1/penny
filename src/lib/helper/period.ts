/**
 * Totals for any stretch of time (a month, a year, or dates the user picks):
 * what came in, what went out, the gap, spending by category and over time.
 */
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { daysInMonth } from './date';
import type { Transaction } from '@/lib/type';

/** Both ends included, as YYYY-MM-DD. */
export type Period = { from: string; to: string };

export type PeriodPoint = { key: string; income: number; expense: number };

export type PeriodSummary = {
  income: number;
  expense: number;
  /** income − expense: below zero is a deficit. */
  net: number;
  count: number;
  days: number;
  expensePerDay: number;
  /** Spending per category, biggest first. */
  byCategory: { categoryId: string; amount: number }[];
  /** One point per day (up to 62 days), else per month. */
  series: PeriodPoint[];
  unit: 'day' | 'month';
};

/** Longest period still drawn day by day. */
const MAX_DAILY = 62;

export function monthPeriod(yearMonth: string): Period {
  return {
    from: `${yearMonth}-01`,
    to: `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`,
  };
}

export function yearPeriod(year: number): Period {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** Puts the ends in order, so picking them backwards still works. */
export function orderPeriod(period: Period): Period {
  return period.from <= period.to ? period : { from: period.to, to: period.from };
}

export function summarizePeriod(transactions: Transaction[], input: Period): PeriodSummary {
  const period = orderPeriod(input);
  const days = differenceInCalendarDays(parseISO(period.to), parseISO(period.from)) + 1;
  const unit = days <= MAX_DAILY ? 'day' : 'month';
  const keyOf = (date: string) => (unit === 'day' ? date : date.slice(0, 7));

  const points = new Map<string, PeriodPoint>();
  if (unit === 'day') {
    for (let i = 0; i < days; i++) {
      const key = format(addDays(parseISO(period.from), i), 'yyyy-MM-dd');
      points.set(key, { key, income: 0, expense: 0 });
    }
  } else {
    let month = period.from.slice(0, 7);
    const last = period.to.slice(0, 7);
    while (month <= last) {
      points.set(month, { key: month, income: 0, expense: 0 });
      const [y, m] = month.split('-').map(Number);
      month = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    }
  }

  let income = 0;
  let expense = 0;
  let count = 0;
  const byCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.date < period.from || tx.date > period.to) continue;
    count += 1;
    const point = points.get(keyOf(tx.date));
    if (tx.type === 'income') {
      income += tx.amount;
      if (point) point.income += tx.amount;
    } else {
      expense += tx.amount;
      if (point) point.expense += tx.amount;
      byCategory.set(tx.categoryId, (byCategory.get(tx.categoryId) ?? 0) + tx.amount);
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    count,
    days,
    expensePerDay: Math.round(expense / days),
    byCategory: [...byCategory]
      .map(([categoryId, amount]) => ({ categoryId, amount }))
      .sort((a, b) => b.amount - a.amount),
    series: [...points.values()],
    unit,
  };
}
