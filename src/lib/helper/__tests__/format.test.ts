import { describe, expect, it } from 'vitest';
import {
  compactNumber,
  formatAmountText,
  formatMoney,
  parseAmountInput,
  readAmountInput,
} from '../format';
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
    expect(formatMoney(-45_000, { currency: 'VND', compact: true, locale: 'vi' })).toBe('-45k');
  });
});

describe('money in different currencies', () => {
  it('writes đồng the same as before', () => {
    expect(formatMoney(1_200_000, { currency: 'VND', locale: 'en' }).replace(/\s/g, ' ')).toBe(
      '1.200.000 ₫',
    );
  });

  it('stores cents and shows them only when there are some', () => {
    expect(formatMoney(1250, { currency: 'USD', locale: 'en' })).toBe('$12.50');
    expect(formatMoney(1200, { currency: 'USD', locale: 'en' })).toBe('$12');
    expect(formatMoney(10_000, { currency: 'KRW', locale: 'ko' })).toBe('₩10,000');
    expect(formatMoney(1250, { currency: 'USD', locale: 'vi' }).replace(/\s/g, ' ')).toBe(
      '12,50 $',
    );
    // Compact labels count in the main unit: $4,500 → 5k (like 45k for đồng).
    expect(formatMoney(450_000, { currency: 'USD', compact: true, locale: 'en' })).toBe('5k');
  });

  it('groups digits for amount fields', () => {
    expect(formatAmountText(1_200_000, 'VND')).toBe('1.200.000');
    expect(formatAmountText(123_456, 'USD')).toBe('1,234.56');
    expect(formatAmountText(120_000, 'USD')).toBe('1,200');
    expect(formatAmountText(5_000, 'KRW')).toBe('5,000');
  });
});

describe('reading typed amounts', () => {
  it('keeps digits only for currencies without cents', () => {
    expect(parseAmountInput('1.200.000 ₫', 'VND')).toBe(1_200_000);
    expect(parseAmountInput('abc', 'VND')).toBe(0);
    expect(readAmountInput('', 'VND')).toEqual({ value: null, text: '' });
    expect(readAmountInput('1200000', 'VND')).toEqual({ value: 1_200_000, text: '1.200.000' });
  });

  it('takes cents with a point or a comma, keeping what is typed', () => {
    expect(readAmountInput('12.', 'USD')).toEqual({ value: 1200, text: '12.' });
    expect(readAmountInput('12.5', 'USD')).toEqual({ value: 1250, text: '12.5' });
    expect(readAmountInput('12,5', 'USD')).toEqual({ value: 1250, text: '12.5' });
    expect(readAmountInput('1,234.567', 'USD')).toEqual({ value: 123_456, text: '1,234.56' });
    // A comma with three digits after it groups thousands.
    expect(readAmountInput('1,234', 'USD')).toEqual({ value: 123_400, text: '1,234' });
    expect(readAmountInput('.5', 'USD')).toEqual({ value: 50, text: '0.5' });
  });
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
