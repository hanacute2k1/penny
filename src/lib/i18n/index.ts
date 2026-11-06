import { STORAGE_KEYS } from '@/lib/constants';
import { en, type Dictionary } from '@/lib/i18n/dictionaries/en';
import { vi } from '@/lib/i18n/dictionaries/vi';
import { ko } from '@/lib/i18n/dictionaries/ko';

export type Locale = 'en' | 'vi' | 'ko';

export const LOCALES: Locale[] = ['vi', 'en', 'ko'];
export const DEFAULT_LOCALE: Locale = 'en';
/** Same name as the storage key; the cookie lets the server render the right language. */
export const LOCALE_COOKIE = STORAGE_KEYS.locale;
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Saved choice first, otherwise the first supported language in the browser's
 * preference list (Accept-Language, e.g. "ko-KR,ko;q=0.9,en;q=0.8").
 */
export function pickLocale(
  saved: string | null | undefined,
  browserLanguage: string | null | undefined,
): Locale {
  if (isLocale(saved)) return saved;
  for (const part of (browserLanguage ?? '').split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export const dictionaries: Record<Locale, Dictionary> = { en, vi, ko };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'vi' || value === 'ko';
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export type { Dictionary };
