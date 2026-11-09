export type CategoryType = 'expense' | 'income';
export type TransactionType = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  sortOrder: number;
  isArchived: boolean;
};

export type Transaction = {
  id: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  note?: string;
  recurringRuleId?: string;
  planId?: string;
  /** Links a daily transport log (Grab, fuel, bus…) to this transaction. */
  transportMeterId?: string;
  /** Set when posted from a spend plan (trip, party…) so re-posting replaces it. */
  spendPlanId?: string;
  createdAt: string;
};

/** Sub-track under Transport — Grab, fuel, bus, train… daily calendar logging. */
export type TransportMeter = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
};

export type TransportMeterInput = {
  name: string;
  icon: string;
};

/** One ride / segment within a day (e.g. A → B). */
export type TransportLeg = {
  id: string;
  from: string;
  to: string;
  amount: number;
};

/** One day's spend for a transport meter (sum of legs). */
export type TransportEntry = {
  id: string;
  meterId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  legs: TransportLeg[];
  transactionId: string;
  createdAt: string;
};

/** One-time note / planned amount for a specific future month. Auto-posts when that month arrives. */
export type MonthPlan = {
  id: string;
  title: string;
  note?: string;
  amount: number;
  categoryId: string;
  type: TransactionType;
  targetMonth: string; // YYYY-MM
  dayOfMonth: number; // 1–28
  isPosted: boolean;
  createdAt: string;
};

export type MonthPlanInput = {
  title: string;
  note?: string;
  amount: number;
  categoryId: string;
  type: TransactionType;
  targetMonth: string;
  dayOfMonth: number;
};

/** Fixed monthly amount (rent, wifi, salary, …) auto-posted each month. */
export type RecurringRule = {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  dayOfMonth: number; // 1–28
  startMonth: string; // YYYY-MM
  endMonth?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type RecurringInput = {
  name: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  dayOfMonth: number;
  startMonth: string;
  endMonth?: string | null;
  isActive?: boolean;
};

export type CategoryBudget = {
  categoryId: string;
  limitAmount: number;
};

export type MonthBudget = {
  yearMonth: string; // YYYY-MM
  note?: string;
  categories: CategoryBudget[];
};

export type CategoryProgress = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
};

export type MonthView = {
  yearMonth: string;
  income: number;
  expense: number;
  remainingCashflow: number;
  budgetTotal: number;
  budgetRemaining: number;
  budgetPercent: number;
  categories: CategoryProgress[];
  recentTransactions: Transaction[];
};

export type TransactionInput = {
  categoryId: string;
  amount: number;
  type: TransactionType;
  date: string;
  note?: string;
};

export type MonthDelta = {
  expenseDelta: number | null;
  incomeDelta: number | null;
  balanceDelta: number | null;
  expenseDeltaPercent: number | null;
  incomeDeltaPercent: number | null;
};

export type YearMonthSummary = {
  yearMonth: string;
  month: number;
  income: number;
  expense: number;
  balance: number;
  hasActivity: boolean;
  delta: MonthDelta;
};

export type YearOverview = {
  year: number;
  months: YearMonthSummary[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  averages: {
    income: number;
    expense: number;
    balance: number;
  };
  activeMonths: number;
  highestExpenseMonth: YearMonthSummary | null;
  lowestExpenseMonth: YearMonthSummary | null;
  bestBalanceMonth: YearMonthSummary | null;
  worstBalanceMonth: YearMonthSummary | null;
};

/** One line in a spend plan: estimated before, actual filled in during/after. */
export type SpendPlanItem = {
  id: string;
  name: string;
  categoryId: string;
  /** Planned amount. 0 for unplanned extras. */
  estimate: number;
  /** Paid ahead of the trip (deposit / booking), part of the total. */
  deposit: number;
  /** What it really cost in total — null until the user fills it in after the trip. */
  actual: number | null;
  /** Unplanned cost that came up (phát sinh). */
  isExtra: boolean;
};

/** What kind of stop an itinerary entry is; picks its icon and colour. */
export type PlanActivityKind = 'move' | 'stay' | 'food' | 'see' | 'other';

/** One entry in a trip's day-by-day itinerary. */
export type PlanActivity = {
  id: string;
  date: string; // YYYY-MM-DD, one of the plan's days
  /** "HH:mm"; entries without a time go after the timed ones. */
  time?: string;
  title: string;
  /** Free text ("Chợ Đà Lạt"); opened in Google Maps. */
  place?: string;
  /** A Google Maps link pasted by the user; opened and copied as-is. */
  mapUrl?: string;
  /** Position read from the map link, used to draw the day's route. */
  lat?: number;
  lng?: number;
  note?: string;
  kind: PlanActivityKind;
  /**
   * Transport only: where it leaves from. `place` / `mapUrl` / `lat` / `lng` are
   * then where it arrives.
   */
  from?: string;
  fromMapUrl?: string;
  fromLat?: number;
  fromLng?: number;
  /**
   * Stays: check-out day and time. Transport: arrival day and time.
   * A stay with a check-out shows up twice in the itinerary (check-in on `date`,
   * check-out on `endDate`) and as the night's lodging on the days between; a
   * trip arriving on a later day (night bus) shows up on both days too.
   */
  endDate?: string;
  endTime?: string;
  done: boolean;
  /** The check-out / arrival stop is ticked off separately. */
  endDone?: boolean;
};

/** Things to prepare or pack before leaving. */
export type PlanChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

/** A trip or occasion: day-by-day itinerary, costs (deposit before, total after), checklist. */
export type SpendPlan = {
  id: string;
  title: string;
  icon: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, optional for one-day plans
  note?: string;
  /** How many people share the costs, for the per-person figure. */
  people: number;
  items: SpendPlanItem[];
  activities: PlanActivity[];
  checklist: PlanChecklistItem[];
  /** Set while a read-only link is shared (/share/<shareId>). */
  shareId?: string;
  /** "done" once the user has closed it out after the occasion. */
  status: 'planning' | 'done';
  /** Number of transactions last posted from this plan (0 = never posted). */
  postedCount: number;
  createdAt: string;
};

export type SpendPlanInput = {
  title: string;
  icon: string;
  startDate: string;
  endDate?: string;
  note?: string;
  people: number;
  /** Items keep their id when edited so actuals already entered survive. */
  items: (Omit<SpendPlanItem, 'id'> & { id?: string })[];
};

export type PlanActivityInput = Omit<PlanActivity, 'id' | 'done' | 'endDone'>;
