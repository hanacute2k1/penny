'use client';

import type { CurrencyCode } from '@/lib/currency';
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
import {
  fetchTeamPlans,
  joinTeamPlan,
  removeTeamPerson,
  saveTeamPlan,
  TeamPlanRequestError,
} from '@/apis/teamPlans';
import { mergePlan, same } from '@/lib/helper/planMerge';
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
  PlanActivityInput,
  SpendPlan,
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
} & StoreActions &
  TeamActions;

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
  addPlanActivity: (planId: string, input: PlanActivityInput) => void;
  updatePlanActivity: (planId: string, activityId: string, input: PlanActivityInput) => void;
  togglePlanActivity: (planId: string, activityId: string, part?: 'main' | 'end') => void;
  /** New order for some stops; they swap time slots, the day's schedule stays. */
  reorderPlanStops: (planId: string, orderedIds: string[]) => void;
  removePlanActivity: (planId: string, activityId: string) => void;
  addChecklistItem: (planId: string, text: string) => void;
  toggleChecklistItem: (planId: string, itemId: string) => void;
  removeChecklistItem: (planId: string, itemId: string) => void;
  /** Turns the public read-only link on and returns its id. */
  /** Turns on the read-only link; amounts there show in `currency`. */
  sharePlan: (planId: string, currency: CurrencyCode) => string;
  unsharePlan: (planId: string) => void;
};

