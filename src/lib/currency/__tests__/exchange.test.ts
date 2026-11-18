import { describe, expect, it } from 'vitest';
import { convert, formatFx, fxInputText, pickRates, rateBetween, readFxInput } from '../exchange';

const rates = pickRates({ USD: 1, VND: 25000, KRW: 1250, EUR: 0.8, XYZ: 3, JPY: -1 });

describe('pickRates', () => {
  it('keeps known currencies with positive rates, upper or lower case', () => {
    expect(rates).toEqual({ USD: 1, VND: 25000, KRW: 1250, EUR: 0.8 });
    expect(pickRates({ vnd: 25000 })).toEqual({ VND: 25000 });
  });
});

describe('rateBetween / convert', () => {
  it('crosses two currencies through USD', () => {
    expect(rateBetween('KRW', 'VND', rates)).toBe(20);
    expect(convert(50000, 'KRW', 'VND', rates)).toBe(1_000_000);
    expect(convert(100, 'EUR', 'USD', rates)).toBeCloseTo(125);
  });

  it('is 1 for the same currency and null when a rate is missing', () => {
    expect(rateBetween('THB', 'THB', rates)).toBe(1);
    expect(rateBetween('THB', 'VND', rates)).toBeNull();
    expect(convert(10, 'VND', 'JPY', rates)).toBeNull();
  });
});

describe('readFxInput', () => {
  it('groups whole numbers the way each currency is written', () => {
    expect(readFxInput('1200000', 'VND')).toEqual({ value: 1_200_000, text: '1.200.000' });
    expect(readFxInput('50000', 'KRW')).toEqual({ value: 50000, text: '50,000' });
  });

  it('takes cents with "." or a "," before at most two digits', () => {
    expect(readFxInput('12.5', 'USD')).toEqual({ value: 12.5, text: '12.5' });
    expect(readFxInput('12,50', 'EUR')).toEqual({ value: 12.5, text: '12.50' });
    expect(readFxInput('1,200', 'USD')).toEqual({ value: 1200, text: '1,200' });
  });

  it('ignores a decimal mark for currencies without cents', () => {
    expect(readFxInput('12.5', 'KRW').value).toBe(125);
  });

  it('is empty for nothing typed', () => {
    expect(readFxInput('', 'USD')).toEqual({ value: null, text: '' });
  });
});

describe('fxInputText', () => {
  it('rounds to what the currency takes', () => {
    expect(fxInputText(12.5, 'KRW')).toEqual({ value: 13, text: '13' });
    expect(fxInputText(12.5, 'USD')).toEqual({ value: 12.5, text: '12.5' });
    expect(fxInputText(500000, 'VND')).toEqual({ value: 500000, text: '500.000' });
  });
});

describe('formatFx', () => {
  it('keeps digits for tiny amounts so they are not shown as 0', () => {
    expect(formatFx(0.0000389, 'USD', 'en')).toBe('$0.0000389');
    expect(formatFx(18.64, 'VND', 'en')).toBe('18,64\u00a0₫');
    expect(formatFx(1_000_000, 'VND', 'en')).toBe('1.000.000\u00a0₫');
    expect(formatFx(12.5, 'USD', 'en')).toBe('$12.50');
  });
});
