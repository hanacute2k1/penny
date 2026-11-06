/**
 * Every change the app can make to its data, as pure functions: (state, args) → next state.
 * StoreContext runs them inside setState; nothing here touches React, the network or storage.
 *
 * Records that need a fresh id are built by the `new…` helpers *before* setState, so a
 * re-run updater (React Strict Mode) never produces two different ids.
 */
import { CATEGORY_IDS } from '@/lib/constants';
import { currentYearMonth } from '@/lib/helper/date';
import { pendingPlanTransactions } from '@/lib/helper/monthPlans';
import {
  applyRecurringToMonths,
  monthsFromStartToCurrent,
  pendingRecurringTransactions,
} from '@/lib/helper/recurring';
import { spendPlanTransactions } from '@/lib/helper/spendPlans';
import { legsNote, sumLegs } from '@/lib/helper/transport';
import type {
  Category,
  MonthBudget,
  MonthPlan,
  MonthPlanInput,
  RecurringInput,
  RecurringRule,
  SpendPlan,
  SpendPlanInput,
  SpendPlanItem,
  Transaction,
  TransactionInput,
  TransportEntry,
  TransportLeg,
  TransportMeter,
  TransportMeterInput,
} from '@/lib/type';
import { applyReset, type AppState, type ResetScope } from './state';

export type CategoryUpsert = Omit<Category, 'isArchived'> & { isArchived?: boolean };

const now = () => new Date().toISOString();
const clampDay = (day: number) => Math.min(28, Math.max(1, Math.round(day)));

/* ───────────── Auto-posting ───────────── */

/** Marks month plans as posted and prepends the transactions they produced. */
function postPlans(state: AppState, yearMonth: string, monthPlans = state.monthPlans): AppState {
  const { transactions: pending, planIds } = pendingPlanTransactions(
    monthPlans,
    state.transactions,
    yearMonth,
  );
  if (!pending.length && !planIds.length) return { ...state, monthPlans };
  return {
    ...state,
    transactions: pending.length ? [...pending, ...state.transactions] : state.transactions,
    monthPlans: monthPlans.map((p) => (planIds.includes(p.id) ? { ...p, isPosted: true } : p)),
  };
}

/** Posts this month's fixed costs and due planned costs that aren't recorded yet. */
export function withAutoPosts(state: AppState): AppState {
  const month = currentYearMonth();
  const transactions = applyRecurringToMonths(state.recurringRules, state.transactions, [month]);
  return postPlans({ ...state, transactions }, month);
}

export function ensureRecurringForMonth(s: AppState, yearMonth: string): AppState {
  const pending = pendingRecurringTransactions(s.recurringRules, s.transactions, yearMonth);
  if (!pending.length) return s;
  return { ...s, transactions: [...pending, ...s.transactions] };
}

/** Posts a month's due planned costs; months that haven't arrived yet are left alone. */
export function ensurePlansForMonth(s: AppState, yearMonth: string): AppState {
  if (yearMonth > currentYearMonth()) return s;
  const next = postPlans(s, yearMonth);
  // Same object back when nothing was due, so React skips the re-render.
  return next.transactions === s.transactions && next.monthPlans === s.monthPlans ? s : next;
}

/* ───────────── Transactions ───────────── */

export function newTransaction(input: TransactionInput): Transaction {
  return {
    id: `t-${crypto.randomUUID()}`,
    ...input,
    note: input.note?.trim() || undefined,
    createdAt: now(),
  };
}

export function addTransaction(s: AppState, tx: Transaction): AppState {
  return { ...s, transactions: [tx, ...s.transactions] };
}

export function updateTransaction(s: AppState, id: string, input: TransactionInput): AppState {
  return {
    ...s,
    transactions: s.transactions.map((t) =>
      t.id === id ? { ...t, ...input, note: input.note?.trim() || undefined } : t,
    ),
  };
}

