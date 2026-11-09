/**
 * Demo data: the default categories, transit types and a few months of sample
 * history. New accounts only get the categories and transit types (see state.ts).
 */
import { addDays, format } from 'date-fns';
import { CATEGORY_IDS } from '@/lib/constants';
import { currentYearMonth, shiftYearMonth, todayIso } from '@/lib/helper/date';
import { applyRecurringToMonths } from '@/lib/helper/recurring';
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
import type { AppState } from './state';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'c-food',
    name: 'Food & Drink',
    icon: 'food',
    color: '#e4573d',
    type: 'expense',
    sortOrder: 1,
    isArchived: false,
  },
  {
    id: 'c-transport',
    name: 'Transport',
    icon: 'car',
    color: '#2f6fed',
    type: 'expense',
    sortOrder: 2,
    isArchived: false,
  },
  {
    id: 'c-home',
    name: 'Housing',
    icon: 'home',
    color: '#0b8f6e',
    type: 'expense',
    sortOrder: 3,
    isArchived: false,
  },
  {
    id: 'c-shop',
    name: 'Shopping',
    icon: 'groceries',
    color: '#9b59b6',
    type: 'expense',
    sortOrder: 4,
    isArchived: false,
  },
  {
    id: 'c-health',
    name: 'Health',
    icon: 'health',
    color: '#16a085',
    type: 'expense',
    sortOrder: 5,
    isArchived: false,
  },
  {
    id: 'c-fun',
    name: 'Entertainment',
    icon: 'game',
    color: '#c9851a',
    type: 'expense',
    sortOrder: 6,
    isArchived: false,
  },
  {
    id: 'c-edu',
    name: 'Education',
    icon: 'book',
    color: '#34495e',
    type: 'expense',
    sortOrder: 7,
    isArchived: false,
  },
  {
    id: 'c-other',
    name: 'Other',
    icon: 'box',
    color: '#7f8c8d',
    type: 'expense',
    sortOrder: 8,
    isArchived: false,
  },
  {
    id: 'c-salary',
    name: 'Salary',
    icon: 'wallet',
    color: '#0b8f6e',
    type: 'income',
    sortOrder: 1,
    isArchived: false,
  },
  {
    id: 'c-other-in',
    name: 'Other income',
    icon: 'coins',
    color: '#2f6fed',
    type: 'income',
    sortOrder: 2,
    isArchived: false,
  },
];

function ymDays(yearMonth: string, day: number): string {
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}

export function buildSeedRecurring(startMonth: string): RecurringRule[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'r-rent',
      name: 'Rent',
      categoryId: 'c-home',
      amount: 5_000_000,
      type: 'expense',
      dayOfMonth: 2,
      startMonth,
      endMonth: null,
      isActive: true,
      createdAt: now,
    },
    {
      id: 'r-wifi',
      name: 'Wifi / Internet',
      categoryId: 'c-home',
      amount: 200_000,
      type: 'expense',
      dayOfMonth: 5,
      startMonth,
      endMonth: null,
      isActive: true,
      createdAt: now,
    },
    {
      id: 'r-netflix',
      name: 'Netflix',
      categoryId: 'c-fun',
      amount: 210_000,
      type: 'expense',
      dayOfMonth: 8,
      startMonth,
      endMonth: null,
      isActive: true,
      createdAt: now,
    },
  ];
}

export function buildSeedTransactions(yearMonth: string): Transaction[] {
  const now = new Date().toISOString();
  const t = todayIso();
  const day = Number(t.slice(8, 10));
  const safe = (d: number) => ymDays(yearMonth, Math.min(d, Math.max(day, 1)));

  return [
    {
      id: 't-salary',
      categoryId: 'c-salary',
      amount: 15_000_000,
      type: 'income',
      date: ymDays(yearMonth, 1),
      note: 'Monthly salary',
      createdAt: now,
    },
    {
      id: 't-cafe',
      categoryId: 'c-food',
      amount: 45_000,
      type: 'expense',
      date: t.startsWith(yearMonth) ? t : safe(day),
      note: 'Cafe ABC',
      createdAt: now,
    },
    {
      id: 't-grab',
      categoryId: 'c-transport',
      amount: 78_000,
      type: 'expense',
      date: safe(Math.max(day - 1, 1)),
      note: 'Ride to office',
      createdAt: now,
    },
    {
      id: 't-lunch',
      categoryId: 'c-food',
      amount: 55_000,
      type: 'expense',
      date: safe(Math.max(day - 1, 1)),
      note: 'Lunch',
      createdAt: now,
    },
    {
      id: 't-market',
      categoryId: 'c-food',
      amount: 320_000,
      type: 'expense',
      date: safe(Math.max(day - 3, 1)),
      note: 'Weekly groceries',
      createdAt: now,
    },
    {
      id: 't-grab2',
      categoryId: 'c-transport',
      amount: 120_000,
      type: 'expense',
      date: safe(8),
      note: 'Fuel',
      createdAt: now,
    },
    {
      id: 't-shop',
      categoryId: 'c-shop',
      amount: 450_000,
      type: 'expense',
      date: safe(10),
      note: 'Jacket',
      createdAt: now,
    },
    {
      id: 't-food2',
      categoryId: 'c-food',
      amount: 1_680_000,
      type: 'expense',
      date: safe(12),
      note: 'Food extras',
      createdAt: now,
    },
    {
      id: 't-transport2',
      categoryId: 'c-transport',
      amount: 602_000,
      type: 'expense',
      date: safe(14),
      note: 'Transport extras',
      createdAt: now,
    },
  ];
}

