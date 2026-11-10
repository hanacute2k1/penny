/**
 * Currencies Penny can keep money in. Amounts are stored as whole numbers in the
 * currency's smallest unit (đồng, won, cents), so a currency with cents stores
 * $12.50 as 1250. Switching currency changes the unit, not the numbers: nothing
 * is converted.
 */
import { STORAGE_KEYS } from '@/lib/constants';

export const CURRENCIES = {
  VND: { decimals: 0, symbol: 'đ' },
  USD: { decimals: 2, symbol: '$' },
  EUR: { decimals: 2, symbol: '€' },
  KRW: { decimals: 0, symbol: '₩' },
  JPY: { decimals: 0, symbol: '¥' },
  THB: { decimals: 2, symbol: '฿' },
  SGD: { decimals: 2, symbol: 'S$' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/** Everything before this feature was VND, so that stays the default. */
export const DEFAULT_CURRENCY: CurrencyCode = 'VND';

export const CURRENCY_COOKIE = STORAGE_KEYS.currency;
const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && Object.hasOwn(CURRENCIES, value);
}

export function pickCurrency(saved: string | null | undefined): CurrencyCode {
  return isCurrency(saved) ? saved : DEFAULT_CURRENCY;
}

export function writeCurrencyCookie(currency: CurrencyCode) {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=${CURRENCY_COOKIE_MAX_AGE}; samesite=lax`;
}

/** Stored minor units → amount in the currency's main unit (1250 → 12.5 for USD). */
export function toMajor(amount: number, currency: CurrencyCode): number {
  return amount / 10 ** CURRENCIES[currency].decimals;
}

/** Main unit → stored minor units, rounded to what the currency can hold. */
export function toMinor(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * 10 ** CURRENCIES[currency].decimals);
}
