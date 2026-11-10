import { CURRENCIES, toMajor, type CurrencyCode } from '@/lib/currency';
import type { Locale } from '@/lib/i18n';

/**
 * Short money label without currency sign: "4.5tr" (vi), "4.5M" (en),
 * "447만" (ko — Korean counts in units of 10,000 and 100,000,000).
 */
export function compactNumber(abs: number, locale: Locale): string {
  const oneDecimal = (n: number) =>
    n >= 10 ? String(Math.round(n)) : n.toFixed(n % 1 === 0 ? 0 : 1);
  if (locale === 'ko') {
    if (abs >= 100_000_000) return `${oneDecimal(abs / 100_000_000)}억`;
    if (abs >= 10_000) return `${Math.round(abs / 10_000).toLocaleString('ko-KR')}만`;
    if (abs >= 1_000) return `${Math.round(abs / 1_000)}천`;
    return String(abs);
  }
  if (abs >= 1_000_000) return `${oneDecimal(abs / 1_000_000)}${locale === 'vi' ? 'tr' : 'M'}`;
  if (abs >= 1_000) return `${Math.round(abs / 1_000)}k`;
  return String(abs);
}

const NUMBER_LOCALES: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' };

/**
 * Money for reading: "1.200.000 ₫", "$12.50", "₩10,000"; compact "4.5tr" / "4.5M" /
 * "447만" (no sign, for tight spots). `amount` is in stored minor units.
 */
export function formatMoney(
  amount: number,
  opts: { currency: CurrencyCode; compact?: boolean; locale?: Locale },
): string {
  const { currency } = opts;
  const locale = opts.locale ?? 'en';
  const major = toMajor(amount, currency);
  const abs = Math.abs(major);

  if (opts.compact && abs >= 1_000) {
    const text = compactNumber(abs, locale);
    return major < 0 ? `-${text}` : text;
  }

  // VND has always been written the Vietnamese way, whatever the language.
  const numberLocale = currency === 'VND' ? 'vi-VN' : NUMBER_LOCALES[locale];
  const decimals = Number.isInteger(major) ? 0 : CURRENCIES[currency].decimals;
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency,
    // "$" rather than "US$" in Vietnamese; đồng keeps its usual "₫".
    currencyDisplay: currency === 'VND' ? 'symbol' : 'narrowSymbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(major);
}

/** Separator between thousands in typed amounts: "1.200.000" for đồng, "1,200" elsewhere. */
const groupSeparator = (currency: CurrencyCode) => (currency === 'VND' ? '.' : ',');

function groupDigits(digits: string, currency: CurrencyCode): string {
  const trimmed = digits.replace(/^0+(?=\d)/, '');
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator(currency));
}

/** Plain number for amount fields and rows that show the unit beside it: "1.200.000", "12.50". */
export function formatAmountText(amount: number, currency: CurrencyCode): string {
  const { decimals } = CURRENCIES[currency];
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  const whole = groupDigits(String(Math.floor(abs / 10 ** decimals)), currency);
  const cents = decimals ? abs % 10 ** decimals : 0;
  return cents ? `${sign}${whole}.${String(cents).padStart(decimals, '0')}` : `${sign}${whole}`;
}

/**
 * Reads what is typed in an amount field: the stored value (minor units, null
 * when empty) and the text to show back, grouped as you type. For currencies
 * with cents, "." is the decimal mark, and so is a "," followed by at most two
 * digits ("12,5" on keyboards that offer a comma); anything past two decimals
 * is dropped.
 */
export function readAmountInput(
  raw: string,
  currency: CurrencyCode,
): { value: number | null; text: string } {
  const { decimals } = CURRENCIES[currency];
  const cleaned = raw.replace(/[^\d.,]/g, '');
  let point = -1;
  if (decimals) {
    point = cleaned.lastIndexOf('.');
    const comma = cleaned.lastIndexOf(',');
    if (point < 0 && comma >= 0 && cleaned.length - comma - 1 <= decimals) point = comma;
  }
  const whole = (point < 0 ? cleaned : cleaned.slice(0, point)).replace(/\D/g, '');
  const fraction =
    point < 0
      ? ''
      : cleaned
          .slice(point + 1)
          .replace(/\D/g, '')
          .slice(0, decimals);
  if (!whole && point < 0) return { value: null, text: '' };
  const value =
    Number(whole || '0') * 10 ** decimals + Number(fraction.padEnd(decimals, '0') || '0');
  const text = `${groupDigits(whole || '0', currency)}${point < 0 ? '' : `.${fraction}`}`;
  return { value, text };
}

/** Stored value (minor units) of what is typed; 0 when empty. */
export function parseAmountInput(raw: string, currency: CurrencyCode): number {
  return readAmountInput(raw, currency).value ?? 0;
}

/** Phone keyboard for amount fields: with a decimal key only for currencies with cents. */
export function amountInputMode(currency: CurrencyCode): 'decimal' | 'numeric' {
  return CURRENCIES[currency].decimals ? 'decimal' : 'numeric';
}
