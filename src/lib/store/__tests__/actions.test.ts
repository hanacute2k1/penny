import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from '../actions';
import { createStarterState, type AppState } from '../state';

const NOW = new Date('2026-11-05T10:00:00Z');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

const base = (): AppState => createStarterState();
const tx = (over: Partial<AppState['transactions'][number]> = {}) =>
  actions.newTransaction({
    categoryId: 'c-food',
    amount: 10_000,
    type: 'expense',
    date: '2026-11-02',
    ...over,
  });

describe('transactions', () => {
  it('trims the note and drops an empty one', () => {
    expect(tx({ note: '  phở ' }).note).toBe('phở');
    expect(tx({ note: '   ' }).note).toBeUndefined();
  });

  it('deleting a transaction also removes the transit day that produced it', () => {
    let s = base();
    const meterId = s.transportMeters[0].id;
    s = actions.setTransportDayLegs(s, meterId, '2026-11-02', [
      { from: 'A', to: 'B', amount: 9000 },
    ]);
    expect(s.transportEntries).toHaveLength(1);
    s = actions.deleteTransaction(s, s.transportEntries[0].transactionId);
    expect(s.transportEntries).toHaveLength(0);
    expect(s.transactions).toHaveLength(0);
  });
});

describe('categories', () => {
  it('deletes an unused category but only hides one that is in use', () => {
    let s = actions.addTransaction(base(), tx({ categoryId: 'c-food' }));
    s = actions.deleteCategory(s, 'c-food');
    expect(s.categories.find((c) => c.id === 'c-food')?.isArchived).toBe(true);
    s = actions.deleteCategory(s, 'c-shop');
    expect(s.categories.some((c) => c.id === 'c-shop')).toBe(false);
  });
});

describe('budgets', () => {
  it('restoreBudget(null) removes the month and a budget puts it back', () => {
    let s = actions.saveBudget(base(), '2026-11', [{ categoryId: 'c-food', limitAmount: 1 }]);
    const saved = s.budgets[0];
    s = actions.restoreBudget(s, '2026-11', null);
    expect(s.budgets).toEqual([]);
    s = actions.restoreBudget(s, '2026-11', saved);
    expect(s.budgets).toEqual([saved]);
  });
});

describe('month plans', () => {
  const input = {
    title: ' Tết ',
    amount: 500_000,
    categoryId: 'c-shop',
    type: 'expense' as const,
    dayOfMonth: 40,
  };

  it('posts a plan right away when its month has arrived', () => {
    const plan = actions.newPlan({ ...input, targetMonth: '2026-11' });
    expect(plan.dayOfMonth).toBe(28);
    const s = actions.addPlan(base(), plan);
    expect(s.monthPlans[0].isPosted).toBe(true);
    expect(s.transactions).toHaveLength(1);
  });

  it('keeps a future plan pending, and ensurePlansForMonth ignores future months', () => {
    const plan = actions.newPlan({ ...input, targetMonth: '2027-01' });
    const s = actions.addPlan(base(), plan);
    expect(s.monthPlans[0].isPosted).toBe(false);
    expect(actions.ensurePlansForMonth(s, '2027-01')).toBe(s);
  });
});

describe('transport', () => {
  it('creates, updates and clears the day transaction together with the entry', () => {
    let s = base();
    const meterId = s.transportMeters[0].id;
    s = actions.setTransportDayLegs(s, meterId, '2026-11-02', [
      { from: ' A ', to: 'B', amount: 12_000.6 },
      { from: 'B', to: 'C', amount: 0 },
    ]);
    expect(s.transportEntries[0].legs).toHaveLength(1);
    expect(s.transactions[0]).toMatchObject({ amount: 12_001, categoryId: 'c-transport' });

    s = actions.setTransportDayLegs(s, meterId, '2026-11-02', [
      { from: 'A', to: 'C', amount: 30_000 },
    ]);
    expect(s.transactions).toHaveLength(1);
    expect(s.transactions[0].amount).toBe(30_000);

    s = actions.setTransportDayLegs(s, meterId, '2026-11-02', []);
    expect(s.transportEntries).toHaveLength(0);
    expect(s.transactions).toHaveLength(0);
  });
});

describe('spend plans', () => {
  const plan = () =>
    actions.newSpendPlan({
      title: ' Đà Lạt ',
      icon: '⛰️',
      startDate: '2026-11-20',
      endDate: '2026-11-19',
      items: [
        {
          name: 'Xe',
          categoryId: 'c-transport',
          estimate: 500_000,
          actual: 450_000,
          isExtra: false,
        },
        { name: '', categoryId: 'c-other', estimate: 0, actual: 20_000, isExtra: true },
        { name: '', categoryId: 'c-other', estimate: 5, actual: null, isExtra: false },
      ],
    });

  it('cleans input: trims, drops blank rows but keeps extras with an amount', () => {
    const p = plan();
    expect(p.title).toBe('Đà Lạt');
    expect(p.endDate).toBeUndefined();
    expect(p.items).toHaveLength(2);
  });

  it('settling twice replaces the posted transactions instead of duplicating them', () => {
    const p = plan();
    let s = actions.addSpendPlan(base(), p);
    s = actions.settleSpendPlan(s, p.id);
    s = actions.settleSpendPlan(s, p.id);
    expect(s.transactions.filter((t) => t.spendPlanId === p.id)).toHaveLength(2);
    expect(s.spendPlans[0]).toMatchObject({ status: 'done', postedCount: 2 });
  });
});