export function buildSeedBudget(yearMonth: string): MonthBudget {
  return {
    yearMonth,
    categories: [
      { categoryId: 'c-food', limitAmount: 3_000_000 },
      { categoryId: 'c-transport', limitAmount: 1_500_000 },
      { categoryId: 'c-home', limitAmount: 5_500_000 },
      { categoryId: 'c-shop', limitAmount: 1_000_000 },
      { categoryId: 'c-health', limitAmount: 500_000 },
      { categoryId: 'c-fun', limitAmount: 800_000 },
      { categoryId: 'c-edu', limitAmount: 700_000 },
      { categoryId: 'c-other', limitAmount: 500_000 },
    ],
  };
}

export function buildSeedTransportMeters(): TransportMeter[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'tm-grab',
      name: 'Grab',
      icon: 'motorbike',
      sortOrder: 1,
      isArchived: false,
      createdAt: now,
    },
    {
      id: 'tm-fuel',
      name: 'Xăng',
      icon: 'fuel',
      sortOrder: 2,
      isArchived: false,
      createdAt: now,
    },
  ];
}

export function buildSeedTransportEntries(yearMonth: string): {
  entries: TransportEntry[];
  transactions: Transaction[];
} {
  const now = new Date().toISOString();
  const t = todayIso();
  const day = Number(t.slice(8, 10));
  const d1 = Math.max(day - 4, 1);
  const d2 = Math.max(day - 2, 1);
  const d3 = Math.max(day - 1, 1);
  const fuelDay = Math.max(day - 6, 1);

  const entries: TransportEntry[] = [];
  const transactions: Transaction[] = [];

  function pushGrab(dayNum: number, legs: { from: string; to: string; amount: number }[]) {
    const date = ymDays(yearMonth, dayNum);
    const id = `te-grab-${date}`;
    const txId = `t-tm-grab-${date}`;
    const mapped = legs.map((leg, i) => ({
      id: `${id}-l${i}`,
      from: leg.from,
      to: leg.to,
      amount: leg.amount,
    }));
    const amount = mapped.reduce((s, l) => s + l.amount, 0);
    const routes = mapped.map((l) => `${l.from} → ${l.to}`).join(', ');
    entries.push({
      id,
      meterId: 'tm-grab',
      date,
      amount,
      legs: mapped,
      transactionId: txId,
      createdAt: now,
    });
    transactions.push({
      id: txId,
      categoryId: CATEGORY_IDS.transport,
      amount,
      type: 'expense',
      date,
      note: `Grab · ${routes}`,
      transportMeterId: 'tm-grab',
      createdAt: now,
    });
  }

  pushGrab(d1, [
    { from: 'Nhà', to: 'Công ty', amount: 45_000 },
    { from: 'Công ty', to: 'Nhà', amount: 20_000 },
  ]);
  pushGrab(d2, [{ from: 'Nhà', to: 'Sân bay', amount: 78_000 }]);
  pushGrab(d3, [
    { from: 'Công ty', to: 'Quận 1', amount: 32_000 },
    { from: 'Quận 1', to: 'Nhà', amount: 20_000 },
  ]);

  const fuelDate = ymDays(yearMonth, fuelDay);
  const fuelTxId = `t-tm-fuel-${fuelDate}`;
  entries.push({
    id: `te-fuel-${fuelDate}`,
    meterId: 'tm-fuel',
    date: fuelDate,
    amount: 150_000,
    legs: [
      {
        id: `te-fuel-${fuelDate}-l0`,
        from: '',
        to: '',
        amount: 150_000,
      },
    ],
    transactionId: fuelTxId,
    createdAt: now,
  });
  transactions.push({
    id: fuelTxId,
    categoryId: CATEGORY_IDS.transport,
    amount: 150_000,
    type: 'expense',
    date: fuelDate,
    note: 'Xăng',
    transportMeterId: 'tm-fuel',
    createdAt: now,
  });

  return { entries, transactions };
}

