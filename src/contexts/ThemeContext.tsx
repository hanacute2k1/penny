'use client';

import { CHANGE_EVENTS, STORAGE_KEYS } from '@/lib/constants';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  DEFAULT_THEME,
  TEXT_SIZE_DEFAULT,
  applyGlass,
  applyTextSize,
  applyTheme,
  clampTextSize,
  isTheme,
  parseTextSize,
  type TextSize,
  type Theme,
} from '@/lib/theme';

type ThemeValue = {
  theme: Theme;
  ready: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  glass: boolean;
  toggleGlass: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

/*
 * Appearance lives on <html> (set before paint by the boot script in app/layout.tsx)
 * and in localStorage. React reads it as an external store, so there's no
 * copy-into-state effect, and the server render simply uses the defaults.
 */
const notify = () => window.dispatchEvent(new Event(CHANGE_EVENTS.appearance));

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  // Follow the system setting until the user picks light or dark themselves.
  const onSystemChange = () => {
    if (isTheme(localStorage.getItem(STORAGE_KEYS.theme))) return;
    applyTheme(media.matches ? 'dark' : 'light');
    onChange();
  };
  window.addEventListener(CHANGE_EVENTS.appearance, onChange);
  media.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(CHANGE_EVENTS.appearance, onChange);
    media.removeEventListener('change', onSystemChange);
  };
}

const readTheme = (): Theme => {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
};
const readTextSize = () => parseTextSize(localStorage.getItem(STORAGE_KEYS.textSize));
const readGlass = () => document.documentElement.dataset.glass === 'on';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);
  const textSize = useSyncExternalStore(subscribe, readTextSize, () => TEXT_SIZE_DEFAULT);
  const glass = useSyncExternalStore(subscribe, readGlass, () => false);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    notify();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const setTextSize = useCallback((next: TextSize) => {
    const size = clampTextSize(next);
    applyTextSize(size);
    localStorage.setItem(STORAGE_KEYS.textSize, String(size));
    notify();
  }, []);

  const toggleGlass = useCallback(() => {
    const next = !readGlass();
    applyGlass(next);
    localStorage.setItem(STORAGE_KEYS.glass, next ? 'on' : 'off');
    notify();
  }, []);

  const value = useMemo(
    () => ({ theme, ready, setTheme, toggleTheme, textSize, setTextSize, glass, toggleGlass }),
    [theme, ready, setTheme, toggleTheme, textSize, setTextSize, glass, toggleGlass],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
