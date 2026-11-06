import { STORAGE_KEYS } from '@/lib/constants';
import { themeTokens } from './tokens';

export type Theme = 'light' | 'dark';
/** Text scale in percent of the browser default (100 = normal). */
export type TextSize = number;

export const THEMES: Theme[] = ['light', 'dark'];
export const DEFAULT_THEME: Theme = 'light';

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export const TEXT_SIZE_MIN = 90;
export const TEXT_SIZE_MAX = 130;
export const TEXT_SIZE_STEP = 5;
export const TEXT_SIZE_DEFAULT = 100;
/** The old two-option setting stored "large" (112.5%); map it to the nearest step. */
const LEGACY_LARGE = 115;

export function clampTextSize(value: number): TextSize {
  const stepped = Math.round(value / TEXT_SIZE_STEP) * TEXT_SIZE_STEP;
  return Math.min(TEXT_SIZE_MAX, Math.max(TEXT_SIZE_MIN, stepped));
}

/** Reads a saved value: a percent ("115"), or the legacy "normal" / "large". */
export function parseTextSize(saved: string | null | undefined): TextSize {
  if (saved === 'large') return LEGACY_LARGE;
  const n = Number(saved);
  return saved && Number.isFinite(n) ? clampTextSize(n) : TEXT_SIZE_DEFAULT;
}

export function resolvePreferredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (isTheme(saved)) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  const tokens = themeTokens[theme];
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}

/** Scales the root font-size; every rem-based size in the UI grows with it. */
export function applyTextSize(size: TextSize) {
  document.documentElement.style.setProperty('--text-scale', `${size}%`);
}

/** Liquid Glass is a layer on top of light/dark, not a third theme. */
export function applyGlass(on: boolean) {
  document.documentElement.dataset.glass = on ? 'on' : 'off';
}
