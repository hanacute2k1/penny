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
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  /** Resolved on the server from the cookie / Accept-Language, so the first paint is already right. */
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

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

  const value = useMemo<I18nValue>(
    () => ({ locale, ready: true, setLocale, t, tx, categoryName }),
    [locale, setLocale, t, tx, categoryName],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