export function deleteTransaction(s: AppState, id: string): AppState {
  return {
    ...s,
    transactions: s.transactions.filter((t) => t.id !== id),
    transportEntries: s.transportEntries.filter((e) => e.transactionId !== id),
  };
}

/* ───────────── Budgets ───────────── */

export function saveBudget(
  s: AppState,
  yearMonth: string,
  categories: MonthBudget['categories'],
): AppState {
  const exists = s.budgets.some((b) => b.yearMonth === yearMonth);
  const next: MonthBudget = { yearMonth, categories };
  return {
    ...s,
    budgets: exists
      ? s.budgets.map((b) => (b.yearMonth === yearMonth ? next : b))
      : [...s.budgets, next],
  };
}

export function restoreBudget(
  s: AppState,
  yearMonth: string,
  budget: MonthBudget | null,
): AppState {
  const others = s.budgets.filter((b) => b.yearMonth !== yearMonth);
  return { ...s, budgets: budget ? [...others, budget] : others };
}

export function resetData(s: AppState, scope: ResetScope): AppState {
  return applyReset(s, scope);
}

/* ───────────── Categories ───────────── */

export function upsertCategory(s: AppState, category: CategoryUpsert): AppState {
  const exists = s.categories.some((c) => c.id === category.id);
  const next: Category = { ...category, isArchived: category.isArchived ?? false };
  return {
    ...s,
    categories: exists
      ? s.categories.map((c) => (c.id === category.id ? next : c))
      : [...s.categories, next],
  };
}

export function archiveCategory(s: AppState, id: string): AppState {
  return {
    ...s,
    categories: s.categories.map((c) => (c.id === id ? { ...c, isArchived: true } : c)),
  };
}

/** Deletes an unused category; one with transactions is hidden instead so history stays intact. */
export function deleteCategory(s: AppState, id: string): AppState {
  const used = s.transactions.some((t) => t.categoryId === id);
  return used
    ? archiveCategory(s, id)
    : { ...s, categories: s.categories.filter((c) => c.id !== id) };
}

/* ───────────── Fixed costs (recurring rules) ───────────── */

export function newRecurring(input: RecurringInput): RecurringRule {
  return {
    id: `r-${crypto.randomUUID()}`,
    name: input.name.trim(),
    categoryId: input.categoryId,
    amount: input.amount,
    type: input.type,
    dayOfMonth: clampDay(input.dayOfMonth),
    startMonth: input.startMonth,
    endMonth: input.endMonth ?? null,
    isActive: input.isActive ?? true,
    createdAt: now(),
  };
}

export function addRecurring(s: AppState, rule: RecurringRule): AppState {
  const months = monthsFromStartToCurrent(rule.startMonth, currentYearMonth());
  return {
    ...s,
    recurringRules: [rule, ...s.recurringRules],
    transactions: applyRecurringToMonths([...s.recurringRules, rule], s.transactions, months),
  };
}

export function updateRecurring(s: AppState, id: string, input: RecurringInput): AppState {
  const recurringRules = s.recurringRules.map((r) =>
    r.id === id
      ? {
          ...r,
          name: input.name.trim(),
          categoryId: input.categoryId,
          amount: input.amount,
          type: input.type,
          dayOfMonth: clampDay(input.dayOfMonth),
          startMonth: input.startMonth,
          endMonth: input.endMonth ?? null,
          isActive: input.isActive ?? r.isActive,
        }
      : r,
  );
  const months = monthsFromStartToCurrent(input.startMonth, currentYearMonth());
  return {
    ...s,
    recurringRules,
    transactions: applyRecurringToMonths(recurringRules, s.transactions, months),
  };
}

/** Stops future auto-posts; transactions already posted stay. */
export function deleteRecurring(s: AppState, id: string): AppState {
  return { ...s, recurringRules: s.recurringRules.filter((r) => r.id !== id) };
}

