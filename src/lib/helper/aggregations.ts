import { inMonth } from './date';
import type {
  Category,
  CategoryProgress,
  MonthBudget,
  MonthDelta,
  MonthView,
  Transaction,
  YearMonthSummary,
  YearOverview,
} from '@/lib/type';

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function buildDelta(
  current: { income: number; expense: number; balance: number },
  previous: { income: number; expense: number; balance: number } | null,
): MonthDelta {
  if (!previous) {
    return {
      expenseDelta: null,
      incomeDelta: null,
      balanceDelta: null,
      expenseDeltaPercent: null,
      incomeDeltaPercent: null,
    };
  }
  return {
    expenseDelta: current.expense - previous.expense,
    incomeDelta: current.income - previous.income,
    balanceDelta: current.balance - previous.balance,
    expenseDeltaPercent: percentChange(current.expense, previous.expense),
    incomeDeltaPercent: percentChange(current.income, previous.income),
  };
}

export function sumByType(
  transactions: Transaction[],
  yearMonth: string,
  type: 'expense' | 'income',
): number {
  return transactions
    .filter((t) => t.type === type && inMonth(t.date, yearMonth))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function spentByCategory(
  transactions: Transaction[],
  yearMonth: string,
  categoryId: string,
): number {
  return transactions
    .filter(
      (t) => t.type === 'expense' && t.categoryId === categoryId && inMonth(t.date, yearMonth),
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function buildMonthView(
  yearMonth: string,
  categories: Category[],
  transactions: Transaction[],
  budget: MonthBudget | undefined,
): MonthView {
  const income = sumByType(transactions, yearMonth, 'income');
  const expense = sumByType(transactions, yearMonth, 'expense');
  const expenseCats = categories
    .filter((c) => c.type === 'expense' && !c.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const limitMap = new Map((budget?.categories ?? []).map((b) => [b.categoryId, b.limitAmount]));

  const categoryProgress: CategoryProgress[] = expenseCats.map((c) => {
    const limit = limitMap.get(c.id) ?? 0;
    const spent = spentByCategory(transactions, yearMonth, c.id);
    const remaining = limit - spent;
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : spent > 0 ? 100 : 0;
    return {
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      limit,
      spent,
      remaining,
      percent,
    };
  });

  const budgetTotal = categoryProgress.reduce((s, c) => s + c.limit, 0);
  const budgetRemaining = budgetTotal - expense;
  const budgetPercent = budgetTotal > 0 ? Math.round((expense / budgetTotal) * 100) : 0;

  const recentTransactions = transactions
    .filter((t) => inMonth(t.date, yearMonth))
    .sort((a, b) =>
      a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
    )
    .slice(0, 8);

  return {
    yearMonth,
    income,
    expense,
    remainingCashflow: income - expense,
    budgetTotal,
    budgetRemaining,
    budgetPercent,
    categories: categoryProgress,
    recentTransactions,
  };
}

export function dailyExpenseSeries(
  transactions: Transaction[],
  yearMonth: string,
  days: number,
): number[] {
  const series = Array.from({ length: days }, () => 0);
  for (const t of transactions) {
    if (t.type !== 'expense' || !inMonth(t.date, yearMonth)) continue;
    const day = Number(t.date.slice(8, 10));
    if (day >= 1 && day <= days) series[day - 1] += t.amount;
  }
  return series;
}

export function buildYearOverview(
  year: number,
  transactions: Transaction[],
  opts?: { upToMonth?: string },
): YearOverview {
  const months: YearMonthSummary[] = [];
  const upTo = opts?.upToMonth;

  for (let month = 1; month <= 12; month += 1) {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const isFuture = Boolean(upTo && yearMonth > upTo);
    const income = isFuture ? 0 : sumByType(transactions, yearMonth, 'income');
    const expense = isFuture ? 0 : sumByType(transactions, yearMonth, 'expense');
    const balance = income - expense;
    const hasActivity = !isFuture && (income > 0 || expense > 0);
    const previous =
      month === 1 || isFuture
        ? null
        : {
            income: months[month - 2].income,
            expense: months[month - 2].expense,
            balance: months[month - 2].balance,
          };

    months.push({
      yearMonth,
      month,
      income,
      expense,
      balance,
      hasActivity,
      delta: buildDelta({ income, expense, balance }, previous && !isFuture ? previous : null),
    });
  }

  const active = months.filter((m) => m.hasActivity && (!upTo || m.yearMonth <= upTo));
  const totals = active.reduce(
    (acc, m) => ({
      income: acc.income + m.income,
      expense: acc.expense + m.expense,
      balance: acc.balance + m.balance,
    }),
    { income: 0, expense: 0, balance: 0 },
  );
  const count = active.length || 1;

  const highestExpenseMonth =
    active.length === 0 ? null : active.reduce((best, m) => (m.expense > best.expense ? m : best));
  const lowestExpenseMonth =
    active.length === 0 ? null : active.reduce((best, m) => (m.expense < best.expense ? m : best));
  const bestBalanceMonth =
    active.length === 0 ? null : active.reduce((best, m) => (m.balance > best.balance ? m : best));
  const worstBalanceMonth =
    active.length === 0 ? null : active.reduce((best, m) => (m.balance < best.balance ? m : best));

  return {
    year,
    months,
    totals,
    averages: {
      income: Math.round(totals.income / count),
      expense: Math.round(totals.expense / count),
      balance: Math.round(totals.balance / count),
    },
    activeMonths: active.length,
    highestExpenseMonth,
    lowestExpenseMonth,
    bestBalanceMonth,
    worstBalanceMonth,
  };
}
