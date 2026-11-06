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
  /** What it really cost — null until the user fills it in. */
  actual: number | null;
  /** Unplanned cost that came up (phát sinh). */
  isExtra: boolean;
};

/** A budget for one occasion — trip, outing, party — compared with reality afterwards. */
export type SpendPlan = {
  id: string;
  title: string;
  icon: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, optional for one-day plans
  note?: string;
  items: SpendPlanItem[];
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
  /** Items keep their id when edited so actuals already entered survive. */
  items: (Omit<SpendPlanItem, 'id'> & { id?: string })[];
};