export function toggleRecurring(s: AppState, id: string): AppState {
  const recurringRules = s.recurringRules.map((r) =>
    r.id === id ? { ...r, isActive: !r.isActive } : r,
  );
  const rule = recurringRules.find((r) => r.id === id);
  if (!rule?.isActive) return { ...s, recurringRules };
  return {
    ...s,
    recurringRules,
    transactions: applyRecurringToMonths(recurringRules, s.transactions, [currentYearMonth()]),
  };
}

/* ───────────── Month plans (one-off planned costs) ───────────── */

function monthPlanFields(input: MonthPlanInput) {
  return {
    title: input.title.trim(),
    note: input.note?.trim() || undefined,
    amount: input.amount,
    categoryId: input.categoryId,
    type: input.type,
    targetMonth: input.targetMonth,
    dayOfMonth: clampDay(input.dayOfMonth),
  };
}

export function newPlan(input: MonthPlanInput): MonthPlan {
  return {
    id: `p-${crypto.randomUUID()}`,
    ...monthPlanFields(input),
    isPosted: false,
    createdAt: now(),
  };
}

/** Adds the plan and, if its month has already arrived, posts it right away. */
export function addPlan(s: AppState, plan: MonthPlan): AppState {
  const monthPlans = [plan, ...s.monthPlans];
  if (plan.targetMonth > currentYearMonth()) return { ...s, monthPlans };
  return postPlans(s, plan.targetMonth, monthPlans);
}

/** Only plans that haven't been posted yet can change. */
export function updatePlan(s: AppState, id: string, input: MonthPlanInput): AppState {
  return {
    ...s,
    monthPlans: s.monthPlans.map((p) =>
      p.id === id && !p.isPosted ? { ...p, ...monthPlanFields(input) } : p,
    ),
  };
}

export function deletePlan(s: AppState, id: string): AppState {
  return { ...s, monthPlans: s.monthPlans.filter((p) => p.id !== id) };
}

/* ───────────── Transport ───────────── */

export function addTransportMeter(s: AppState, id: string, input: TransportMeterInput): AppState {
  const meter: TransportMeter = {
    id,
    name: input.name.trim(),
    icon: input.icon.trim() || 'car',
    sortOrder: Math.max(0, ...s.transportMeters.map((m) => m.sortOrder)) + 1,
    isArchived: false,
    createdAt: now(),
  };
  return { ...s, transportMeters: [...s.transportMeters, meter] };
}

export function updateTransportMeter(
  s: AppState,
  id: string,
  input: TransportMeterInput,
): AppState {
  return {
    ...s,
    transportMeters: s.transportMeters.map((m) =>
      m.id === id ? { ...m, name: input.name.trim(), icon: input.icon.trim() || m.icon } : m,
    ),
  };
}

export function archiveTransportMeter(s: AppState, id: string): AppState {
  return {
    ...s,
    transportMeters: s.transportMeters.map((m) => (m.id === id ? { ...m, isArchived: true } : m)),
  };
}

/**
 * Saves one day of trips for a meter. The day is mirrored by one expense transaction:
 * created, updated or removed together with the entry.
 */
