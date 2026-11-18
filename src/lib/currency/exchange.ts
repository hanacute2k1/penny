/**
 * Money exchange for travel: currencies people change into, their banknotes,
 * and conversion with rates quoted against USD. Separate from the account
 * currency (`CURRENCIES`), which is what Penny stores amounts in.
 */
import type { Locale } from '@/lib/i18n';

type FxInfo = {
  /** Digits after the point when typing or showing an amount. */
  decimals: number;
  /** Banknotes in circulation, in the main unit, smallest first. */
  notes: readonly number[];
  flag: string;
};

export const FX_CURRENCIES = {
  VND: {
    decimals: 0,
    notes: [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000],
    flag: '🇻🇳',
  },
  USD: { decimals: 2, notes: [1, 2, 5, 10, 20, 50, 100], flag: '🇺🇸' },
  EUR: { decimals: 2, notes: [5, 10, 20, 50, 100, 200], flag: '🇪🇺' },
  KRW: { decimals: 0, notes: [1000, 5000, 10000, 50000], flag: '🇰🇷' },
  JPY: { decimals: 0, notes: [1000, 5000, 10000], flag: '🇯🇵' },
  CNY: { decimals: 2, notes: [1, 5, 10, 20, 50, 100], flag: '🇨🇳' },
  TWD: { decimals: 0, notes: [100, 200, 500, 1000, 2000], flag: '🇹🇼' },
  HKD: { decimals: 2, notes: [10, 20, 50, 100, 500, 1000], flag: '🇭🇰' },
  THB: { decimals: 2, notes: [20, 50, 100, 500, 1000], flag: '🇹🇭' },
  SGD: { decimals: 2, notes: [2, 5, 10, 50, 100], flag: '🇸🇬' },
  MYR: { decimals: 2, notes: [1, 5, 10, 20, 50, 100], flag: '🇲🇾' },
  IDR: {
    decimals: 0,
    notes: [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    flag: '🇮🇩',
  },
  PHP: { decimals: 2, notes: [20, 50, 100, 200, 500, 1000], flag: '🇵🇭' },
  LAK: {
    decimals: 0,
    notes: [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    flag: '🇱🇦',
  },
  KHR: {
    decimals: 0,
    notes: [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
    flag: '🇰🇭',
  },
  INR: { decimals: 2, notes: [10, 20, 50, 100, 200, 500], flag: '🇮🇳' },
  AUD: { decimals: 2, notes: [5, 10, 20, 50, 100], flag: '🇦🇺' },
  NZD: { decimals: 2, notes: [5, 10, 20, 50, 100], flag: '🇳🇿' },
  GBP: { decimals: 2, notes: [5, 10, 20, 50], flag: '🇬🇧' },
  CHF: { decimals: 2, notes: [10, 20, 50, 100, 200, 1000], flag: '🇨🇭' },
  CAD: { decimals: 2, notes: [5, 10, 20, 50, 100], flag: '🇨🇦' },
  AED: { decimals: 2, notes: [5, 10, 20, 50, 100, 200, 500], flag: '🇦🇪' },
  TRY: { decimals: 2, notes: [5, 10, 20, 50, 100, 200], flag: '🇹🇷' },
} as const satisfies Record<string, FxInfo>;

export type FxCode = keyof typeof FX_CURRENCIES;

export const FX_CODES = Object.keys(FX_CURRENCIES) as FxCode[];

export function isFxCode(value: unknown): value is FxCode {
  return typeof value === 'string' && Object.hasOwn(FX_CURRENCIES, value);
}

/** Units of each currency that one US dollar buys. */
export type UsdRates = Partial<Record<FxCode, number>>;

export type RatesSnapshot = {
  rates: UsdRates;
  /** When the source last updated these rates (ISO). */
  updatedAt: string;
};

/** How many `to` one `from` buys, or null when either rate is missing. */
export function rateBetween(from: FxCode, to: FxCode, rates: UsdRates): number | null {
  if (from === to) return 1;
  const a = rates[from];
  const b = rates[to];
  return a && b ? b / a : null;
}

export function convert(amount: number, from: FxCode, to: FxCode, rates: UsdRates): number | null {
  const rate = rateBetween(from, to, rates);
  return rate === null ? null : amount * rate;
}

/** Keeps only the currencies Penny offers, and only sensible rates. */
export function pickRates(raw: Record<string, unknown>): UsdRates {
  const rates: UsdRates = {};
  for (const code of FX_CODES) {
    const value = raw[code] ?? raw[code.toLowerCase()];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value;
  }
  return rates;
}

const NUMBER_LOCALES: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' };

/**
 * "25.716 ₫", "$12.50", "₩1,336". Small amounts keep more digits so a rate like
 * 0.000039 doesn't show as 0.
 */
export function formatFx(amount: number, code: FxCode, locale: Locale): string {
  const abs = Math.abs(amount);
  const { decimals } = FX_CURRENCIES[code];
  const base = {
    style: 'currency',
    currency: code,
    currencyDisplay: code === 'VND' ? 'symbol' : 'narrowSymbol',
  } as const;
  const format = (options: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(code === 'VND' ? 'vi-VN' : NUMBER_LOCALES[locale], {
      ...base,
      ...options,
    }).format(amount);
  // Under one unit: three significant digits ("$0.0000389", "0,52 ₫").
  if (abs > 0 && abs < 1) return format({ maximumSignificantDigits: 3 });
  // Rates like 18.64 ₫ per won need their decimals even in đồng.
  const digits = abs < 100 ? Math.max(decimals, 2) : decimals;
  return format({
    minimumFractionDigits: Number.isInteger(amount) ? 0 : Math.min(digits, decimals),
    maximumFractionDigits: digits,
  });
}

/** Banknote label without the currency sign: "500.000" (đồng), "10,000". */
export function formatNote(value: number, code: FxCode): string {
  return new Intl.NumberFormat(code === 'VND' ? 'vi-VN' : 'en-US').format(value);
}

/** "Korean won" / "Won Hàn Quốc" / "대한민국 원", falling back to the code. */
export function currencyName(code: FxCode, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** An amount as the input shows it, rounded to what the currency takes: "1.200.000", "12.5". */
export function fxInputText(value: number, code: FxCode): { value: number; text: string } {
  const { decimals } = FX_CURRENCIES[code];
  const [whole, fraction = ''] = Math.abs(value).toFixed(decimals).split('.');
  const trimmed = fraction.replace(/0+$/, '');
  const read = readFxInput(trimmed ? `${whole}.${trimmed}` : whole, code);
  return { value: read.value ?? 0, text: read.text };
}

/**
 * Reads a typed amount (main unit) and the text to show back, grouped as you
 * type. "." is the decimal mark, and so is a "," followed by at most two digits.
 * Currencies without cents take whole numbers only.
 */
export function readFxInput(raw: string, code: FxCode): { value: number | null; text: string } {
  const { decimals } = FX_CURRENCIES[code];
  const cleaned = raw.replace(/[^\d.,]/g, '');
  let point = -1;
  if (decimals) {
    point = cleaned.lastIndexOf('.');
    const comma = cleaned.lastIndexOf(',');
    // In đồng-style grouping "." separates thousands, so only "," can be a decimal mark.
    if (point >= 0 && cleaned.length - point - 1 === 3) point = -1;
    if (point < 0 && comma >= 0 && cleaned.length - comma - 1 <= decimals) point = comma;
  }
  const whole = (point < 0 ? cleaned : cleaned.slice(0, point)).replace(/\D/g, '').slice(0, 15);
  const fraction =
    point < 0
      ? ''
      : cleaned
          .slice(point + 1)
          .replace(/\D/g, '')
          .slice(0, decimals);
  if (!whole && point < 0) return { value: null, text: '' };
  const sep = code === 'VND' ? '.' : ',';
  const grouped = (whole || '0').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return {
    value: Number(`${whole || '0'}.${fraction || '0'}`),
    text: point < 0 ? grouped : `${grouped}.${fraction}`,
  };
}
