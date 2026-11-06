'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchRemoteState, pushChanges, UnauthorizedError } from '@/apis/data';
import { STORAGE_KEYS, SYNC } from '@/lib/constants';
import { buildMonthView } from '@/lib/helper/aggregations';
import { previousYearMonth } from '@/lib/helper/date';
import * as actions from '@/lib/store/actions';
import {
  createStarterState,
  diffState,
  EMPTY_STATE,
  isEmptyState,
  normalizeState,
  type AppState,
  type ResetScope,
} from '@/lib/store/state';
import type {
  MonthBudget,
  MonthPlanInput,
  MonthView,
  RecurringInput,
  SpendPlanInput,
  SpendPlanItem,
  TransactionInput,
  TransportLeg,
  TransportMeterInput,
} from '@/lib/type';

export type { ResetScope } from '@/lib/store/state';
export type SyncStatus = 'idle' | 'saving' | 'error';

type StoreValue = AppState & {
  ready: boolean;
  /** Set when the first load from the server failed. */
  loadError: boolean;
  reload: () => void;
  syncStatus: SyncStatus;
  /** Data saved on this device before sign-in that can be moved into the account. */
  importOffer: boolean;
  acceptImport: () => void;
  declineImport: () => void;
  getMonthView: (yearMonth: string) => MonthView;
  getBudget: (yearMonth: string) => MonthBudget | undefined;
  /** Copies last month's limits; returns false (and changes nothing) if there are none. */
  copyBudgetFromPrevious: (yearMonth: string) => boolean;
} & StoreActions;

type StoreActions = {
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  saveBudget: (yearMonth: string, categories: MonthBudget['categories']) => void;
  /** Puts a month's budget back exactly as given; null removes it (used by Undo). */
  restoreBudget: (yearMonth: string, budget: MonthBudget | null) => void;
  /** Deletes data: everything (back to a fresh account) or chosen kinds within months. */
  resetData: (scope: ResetScope) => void;
  upsertCategory: (category: actions.CategoryUpsert) => void;
  archiveCategory: (id: string) => void;
  /** Deletes an unused category; one with transactions is hidden instead so history stays intact. */
  deleteCategory: (id: string) => void;
  addRecurring: (input: RecurringInput) => void;
  updateRecurring: (id: string, input: RecurringInput) => void;
  deleteRecurring: (id: string) => void;
  toggleRecurring: (id: string) => void;
  ensureRecurringForMonth: (yearMonth: string) => void;
  addPlan: (input: MonthPlanInput) => void;
  updatePlan: (id: string, input: MonthPlanInput) => void;
  deletePlan: (id: string) => void;
  ensurePlansForMonth: (yearMonth: string) => void;
  addTransportMeter: (input: TransportMeterInput) => string;
  updateTransportMeter: (id: string, input: TransportMeterInput) => void;
  archiveTransportMeter: (id: string) => void;
  setTransportDayLegs: (meterId: string, date: string, legs: Omit<TransportLeg, 'id'>[]) => void;
  addSpendPlan: (input: SpendPlanInput) => string;
  updateSpendPlan: (id: string, input: SpendPlanInput) => void;
  setSpendPlanItems: (id: string, items: SpendPlanItem[]) => void;
  /** Close out a plan: (re)post its actual costs as transactions and mark it done. */
  settleSpendPlan: (id: string) => void;
  reopenSpendPlan: (id: string) => void;
  /** Removes the plan only; transactions already posted from it stay. */
  deleteSpendPlan: (id: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

/** Data an older version of the app kept in localStorage, before accounts existed. */
function readLegacyState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.legacyData);
    return raw ? normalizeState(JSON.parse(raw) as Partial<AppState>) : null;
  } catch {
    return null;
  }
}

/** Full page load on purpose: it drops every bit of in-memory account data. */
function goToLogin() {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
}