export function setTransportDayLegs(
  s: AppState,
  meterId: string,
  date: string,
  rawLegs: Omit<TransportLeg, 'id'>[],
): AppState {
  const meter = s.transportMeters.find((m) => m.id === meterId);
  if (!meter) return s;
  const existing = s.transportEntries.find((e) => e.meterId === meterId && e.date === date);
  const legs: TransportLeg[] = rawLegs
    .map((leg, i) => ({
      id: `leg-${meterId}-${date}-${i}`,
      from: leg.from.trim(),
      to: leg.to.trim(),
      amount: Math.max(0, Math.round(leg.amount)),
    }))
    .filter((leg) => leg.amount > 0);
  const total = sumLegs(legs);

  if (total <= 0) {
    if (!existing) return s;
    return {
      ...s,
      transportEntries: s.transportEntries.filter((e) => e.id !== existing.id),
      transactions: s.transactions.filter((t) => t.id !== existing.transactionId),
    };
  }

  const note = legsNote(legs, meter.name);

  if (existing) {
    return {
      ...s,
      transportEntries: s.transportEntries.map((e) =>
        e.id === existing.id ? { ...e, amount: total, legs } : e,
      ),
      transactions: s.transactions.map((t) =>
        t.id === existing.transactionId
          ? {
              ...t,
              amount: total,
              note,
              date,
              categoryId: CATEGORY_IDS.transport,
              type: 'expense' as const,
              transportMeterId: meterId,
            }
          : t,
      ),
    };
  }

  const txId = `t-tm-${meterId}-${date}`;
  const entry: TransportEntry = {
    id: `te-${meterId}-${date}`,
    meterId,
    date,
    amount: total,
    legs,
    transactionId: txId,
    createdAt: now(),
  };
  const tx: Transaction = {
    id: txId,
    categoryId: CATEGORY_IDS.transport,
    amount: total,
    type: 'expense',
    date,
    note,
    transportMeterId: meterId,
    createdAt: now(),
  };
  return {
    ...s,
    transportEntries: [entry, ...s.transportEntries],
    transactions: [tx, ...s.transactions],
  };
}

/* ───────────── Spend plans (trips, events…) ───────────── */

function cleanSpendPlanInput(input: SpendPlanInput) {
  return {
    title: input.title.trim(),
    icon: input.icon,
    startDate: input.startDate,
    endDate: input.endDate && input.endDate > input.startDate ? input.endDate : undefined,
    note: input.note?.trim() || undefined,
    items: input.items
      // Drop blank rows, but never an extra that already has an amount.
      .filter((item) => item.name.trim() || (item.actual ?? 0) > 0)
      .map((item) => ({
        ...item,
        id: item.id ?? `spi-${crypto.randomUUID()}`,
        name: item.name.trim(),
        estimate: item.isExtra ? 0 : Math.max(0, item.estimate),
      })),
  };
}

export function newSpendPlan(input: SpendPlanInput): SpendPlan {
  return {
    id: `sp-${crypto.randomUUID()}`,
    ...cleanSpendPlanInput(input),
    status: 'planning',
    postedCount: 0,
    createdAt: now(),
  };
}

export function addSpendPlan(s: AppState, plan: SpendPlan): AppState {
  return { ...s, spendPlans: [plan, ...s.spendPlans] };
}

export function updateSpendPlan(s: AppState, id: string, input: SpendPlanInput): AppState {
  return {
    ...s,
    spendPlans: s.spendPlans.map((p) =>
      p.id === id ? { ...p, ...cleanSpendPlanInput(input) } : p,
    ),
  };
}

export function setSpendPlanItems(s: AppState, id: string, items: SpendPlanItem[]): AppState {
  return { ...s, spendPlans: s.spendPlans.map((p) => (p.id === id ? { ...p, items } : p)) };
}

/** Close out a plan: (re)post its actual costs as transactions and mark it done. */
export function settleSpendPlan(s: AppState, id: string): AppState {
  const plan = s.spendPlans.find((p) => p.id === id);
  if (!plan) return s;
  const posted = spendPlanTransactions(plan);
  return {
    ...s,
    transactions: [...posted, ...s.transactions.filter((t) => t.spendPlanId !== id)],
    spendPlans: s.spendPlans.map((p) =>
      p.id === id ? { ...p, status: 'done', postedCount: posted.length } : p,
    ),
  };
}

export function reopenSpendPlan(s: AppState, id: string): AppState {
  return {
    ...s,
    spendPlans: s.spendPlans.map((p) => (p.id === id ? { ...p, status: 'planning' } : p)),
  };
}

/** Removes the plan only; transactions already posted from it stay. */
export function deleteSpendPlan(s: AppState, id: string): AppState {
  return { ...s, spendPlans: s.spendPlans.filter((p) => p.id !== id) };
}
