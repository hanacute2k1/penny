import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../seed';
import { applyReset, createStarterState, diffState, isEmptyState, EMPTY_STATE } from '../state';

describe('applyReset', () => {
  const demo = createInitialState();
  const month = demo.transactions[0].date.slice(0, 7);

  it('"all" goes back to a fresh account', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    expect(applyReset(demo, { kind: 'all' })).toEqual(createStarterState());
    vi.useRealTimers();
  });

  it('only removes the chosen kinds within the chosen months', () => {
    const s = applyReset(demo, {
      kind: 'months',
      months: [month],
      transactions: true,
      budgets: false,
    });
    expect(s.transactions.some((t) => t.date.startsWith(month))).toBe(false);
    expect(s.transportEntries.some((e) => e.date.startsWith(month))).toBe(false);
    expect(s.budgets).toEqual(demo.budgets);
  });
});

describe('diffState', () => {
  it('returns null when nothing changed', () => {
    const s = createStarterState();
    expect(diffState(s, s)).toBeNull();
  });

  it('upserts changed rows and deletes missing ones', () => {
    const before = createStarterState();
    const [first, ...rest] = before.categories;
    const after = { ...before, categories: [...rest.slice(1), { ...rest[0], name: 'Renamed' }] };
    const diff = diffState(before, after);
    expect(diff?.upserts?.categories).toEqual([{ ...rest[0], name: 'Renamed' }]);
    expect(diff?.deletes?.categories).toEqual([first.id]);
  });
});

it('isEmptyState', () => {
  expect(isEmptyState(EMPTY_STATE)).toBe(true);
  expect(isEmptyState(createStarterState())).toBe(false);
});
