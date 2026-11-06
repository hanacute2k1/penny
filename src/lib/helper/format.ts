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

export function formatVnd(amount: number, opts?: { compact?: boolean; locale?: Locale }): string {
  const abs = Math.abs(amount);
  const locale = opts?.locale ?? 'en';

  if (opts?.compact && abs >= 1_000) {
    const text = compactNumber(abs, locale);
    return amount < 0 ? `-${text}` : text;
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSignedVnd(amount: number, type: 'expense' | 'income'): string {
  const formatted = formatVnd(amount);
  return type === 'expense'
    ? `-${formatted.replace('₫', '').trim()}đ`
    : `+${formatted.replace('₫', '').trim()}đ`;
}

export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number(digits);
}