/** Planning together: these talk to the server, so they are async. */
type TeamActions = {
  /** Starts planning with friends; returns the invite link id. */
  startTeamPlan: (planId: string, currency: CurrencyCode) => string;
  /** A new invite link; the old one stops working. People already in stay. */
  resetTeamInvite: (planId: string) => void;
  /** No invite link; people already in stay. */
  stopTeamInvite: (planId: string) => void;
  /** Joins with an invite link; resolves to the plan id (null if the link is dead). */
  joinTeamPlan: (inviteId: string) => Promise<string | null>;
  /** Leaves a plan a friend shared; it disappears from my list. */
  leaveTeamPlan: (planId: string, ownerId: string) => Promise<void>;
  /** Pulls friends' latest edits now (also happens every few seconds). */
  refreshTeamPlans: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

/** How often friends' edits to shared plans are fetched while the app is visible. */
const TEAM_PULL_MS = 8_000;

/** A plan planned together: mine with friends invited, or a friend's I joined. */
const isTeamPlan = (plan: SpendPlan) => Boolean(plan.ownerId || plan.collaborative);
/** Plan ids are unique per account, so a friend's plan is told apart by its owner. */
const planKey = (plan: Pick<SpendPlan, 'id' | 'ownerId'>) => `${plan.ownerId ?? ''}:${plan.id}`;

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
  // Pages that work without an account (a shared plan is opened by anyone with the link).
  const signedOutPage =
    pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/share');

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
        teamBase.current = new Map(
          remote.spendPlans.filter(isTeamPlan).map((plan) => [planKey(plan), plan]),
        );
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

  /* ───────────── Shared plans (planned together) ───────────── */

  /**
   * Each shared plan as the server last returned it. My edits are what differs
   * from it; they're sent with it as `base` so the server can merge them into
   * friends' edits.
   */
  const teamBase = useRef(new Map<string, SpendPlan>());
  const teamSaving = useRef(new Set<string>());
  const teamRetry = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Lets a failed save retry itself later without referencing itself. */
  const flushTeamAgain = useRef<() => void>(() => {});

  const flushTeam = useCallback(() => {
    for (const plan of latest.current.spendPlans) {
      if (!isTeamPlan(plan)) continue;
      const key = planKey(plan);
      if (teamSaving.current.has(key)) continue;
      const known = teamBase.current.get(key);
      // Just turned into a shared plan: start from what the normal sync saved.
      const base =
        known ?? confirmed.current.spendPlans.find((p) => p.id === plan.id && !p.ownerId) ?? plan;
      if (known && same(known, plan)) continue;

      teamSaving.current.add(key);
      setSyncStatus('saving');
      saveTeamPlan(base, plan)
        .then((saved) => {
          teamBase.current.set(key, saved);
          // Keep edits made while this was saving, on top of everyone's changes.
          setState((s) => {
            const now = s.spendPlans.find((p) => planKey(p) === key);
            if (!now) return s;
            return actions.putPlan(s, same(now, plan) ? saved : mergePlan(plan, now, saved));
          });
          setSyncStatus('idle');
        })
        .catch((error) => {
          if (error instanceof UnauthorizedError) return goToLogin();
          if (error instanceof TeamPlanRequestError && error.status === 404 && plan.ownerId) {
            // Removed from the plan, or it was deleted.
            teamBase.current.delete(key);
            setState((s) => actions.dropJoinedPlan(s, plan.id, plan.ownerId as string));
            return;
          }
          setSyncStatus('error');
          if (teamRetry.current) clearTimeout(teamRetry.current);
          teamRetry.current = setTimeout(() => flushTeamAgain.current(), SYNC.firstRetryMs * 4);
        })
        .finally(() => {
          teamSaving.current.delete(key);
        });
    }
  }, []);

  /** Brings in friends' edits, merged with any of mine not saved yet. */
  const pullTeam = useCallback(async () => {
    const remote = await fetchTeamPlans();
    // A snapshot: the state updater below may run twice and must not see its own changes.
    const bases = new Map(teamBase.current);
    const busy = new Set(teamSaving.current);
    setState((s) => {
      let next = s;
      const remoteKeys = new Set(remote.map(planKey));
      for (const plan of remote) {
        const key = planKey(plan);
        if (busy.has(key)) continue; // The save's answer brings it in.
        const now = s.spendPlans.find((p) => planKey(p) === key);
        const base = bases.get(key);
        if (!now || !base || same(now, base)) next = actions.putPlan(next, plan);
        else next = actions.putPlan(next, mergePlan(base, now, plan));
      }
      for (const plan of s.spendPlans) {
        if (plan.ownerId && !remoteKeys.has(planKey(plan)) && !busy.has(planKey(plan))) {
          next = actions.dropJoinedPlan(next, plan.id, plan.ownerId);
        }
      }
      return next;
    });
    for (const plan of remote) {
      if (!busy.has(planKey(plan))) teamBase.current.set(planKey(plan), plan);
    }
  }, []);

  useEffect(() => {
    flushTeamAgain.current = flushTeam;
  }, [flushTeam]);

  // Edits to shared plans go out on the same short delay as everything else.
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(flushTeam, SYNC.saveDelayMs);
    return () => clearTimeout(id);
  }, [state, ready, flushTeam]);

  const hasTeamPlans = state.spendPlans.some(isTeamPlan);

  // Friends' edits show up within a few seconds while the app is open.
  useEffect(() => {
    if (!ready || !hasTeamPlans) return;
    const pull = () => {
      if (document.visibilityState === 'visible') pullTeam().catch(() => {});
    };
    const id = setInterval(pull, TEAM_PULL_MS);
    document.addEventListener('visibilitychange', pull);
    window.addEventListener('focus', pull);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', pull);
      window.removeEventListener('focus', pull);
    };
  }, [ready, hasTeamPlans, pullTeam]);

  const teamActions = useMemo<TeamActions>(
    () => ({
      startTeamPlan: (planId, currency) => {
        const inviteId = actions.newShareId();
        setState((s) => actions.startTeamPlan(s, planId, inviteId, currency));
        return inviteId;
      },
      resetTeamInvite: (planId) =>
        setState((s) => actions.setTeamInvite(s, planId, actions.newShareId())),
      stopTeamInvite: (planId) => setState((s) => actions.setTeamInvite(s, planId, undefined)),
      joinTeamPlan: async (inviteId) => {
        try {
          const { planId } = await joinTeamPlan(inviteId);
          await pullTeam();
          return planId;
        } catch (error) {
          if (error instanceof UnauthorizedError) goToLogin();
          if (error instanceof TeamPlanRequestError && error.status === 404) return null;
          throw error;
        }
      },
      leaveTeamPlan: async (planId, ownerId) => {
        await removeTeamPerson(ownerId, planId);
        teamBase.current.delete(planKey({ id: planId, ownerId }));
        setState((s) => actions.dropJoinedPlan(s, planId, ownerId));
      },
      refreshTeamPlans: pullTeam,
    }),
    [pullTeam],
  );

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
      addPlanActivity: (planId, input) => {
        const activity = actions.newPlanActivity(input);
        setState((s) => actions.addPlanActivity(s, planId, activity));
      },
      updatePlanActivity: run(actions.updatePlanActivity),
      togglePlanActivity: run(actions.togglePlanActivity),
      reorderPlanStops: run(actions.reorderPlanStops),
      removePlanActivity: run(actions.removePlanActivity),
      addChecklistItem: (planId, text) => {
        const item = actions.newChecklistItem(text);
        setState((s) => actions.addChecklistItem(s, planId, item));
      },
      toggleChecklistItem: run(actions.toggleChecklistItem),
      removeChecklistItem: run(actions.removeChecklistItem),
      sharePlan: (planId, currency) => {
        const shareId = actions.newShareId();
        setState((s) => actions.setPlanShare(s, planId, shareId, currency));
        return shareId;
      },
      unsharePlan: (planId) => setState((s) => actions.setPlanShare(s, planId, undefined)),
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
      ...teamActions,
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
      teamActions,
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