/**
 * Holds the signed-in user's data. Every edit shows at once (optimistic) and is
 * saved shortly after: the store diffs against what the server last confirmed
 * and sends only the changed rows.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [legacy, setLegacy] = useState<AppState | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);
  const pathname = usePathname();
  const signedOutPage = pathname.startsWith('/login') || pathname.startsWith('/auth');

  /** Last state the server is known to have; edits are diffed against it. */
  const confirmed = useRef<AppState>(EMPTY_STATE);
  const latest = useRef<AppState>(EMPTY_STATE);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef<number>(SYNC.firstRetryMs);
  /** Lets flush re-run itself (follow-up edits, retries) without referencing itself. */
  const flushAgain = useRef<() => void>(() => {});

  /* ───────────── Load ───────────── */

  useEffect(() => {
    if (signedOutPage || ready) return;
    let cancelled = false;
    fetchRemoteState()
      .then((remote) => {
        if (cancelled) return;
        confirmed.current = remote;
        let next = remote;
        if (isEmptyState(remote)) {
          next = createStarterState();
          setLegacy(readLegacyState());
        }
        setState(actions.withAutoPosts(next));
        setLoadError(false);
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof UnauthorizedError) goToLogin();
        else setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedOutPage, ready, loadNonce]);

  /* ───────────── Save ───────────── */

  /** Send whatever differs from the server; one request at a time, retried with backoff. */
  const flush = useCallback(async (opts?: { keepalive?: boolean }) => {
    if (saving.current) return;
    const target = latest.current;
    const changes = diffState(confirmed.current, target);
    if (!changes) {
      setSyncStatus('idle');
      return;
    }
    saving.current = true;
    setSyncStatus('saving');
    try {
      await pushChanges(changes, opts);
      confirmed.current = target;
      retryDelay.current = SYNC.firstRetryMs;
      saving.current = false;
      if (latest.current !== target) flushAgain.current();
      else setSyncStatus('idle');
    } catch (error) {
      saving.current = false;
      if (error instanceof UnauthorizedError) return goToLogin();
      setSyncStatus('error');
      timer.current = setTimeout(() => flushAgain.current(), retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, SYNC.maxRetryMs);
    }
  }, []);

  useEffect(() => {
    flushAgain.current = () => void flush();
  }, [flush]);

  // Edits in a burst share one request.
  useEffect(() => {
    if (!ready) return;
    latest.current = state;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SYNC.saveDelayMs);
  }, [state, ready, flush]);

  // Don't lose the last edit when the tab is closed or hidden.
  useEffect(() => {
    if (!ready) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush({ keepalive: true });
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [ready, flush]);

  /* ───────────── Account-level actions ───────────── */

  const reload = useCallback(() => {
    setLoadError(false);
    setLoadNonce((n) => n + 1);
  }, []);

  const acceptImport = useCallback(() => {
    if (legacy) setState(actions.withAutoPosts(legacy));
    localStorage.removeItem(STORAGE_KEYS.legacyData);
    setLegacy(null);
  }, [legacy]);

  const declineImport = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.legacyData);
    setLegacy(null);
  }, []);

  /* ───────────── Data actions (see lib/store/actions.ts) ───────────── */

  // setState never changes, so these are created once.
  const dataActions = useMemo<StoreActions>(() => {
    const run =
      <A extends unknown[]>(fn: (s: AppState, ...args: A) => AppState) =>
      (...args: A) =>
        setState((s) => fn(s, ...args));

    return {
      addTransaction: (input) => {
        const tx = actions.newTransaction(input);
        setState((s) => actions.addTransaction(s, tx));
      },
      updateTransaction: run(actions.updateTransaction),
      deleteTransaction: run(actions.deleteTransaction),
      saveBudget: run(actions.saveBudget),
      restoreBudget: run(actions.restoreBudget),
      resetData: run(actions.resetData),
      upsertCategory: run(actions.upsertCategory),
      archiveCategory: run(actions.archiveCategory),
      deleteCategory: run(actions.deleteCategory),
      addRecurring: (input) => {
        const rule = actions.newRecurring(input);
        setState((s) => actions.addRecurring(s, rule));
      },
      updateRecurring: run(actions.updateRecurring),
      deleteRecurring: run(actions.deleteRecurring),
      toggleRecurring: run(actions.toggleRecurring),
      ensureRecurringForMonth: run(actions.ensureRecurringForMonth),
      addPlan: (input) => {
        const plan = actions.newPlan(input);
        setState((s) => actions.addPlan(s, plan));
      },
      updatePlan: run(actions.updatePlan),
      deletePlan: run(actions.deletePlan),
      ensurePlansForMonth: run(actions.ensurePlansForMonth),
      addTransportMeter: (input) => {
        const id = `tm-${crypto.randomUUID()}`;
        setState((s) => actions.addTransportMeter(s, id, input));
        return id;
      },
      updateTransportMeter: run(actions.updateTransportMeter),
      archiveTransportMeter: run(actions.archiveTransportMeter),
      setTransportDayLegs: run(actions.setTransportDayLegs),
      addSpendPlan: (input) => {
        const plan = actions.newSpendPlan(input);
        setState((s) => actions.addSpendPlan(s, plan));
        return plan.id;
      },
      updateSpendPlan: run(actions.updateSpendPlan),
      setSpendPlanItems: run(actions.setSpendPlanItems),
      settleSpendPlan: run(actions.settleSpendPlan),
      reopenSpendPlan: run(actions.reopenSpendPlan),
      deleteSpendPlan: run(actions.deleteSpendPlan),
    };
  }, []);

  /* ───────────── Reads ───────────── */

  const getBudget = useCallback(
    (yearMonth: string) => state.budgets.find((b) => b.yearMonth === yearMonth),
    [state.budgets],
  );

  const getMonthView = useCallback(
    (yearMonth: string) =>
      buildMonthView(yearMonth, state.categories, state.transactions, getBudget(yearMonth)),
    [state.categories, state.transactions, getBudget],
  );

  const copyBudgetFromPrevious = useCallback(
    (yearMonth: string) => {
      const prev = getBudget(previousYearMonth(yearMonth));
      if (!prev) return false;
      dataActions.saveBudget(
        yearMonth,
        prev.categories.map((c) => ({ ...c })),
      );
      return true;
    },
    [getBudget, dataActions],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ...dataActions,
      ready,
      loadError,
      reload,
      syncStatus,
      importOffer: legacy !== null,
      acceptImport,
      declineImport,
      getMonthView,
      getBudget,
      copyBudgetFromPrevious,
    }),
    [
      state,
      dataActions,
      ready,
      loadError,
      reload,
      syncStatus,
      legacy,
      acceptImport,
      declineImport,
      getMonthView,
      getBudget,
      copyBudgetFromPrevious,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
