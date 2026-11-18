import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/lib/type';
import { monthPeriod, summarizePeriod, yearPeriod } from '../period';

const tx = (date: string, amount: number, type: 'income' | 'expense', categoryId = 'c-food') =>
  ({ id: `${date}-${amount}`, date, amount, type, categoryId, createdAt: date }) as Transaction;

const data = [
  tx('2026-10-31', 999, 'expense'),
  tx('2026-11-01', 1000, 'income', 'c-salary'),
  tx('2026-11-02', 300, 'expense'),
  tx('2026-11-02', 200, 'expense', 'c-taxi'),
  tx('2026-11-30', 800, 'expense', 'c-taxi'),
  tx('2026-12-01', 50, 'expense'),
];

describe('periods', () => {
  it('covers whole months and years', () => {
    expect(monthPeriod('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(yearPeriod(2026)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('sums only what is inside, with the gap and per-category spending', () => {
    const s = summarizePeriod(data, monthPeriod('2026-11'));
    expect(s.income).toBe(1000);
    expect(s.expense).toBe(1300);
    expect(s.net).toBe(-300);
    expect(s.count).toBe(4);
    expect(s.days).toBe(30);
    expect(s.byCategory).toEqual([
      { categoryId: 'c-taxi', amount: 1000 },
      { categoryId: 'c-food', amount: 300 },
    ]);
  });

  it('draws short periods by day, including empty days', () => {
    const s = summarizePeriod(data, monthPeriod('2026-11'));
    expect(s.unit).toBe('day');
    expect(s.series).toHaveLength(30);
    expect(s.series[1]).toEqual({ key: '2026-11-02', income: 0, expense: 500 });
  });

  it('draws long periods by month', () => {
    const s = summarizePeriod(data, yearPeriod(2026));
    expect(s.unit).toBe('month');
    expect(s.series.map((p) => p.key)).toHaveLength(12);
    expect(s.series[10]).toEqual({ key: '2026-11', income: 1000, expense: 1300 });
    expect(s.series[11].expense).toBe(50);
  });

  it('accepts the ends picked backwards', () => {
    const s = summarizePeriod(data, { from: '2026-11-02', to: '2026-11-01' });
    expect(s.days).toBe(2);
    expect(s.expense).toBe(500);
  });
});
