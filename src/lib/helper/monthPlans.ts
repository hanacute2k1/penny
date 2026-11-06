import { daysInMonth, inMonth } from './date';
import type { MonthPlan, Transaction } from '@/lib/type';

function clampDay(yearMonth: string, dayOfMonth: number): number {
  const max = daysInMonth(yearMonth);
  return Math.min(Math.max(dayOfMonth, 1), max);
}

export function planDate(yearMonth: string, dayOfMonth: number): string {
  const day = clampDay(yearMonth, dayOfMonth);
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}

export function plansForMonth(plans: MonthPlan[], yearMonth: string): MonthPlan[] {
  return plans
    .filter((p) => p.targetMonth === yearMonth)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.createdAt.localeCompare(b.createdAt));
}

export function upcomingPlans(plans: MonthPlan[], fromMonth: string): MonthPlan[] {
  return plans
    .filter((p) => p.targetMonth >= fromMonth && !p.isPosted)
    .sort((a, b) =>
      a.targetMonth === b.targetMonth
        ? a.dayOfMonth - b.dayOfMonth
        : a.targetMonth.localeCompare(b.targetMonth),
    );
}

export function pendingPlanTransactions(
  plans: MonthPlan[],
  transactions: Transaction[],
  yearMonth: string,
): { transactions: Transaction[]; planIds: string[] } {
  const due = plans.filter((p) => p.targetMonth === yearMonth && !p.isPosted);

  const txs: Transaction[] = [];
  const planIds: string[] = [];

  for (const plan of due) {
    const already = transactions.some(
      (t) =>
        t.planId === plan.id ||
        (t.note === plan.title && t.amount === plan.amount && inMonth(t.date, yearMonth)),
    );
    if (already) {
      planIds.push(plan.id);
      continue;
    }
    const tx: Transaction = {
      id: `t-plan-${plan.id}`,
      categoryId: plan.categoryId,
      amount: plan.amount,
      type: plan.type,
      date: planDate(yearMonth, plan.dayOfMonth),
      note: plan.title,
      planId: plan.id,
      createdAt: new Date().toISOString(),
    };
    txs.push(tx);
    planIds.push(plan.id);
  }

  return { transactions: txs, planIds };
}

export function sumPlansForMonth(
  plans: MonthPlan[],
  yearMonth: string,
  type: 'expense' | 'income' = 'expense',
): number {
  return plansForMonth(plans, yearMonth)
    .filter((p) => p.type === type)
    .reduce((s, p) => s + p.amount, 0);
}
