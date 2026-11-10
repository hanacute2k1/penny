'use client';

import { STORAGE_KEYS } from '@/lib/constants';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Category } from '@/lib/type';
import {
  CURRENCIES,
  isCurrency,
  pickCurrency,
  writeCurrencyCookie,
  type CurrencyCode,
} from '@/lib/currency';
import { formatMoney } from '@/lib/helper/format';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  LOCALE_COOKIE,
  dictionaries,
  interpolate,
  isLocale,
  writeLocaleCookie,
  type Dictionary,
  type Locale,
} from '@/lib/i18n';

type I18nValue = {
  locale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  tx: (template: string, vars?: Record<string, string | number>) => string;
  categoryName: (category: Pick<Category, 'id' | 'name'>) => string;
  /** The unit money is kept in. Changing it relabels amounts; nothing is converted. */
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  /** Shown next to amount fields: "đ", "$", "₩". */
  currencySymbol: string;
  /** Amount (stored minor units) in the current currency and language. */
  money: (amount: number, opts?: { compact?: boolean }) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  initialLocale,
  initialCurrency,
  children,
}: {
  /** Resolved on the server from the cookie / Accept-Language, so the first paint is already right. */
  initialLocale: Locale;
  /** From the currency cookie; the account's saved choice replaces it once known. */
  initialCurrency: CurrencyCode;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  // pickCurrency guards against an unknown code (e.g. one removed from the list later).
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => pickCurrency(initialCurrency));

  // The account remembers the currency, so a new device shows money in the right
  // unit; the cookie only makes the first paint right on this one.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const saved = data.user?.user_metadata?.currency;
        if (!cancelled && isCurrency(saved)) setCurrencyState(saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeCurrencyCookie(currency);
  }, [currency]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && data.user.user_metadata?.currency !== next) {
        void supabase.auth.updateUser({ data: { currency: next } });
      }
    });
  }, []);

  const checkedLegacy = useRef(false);

  useEffect(() => {
    // One-time migration: a choice saved before the cookie existed lives only in
    // localStorage. Write the cookie and reload once so the server renders it.
    if (!checkedLegacy.current) {
      checkedLegacy.current = true;
      const saved = localStorage.getItem(STORAGE_KEYS.locale);
      const hasCookie = document.cookie
        .split('; ')
        .some((part) => part.startsWith(`${LOCALE_COOKIE}=`));
      if (!hasCookie && isLocale(saved) && saved !== locale) {
        writeLocaleCookie(saved);
        window.location.reload();
        return;
      }
    }
    localStorage.setItem(STORAGE_KEYS.locale, locale);
    writeLocaleCookie(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = dictionaries[locale];

  const tx = useCallback(
    (template: string, vars?: Record<string, string | number>) => interpolate(template, vars),
    [],
  );

  const categoryName = useCallback(
    (category: Pick<Category, 'id' | 'name'>) => {
      const id = category.id as keyof typeof t.categoryNames;
      // Built-in categories are stored with their English name; translate those only
      // while the user hasn't renamed them.
      const untouched = dictionaries.en.categoryNames[id] === category.name;
      return (untouched && t.categoryNames[id]) || category.name;
    },
    [t],
  );

  const money = useCallback(
    (amount: number, opts?: { compact?: boolean }) =>
      formatMoney(amount, { currency, locale, compact: opts?.compact }),
    [currency, locale],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      ready: true,
      setLocale,
      t,
      tx,
      categoryName,
      currency,
      setCurrency,
      currencySymbol: CURRENCIES[currency].symbol,
      money,
    }),
    [locale, setLocale, t, tx, categoryName, currency, setCurrency, money],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/**
 * Shows money inside in another currency: a plan friends share is in its
 * owner's currency, whatever each friend picked for themselves.
 */
export function CurrencyScope({
  currency,
  children,
}: {
  /** Left out: no change. */
  currency?: CurrencyCode;
  children: ReactNode;
}) {
  const parent = useI18n();
  const value = useMemo<I18nValue>(() => {
    if (!currency || currency === parent.currency) return parent;
    return {
      ...parent,
      currency,
      currencySymbol: CURRENCIES[currency].symbol,
      money: (amount, opts) =>
        formatMoney(amount, { currency, locale: parent.locale, compact: opts?.compact }),
    };
  }, [currency, parent]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
