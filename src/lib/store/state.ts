/**
 * The app's whole data set (one array per database table) and the operations on it
 * as a whole: starting state, reset, legacy import and diffing for sync.
 */
import { COLLECTIONS, COLLECTION_NAMES, type SyncRequest } from '@/lib/api/collections';
import { normalizeTransportEntry } from '@/lib/helper/transport';
import type {
  Category,
  MonthBudget,
  MonthPlan,
  RecurringRule,
  SpendPlan,
  Transaction,
  TransportEntry,
  TransportMeter,
} from '@/lib/type';
import { buildSeedTransportMeters, createInitialState, DEFAULT_CATEGORIES } from './seed';

export type AppState = {
  categories: Category[];
  transactions: Transaction[];
  budgets: MonthBudget[];
  recurringRules: RecurringRule[];
  monthPlans: MonthPlan[];
  transportMeters: TransportMeter[];
  transportEntries: TransportEntry[];
  spendPlans: SpendPlan[];
};

export const EMPTY_STATE: AppState = {
  categories: [],
  transactions: [],
  budgets: [],
  recurringRules: [],
  monthPlans: [],
  transportMeters: [],
  transportEntries: [],
  spendPlans: [],
};

export type ResetScope =
  { kind: 'all' } | { kind: 'months'; months: string[]; transactions: boolean; budgets: boolean };

/** State after deleting data: everything (fresh account) or chosen kinds within months. */
export function applyReset(state: AppState, scope: ResetScope): AppState {
  if (scope.kind === 'all') return createStarterState();
  const inScope = (date: string) => scope.months.includes(date.slice(0, 7));
  return {
    ...state,
    transactions: scope.transactions
      ? state.transactions.filter((t) => !inScope(t.date))
      : state.transactions,
    // Daily transit logs are the source of their transactions, so they go together.
    transportEntries: scope.transactions
      ? state.transportEntries.filter((e) => !inScope(e.date))
      : state.transportEntries,
    budgets: scope.budgets
      ? state.budgets.filter((b) => !scope.months.includes(b.yearMonth))
      : state.budgets,
  };
}

/** What a brand-new account starts with: default categories and transit types, no data. */
export function createStarterState(): AppState {
  return {
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    budgets: [],
    recurringRules: [],
    monthPlans: [],
    transportMeters: buildSeedTransportMeters(),
    transportEntries: [],
    spendPlans: [],
  };
}

export function normalizeState(raw: Partial<AppState> | null | undefined): AppState {
  const fresh = createInitialState();
  if (!raw) return fresh;
  return {
    categories: raw.categories?.length ? raw.categories : fresh.categories,
    transactions: raw.transactions ?? [],
    budgets: raw.budgets ?? [],
    recurringRules: raw.recurringRules ?? [],
    monthPlans: raw.monthPlans ?? [],
    transportMeters: raw.transportMeters?.length ? raw.transportMeters : fresh.transportMeters,
    transportEntries: (raw.transportEntries ?? []).map(normalizeTransportEntry),
    spendPlans: raw.spendPlans ?? fresh.spendPlans,
  };
}

/**
 * Smallest change set that turns `from` into `to`: new or changed rows are
 * upserted, missing rows deleted. Rows are compared by their key and content.
 */
export function diffState(from: AppState, to: AppState): SyncRequest | null {
  const upserts: NonNullable<SyncRequest['upserts']> = {};
  const deletes: NonNullable<SyncRequest['deletes']> = {};
  let changed = false;

  for (const name of COLLECTION_NAMES) {
    const key = COLLECTIONS[name].key;
    const before = new Map<string, string>();
    for (const row of from[name] as unknown as Record<string, unknown>[]) {
      before.set(String(row[key]), JSON.stringify(row));
    }
    const seen = new Set<string>();
    const rowsToUpsert: unknown[] = [];
    for (const row of to[name] as unknown as Record<string, unknown>[]) {
      const k = String(row[key]);
      seen.add(k);
      if (before.get(k) !== JSON.stringify(row)) rowsToUpsert.push(row);
    }
    const keysToDelete = [...before.keys()].filter((k) => !seen.has(k));
    if (rowsToUpsert.length) upserts[name] = rowsToUpsert;
    if (keysToDelete.length) deletes[name] = keysToDelete;
    changed ||= rowsToUpsert.length > 0 || keysToDelete.length > 0;
  }
  return changed ? { upserts, deletes } : null;
}

export function isEmptyState(state: AppState) {
  return COLLECTION_NAMES.every((name) => state[name].length === 0);
}
