import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from '../actions';
import { createStarterState, diffState, type AppState } from '../state';

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
      people: 2,
      items: [
        {
          name: 'Xe',
          categoryId: 'c-transport',
          estimate: 500_000,
          deposit: 100_000,
          actual: 450_000,
          isExtra: false,
        },
        { name: '', categoryId: 'c-other', estimate: 0, deposit: 0, actual: 20_000, isExtra: true },
        { name: '', categoryId: 'c-other', estimate: 5, deposit: 0, actual: null, isExtra: false },
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

  it('adds, edits, ticks and removes itinerary entries', () => {
    const p = plan();
    const a = actions.newPlanActivity({
      date: '2026-11-20',
      time: '9:00',
      title: ' Chợ ',
      place: '  ',
      kind: 'food',
    });
    expect(a).toMatchObject({ title: 'Chợ', time: undefined, place: undefined, done: false });
    let s = actions.addPlanActivity(actions.addSpendPlan(base(), p), p.id, a);
    s = actions.updatePlanActivity(s, p.id, a.id, { ...a, time: '07:30' });
    s = actions.togglePlanActivity(s, p.id, a.id);
    expect(s.spendPlans[0].activities[0]).toMatchObject({ time: '07:30', done: true });
    s = actions.removePlanActivity(s, p.id, a.id);
    expect(s.spendPlans[0].activities).toHaveLength(0);
  });

  it('keeps a check-out only on stays after check-in, ticked off on its own', () => {
    const p = plan();
    const stay = actions.newPlanActivity({
      date: '2026-11-20',
      time: '14:00',
      title: 'Homestay',
      kind: 'stay',
      endDate: '2026-11-22',
      endTime: '12:00',
      mapUrl: ' https://maps.app.goo.gl/x ',
      lat: 11.94041234567,
      lng: 108.4583,
    });
    expect(stay).toMatchObject({
      endDate: '2026-11-22',
      endTime: '12:00',
      mapUrl: 'https://maps.app.goo.gl/x',
      lat: 11.940412,
    });
    expect(actions.newPlanActivity({ ...stay, kind: 'food' }).endDate).toBeUndefined();
    expect(actions.newPlanActivity({ ...stay, endDate: '2026-11-20' }).endDate).toBeUndefined();
    // A position needs both halves.
    expect(actions.newPlanActivity({ ...stay, lng: undefined }).lat).toBeUndefined();

    let s = actions.addPlanActivity(actions.addSpendPlan(base(), p), p.id, stay);
    s = actions.togglePlanActivity(s, p.id, stay.id, 'end');
    expect(s.spendPlans[0].activities[0]).toMatchObject({ done: false, endDone: true });
  });

  it('keeps departure fields only on rides, arriving the same day or later', () => {
    const ride = actions.newPlanActivity({
      date: '2026-11-20',
      time: '00:30',
      title: 'Xe',
      kind: 'move',
      from: ' Bến xe Miền Đông ',
      fromLat: 10.8794,
      fromLng: 106.8163,
      endDate: '2026-11-20',
      endTime: '06:30',
    });
    expect(ride).toMatchObject({
      from: 'Bến xe Miền Đông',
      fromLat: 10.8794,
      endDate: '2026-11-20',
      endTime: '06:30',
    });
    expect(actions.newPlanActivity({ ...ride, endDate: '2026-11-19' }).endDate).toBeUndefined();
    const food = actions.newPlanActivity({ ...ride, kind: 'food' });
    expect(food).toMatchObject({ from: undefined, fromLat: undefined, endDate: undefined });
  });

  it('reorders stops by handing their time slots out again', () => {
    const p = plan();
    const at = (title: string, time?: string) =>
      actions.newPlanActivity({ date: '2026-11-20', time, title, kind: 'see' });
    const a = at('A', '08:00');
    const b = at('B', '10:00');
    const c = at('C', '13:00');
    const other = at('Other', '09:00');
    let s = actions.addSpendPlan(base(), p);
    for (const x of [a, other, b, c]) s = actions.addPlanActivity(s, p.id, x);
    s = actions.reorderPlanStops(s, p.id, [a.id, c.id, b.id]);
    expect(s.spendPlans[0].activities.map((x) => [x.title, x.time])).toEqual([
      ['A', '08:00'],
      ['Other', '09:00'],
      ['C', '10:00'],
      ['B', '13:00'],
    ]);
    // Unknown ids leave the plan alone.
    expect(actions.reorderPlanStops(s, p.id, ['nope', a.id])).toEqual(s);
  });

  it('ignores blank checklist entries', () => {
    const p = plan();
    let s = actions.addSpendPlan(base(), p);
    s = actions.addChecklistItem(s, p.id, actions.newChecklistItem('   '));
    s = actions.addChecklistItem(s, p.id, actions.newChecklistItem(' Áo ấm '));
    expect(s.spendPlans[0].checklist).toEqual([expect.objectContaining({ text: 'Áo ấm' })]);
  });

  it('share ids are 32 hex characters and can be turned off', () => {
    const id = actions.newShareId();
    expect(id).toMatch(/^[a-f0-9]{32}$/);
    const p = plan();
    let s = actions.setPlanShare(actions.addSpendPlan(base(), p), p.id, id, 'USD');
    expect(s.spendPlans[0]).toMatchObject({ shareId: id, currency: 'USD' });
    s = actions.setPlanShare(s, p.id, undefined);
    expect(s.spendPlans[0].shareId).toBeUndefined();
  });
});

describe('planning together', () => {
  const plan = () =>
    actions.newSpendPlan({
      title: 'Đà Lạt',
      icon: '',
      startDate: '2026-11-20',
      people: 3,
      items: [],
    });

  it('turns on merging with an invite link and keeps the currency', () => {
    const p = plan();
    let s = actions.addSpendPlan(base(), p);
    s = actions.startTeamPlan(s, p.id, 'a'.repeat(32), 'USD');
    expect(s.spendPlans[0]).toMatchObject({
      collaborative: true,
      inviteId: 'a'.repeat(32),
      currency: 'USD',
    });
    s = actions.setTeamInvite(s, p.id, undefined);
    expect(s.spendPlans[0]).toMatchObject({ collaborative: true, inviteId: undefined });
  });

  it("tells a friend's plan apart from mine with the same id", () => {
    const mine = plan();
    const theirs = { ...mine, title: 'Their trip', ownerId: 'friend' };
    let s = actions.putPlan(actions.addSpendPlan(base(), mine), theirs);
    expect(s.spendPlans.map((p) => p.title)).toEqual(['Đà Lạt', 'Their trip']);
    s = actions.putPlan(s, { ...theirs, title: 'Renamed' });
    expect(s.spendPlans.map((p) => p.title)).toEqual(['Đà Lạt', 'Renamed']);
    s = actions.dropJoinedPlan(s, mine.id, 'friend');
    expect(s.spendPlans.map((p) => p.title)).toEqual(['Đà Lạt']);
  });

  it("never saves friends' plans or my shared ones through the normal sync", () => {
    const own = plan();
    const shared = { ...plan(), collaborative: true };
    const joined = { ...plan(), ownerId: 'friend' };
    const before = actions.addSpendPlan(base(), own);
    const after = { ...before, spendPlans: [{ ...own, title: 'x' }, shared, joined] };
    const changes = diffState(before, after);
    expect(changes?.upserts?.spendPlans?.map((p) => (p as { id: string }).id)).toEqual([own.id]);
    // Leaving a friend's plan doesn't delete it for them.
    expect(diffState(after, { ...after, spendPlans: [after.spendPlans[0], shared] })).toBeNull();
  });
});
