import { daysInMonth, inMonth, parseYearMonth } from './date';
import { format } from 'date-fns';
import type { RecurringRule, Transaction } from '@/lib/type';

function clampDay(yearMonth: string, dayOfMonth: number): number {
  const max = daysInMonth(yearMonth);
  return Math.min(Math.max(dayOfMonth, 1), max);
}

export function dateForRecurring(yearMonth: string, dayOfMonth: number): string {
  const day = clampDay(yearMonth, dayOfMonth);
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}

export function ruleAppliesToMonth(rule: RecurringRule, yearMonth: string): boolean {
  if (!rule.isActive) return false;
  if (yearMonth < rule.startMonth) return false;
  if (rule.endMonth && yearMonth > rule.endMonth) return false;
  return true;
}

export function hasRecurringInstance(
  transactions: Transaction[],
  ruleId: string,
  yearMonth: string,
): boolean {
  return transactions.some((t) => t.recurringRuleId === ruleId && inMonth(t.date, yearMonth));
}

export function buildRecurringTransaction(rule: RecurringRule, yearMonth: string): Transaction {
  return {
    id: `t-rec-${rule.id}-${yearMonth}`,
    categoryId: rule.categoryId,
    amount: rule.amount,
    type: rule.type,
    date: dateForRecurring(yearMonth, rule.dayOfMonth),
    note: rule.name,
    recurringRuleId: rule.id,
    createdAt: new Date().toISOString(),
  };
}

/** Returns new transactions that should be posted for the month (missing instances only). */
export function pendingRecurringTransactions(
  rules: RecurringRule[],
  transactions: Transaction[],
  yearMonth: string,
): Transaction[] {
  return rules
    .filter((rule) => ruleAppliesToMonth(rule, yearMonth))
    .filter((rule) => !hasRecurringInstance(transactions, rule.id, yearMonth))
    .map((rule) => buildRecurringTransaction(rule, yearMonth));
}

export function applyRecurringToMonths(
  rules: RecurringRule[],
  transactions: Transaction[],
  yearMonths: string[],
): Transaction[] {
  let next = [...transactions];
  for (const ym of yearMonths) {
    const pending = pendingRecurringTransactions(rules, next, ym);
    if (pending.length) next = [...pending, ...next];
  }
  return next;
}

export function monthsFromStartToCurrent(startMonth: string, currentMonth: string): string[] {
  if (startMonth > currentMonth) return [currentMonth];
  const months: string[] = [];
  let cursor = startMonth;
  // safety cap 120 months
  for (let i = 0; i < 120; i += 1) {
    months.push(cursor);
    if (cursor === currentMonth) break;
    const d = parseYearMonth(cursor);
    cursor = format(new Date(d.getFullYear(), d.getMonth() + 1, 1), 'yyyy-MM');
  }
  return months;
}

export function sumFixedForMonth(
  rules: RecurringRule[],
  yearMonth: string,
  type: 'expense' | 'income' = 'expense',
): number {
  return rules
    .filter((r) => ruleAppliesToMonth(r, yearMonth) && r.type === type)
    .reduce((s, r) => s + r.amount, 0);
}