export function buildSeedPlans(fromMonth: string): MonthPlan[] {
  const now = new Date().toISOString();
  const next = shiftYearMonth(fromMonth, 1);
  const next2 = shiftYearMonth(fromMonth, 2);
  return [
    {
      id: 'p-wedding',
      title: 'Tiền mừng cưới',
      note: 'Đám cưới bạn',
      amount: 2_000_000,
      categoryId: 'c-other',
      type: 'expense',
      targetMonth: next,
      dayOfMonth: 15,
      isPosted: false,
      createdAt: now,
    },
    {
      id: 'p-flight',
      title: 'Vé máy bay',
      note: 'Du lịch gia đình',
      amount: 4_500_000,
      categoryId: 'c-transport',
      type: 'expense',
      targetMonth: next2,
      dayOfMonth: 10,
      isPosted: false,
      createdAt: now,
    },
  ];
}

/** One upcoming trip and one past outing waiting to be checked, as examples. */
export function buildSeedSpendPlans(): SpendPlan[] {
  const now = new Date();
  const iso = (d: Date) => format(d, 'yyyy-MM-dd');
  const createdAt = now.toISOString();
  const day1 = iso(addDays(now, 18));
  const day2 = iso(addDays(now, 19));
  const day3 = iso(addDays(now, 20));
  const item = (
    id: string,
    name: string,
    categoryId: string,
    estimate: number,
    deposit = 0,
    actual: number | null = null,
    isExtra = false,
  ) => ({ id, name, categoryId, estimate, deposit, actual, isExtra });
  return [
    {
      id: 'sp-dalat',
      title: 'Du lịch Đà Lạt',
      icon: 'mountain',
      startDate: day1,
      endDate: day3,
      note: '3 ngày 2 đêm cùng gia đình',
      people: 4,
      status: 'planning',
      postedCount: 0,
      createdAt,
      items: [
        item('spi-1', 'Xe khách giường nằm', 'c-transport', 1_200_000, 600_000),
        item('spi-2', 'Homestay 2 đêm', 'c-home', 2_400_000, 1_000_000),
        item('spi-3', 'Ăn uống', 'c-food', 1_500_000),
        item('spi-4', 'Vé tham quan', 'c-fun', 600_000),
      ],
      activities: [
        {
          id: 'pa-1',
          date: day1,
          time: '00:30',
          title: 'Xe giường nằm lên Đà Lạt',
          from: 'Bến xe Miền Đông mới',
          fromLat: 10.8794,
          fromLng: 106.8163,
          endDate: day1,
          endTime: '06:30',
          place: 'Bến xe Liên tỉnh Đà Lạt',
          lat: 11.9275,
          lng: 108.4447,
          kind: 'move',
          done: false,
        },
        {
          id: 'pa-2',
          date: day1,
          time: '08:00',
          title: 'Ăn sáng bánh căn',
          place: 'Bánh căn Nhà Chung',
          lat: 11.9431,
          lng: 108.4352,
          kind: 'food',
          done: false,
        },
        {
          id: 'pa-3',
          date: day1,
          time: '15:00',
          title: 'Dạo hồ Xuân Hương',
          place: 'Hồ Xuân Hương',
          lat: 11.9416,
          lng: 108.4446,
          kind: 'see',
          done: false,
        },
        {
          id: 'pa-4',
          date: day1,
          time: '19:00',
          title: 'Chợ đêm',
          place: 'Chợ Đà Lạt',
          lat: 11.9428,
          lng: 108.4372,
          kind: 'food',
          done: false,
        },
        {
          id: 'pa-5',
          date: day2,
          time: '05:00',
          title: 'Săn mây',
          place: 'Đồi chè Cầu Đất',
          lat: 11.864,
          lng: 108.564,
          kind: 'see',
          note: 'Mang áo ấm',
          done: false,
        },
        {
          id: 'pa-6',
          date: day2,
          time: '14:00',
          title: 'Thác Datanla',
          place: 'Thác Datanla',
          lat: 11.903,
          lng: 108.449,
          kind: 'see',
          done: false,
        },
        {
          id: 'pa-7',
          date: day3,
          time: '10:00',
          title: 'Mua đặc sản',
          place: 'Chợ Đà Lạt',
          lat: 11.9428,
          lng: 108.4372,
          kind: 'other',
          done: false,
        },
        {
          id: 'pa-8',
          date: day3,
          time: '13:00',
          title: 'Xe về Sài Gòn',
          from: 'Bến xe Liên tỉnh Đà Lạt',
          fromLat: 11.9275,
          fromLng: 108.4447,
          endDate: day3,
          endTime: '19:30',
          place: 'Bến xe Miền Đông mới',
          lat: 10.8794,
          lng: 106.8163,
          kind: 'move',
          done: false,
        },
        {
          id: 'pa-9',
          date: day1,
          time: '14:00',
          title: 'Homestay gần hồ Xuân Hương',
          place: 'Đường Trần Quốc Toản, Đà Lạt',
          lat: 11.9405,
          lng: 108.441,
          kind: 'stay',
          endDate: day3,
          endTime: '12:00',
          done: false,
        },
      ],
      checklist: [
        { id: 'pc-1', text: 'CCCD', done: true },
        { id: 'pc-2', text: 'Áo ấm', done: false },
        { id: 'pc-3', text: 'Sạc dự phòng', done: false },
      ],
    },
    {
      id: 'sp-picnic',
      title: 'Picnic cuối tuần',
      icon: 'camp',
      startDate: iso(addDays(now, -3)),
      people: 2,
      status: 'planning',
      postedCount: 0,
      createdAt,
      items: [
        item('spi-5', 'Đồ ăn', 'c-food', 400_000, 0, 460_000),
        item('spi-6', 'Grab', 'c-transport', 200_000, 0, 150_000),
        item('spi-7', 'Thuê lều', 'c-fun', 150_000, 50_000),
        item('spi-8', 'Kem', 'c-food', 0, 0, 60_000, true),
      ],
      activities: [],
      checklist: [],
    },
  ];
}

