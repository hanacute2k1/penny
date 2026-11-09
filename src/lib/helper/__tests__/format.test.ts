import { describe, expect, it } from 'vitest';
import { compactNumber, formatVnd, parseAmountInput } from '../format';
import { summarizeSpendPlan } from '../spendPlans';

describe('compactNumber', () => {
  it('uses each language’s own units', () => {
    expect(compactNumber(4_500_000, 'vi')).toBe('4.5tr');
    expect(compactNumber(4_500_000, 'en')).toBe('4.5M');
    expect(compactNumber(4_470_000, 'ko')).toBe('447만');
    expect(compactNumber(250_000_000, 'ko')).toBe('2.5억');
    expect(compactNumber(45_000, 'vi')).toBe('45k');
  });

  it('keeps the sign in compact money', () => {
    expect(formatVnd(-45_000, { compact: true, locale: 'vi' })).toBe('-45k');
  });
});

it('parseAmountInput keeps digits only', () => {
  expect(parseAmountInput('1.200.000 ₫')).toBe(1_200_000);
  expect(parseAmountInput('abc')).toBe(0);
});

describe('summarizeSpendPlan', () => {
  it('compares only the items that have been filled in', () => {
    const summary = summarizeSpendPlan({
      items: [
        {
          id: '1',
          name: 'A',
          categoryId: 'c',
          deposit: 0,
          estimate: 100,
          actual: 120,
          isExtra: false,
        },
        {
          id: '2',
          name: 'B',
          categoryId: 'c',
          deposit: 0,
          estimate: 80,
          actual: null,
          isExtra: false,
        },
      ],
    });
    expect(summary.diff).toBe(-20);
    expect(summary.estimate).toBe(180);
  });
});