/** Lightweight variable spend history (fixed costs come from recurring rules). */
function buildHistoryMonth(yearMonth: string, factor: number): Transaction[] {
  const now = new Date().toISOString();
  const food = Math.round(2_100_000 * factor);
  const transport = Math.round(800_000 * factor);
  const fun = Math.round(140_000 * factor);
  const shop = Math.round(400_000 * factor);

  return [
    {
      id: `t-salary-${yearMonth}`,
      categoryId: 'c-salary',
      amount: 15_000_000,
      type: 'income',
      date: ymDays(yearMonth, 1),
      note: 'Monthly salary',
      createdAt: now,
    },
    {
      id: `t-food-${yearMonth}`,
      categoryId: 'c-food',
      amount: food,
      type: 'expense',
      date: ymDays(yearMonth, 10),
      note: 'Food & drink',
      createdAt: now,
    },
    {
      id: `t-transport-${yearMonth}`,
      categoryId: 'c-transport',
      amount: transport,
      type: 'expense',
      date: ymDays(yearMonth, 12),
      note: 'Transport',
      createdAt: now,
    },
    {
      id: `t-fun-${yearMonth}`,
      categoryId: 'c-fun',
      amount: fun,
      type: 'expense',
      date: ymDays(yearMonth, 18),
      note: 'Entertainment',
      createdAt: now,
    },
    {
      id: `t-shop-${yearMonth}`,
      categoryId: 'c-shop',
      amount: shop,
      type: 'expense',
      date: ymDays(yearMonth, 22),
      note: 'Shopping',
      createdAt: now,
    },
  ];
}

export function createInitialState(): AppState {
  const month = currentYearMonth();
  const startHistory = shiftYearMonth(month, -5);
  const factors = [0.85, 1.05, 0.95, 1.15, 0.9];
  const historyMonths = [5, 4, 3, 2, 1].map((back) => shiftYearMonth(month, -back));
  const rules = buildSeedRecurring(startHistory);

  const historyTx = historyMonths.flatMap((ym, index) =>
    buildHistoryMonth(ym, factors[index] ?? 1),
  );

  const seededTransport = buildSeedTransportEntries(month);
  const baseTx = [
    ...buildSeedTransactions(month).filter((t) => t.id !== 't-grab'),
    ...historyTx,
    ...seededTransport.transactions,
  ];
  const allMonths = [...historyMonths, month];
  const withFixed = applyRecurringToMonths(rules, baseTx, allMonths);

  return {
    categories: DEFAULT_CATEGORIES,
    transactions: withFixed,
    budgets: [buildSeedBudget(month), ...historyMonths.map((ym) => buildSeedBudget(ym))],
    recurringRules: rules,
    monthPlans: buildSeedPlans(month),
    transportMeters: buildSeedTransportMeters(),
    transportEntries: seededTransport.entries,
    spendPlans: buildSeedSpendPlans(),
  };
}
