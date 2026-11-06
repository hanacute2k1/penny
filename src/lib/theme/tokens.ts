import type { Theme } from './index';

/**
 * Monochrome palette: charcoal + black, no hue. The "accent" is just the
 * strongest neutral (charcoal in light, near-white in dark).
 * Coral is a muted red reserved for "over budget" / delete only; --income is
 * a calm green for money coming in. Pastel chart/category hues live in globals.css.
 * Single source of truth: the boot script in app/layout.tsx serialises this.
 */
export const themeTokens: Record<Theme, Record<string, string>> = {
  light: {
    '--ink': '#111113',
    '--ink-soft': '#3a3a3c',
    '--ink-muted': '#6c6c70',
    '--paper': '#f1f4f9',
    '--paper-2': '#e3e7ef',
    '--surface': '#ffffff',
    '--surface-solid': '#ffffff',
    '--line': 'rgba(0, 0, 0, 0.1)',
    '--accent': '#2c2c2e',
    '--accent-deep': '#111113',
    '--accent-soft': '#e8e8ea',
    '--coral': '#b3261e',
    '--coral-soft': '#f6e9e8',
    '--amber': '#2c2c2e',
    '--amber-soft': '#e8e8ea',
    '--btn': '#111113',
    '--on-btn': '#ffffff',
    '--income': '#2f7a4d',
    '--glow-a': '#f1f4f9',
    '--glow-b': '#e8e8ea',
    '--shadow': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  dark: {
    '--ink': '#f2f2f2',
    '--ink-soft': '#c7c7cc',
    '--ink-muted': '#8e8e93',
    '--paper': '#0b0d12',
    '--paper-2': '#2c2c2e',
    '--surface': '#1c1c1e',
    '--surface-solid': '#1c1c1e',
    '--line': 'rgba(255, 255, 255, 0.1)',
    '--accent': '#d1d1d6',
    '--accent-deep': '#f2f2f2',
    '--accent-soft': '#2c2c2e',
    '--coral': '#e5867f',
    '--coral-soft': '#33201f',
    '--amber': '#d1d1d6',
    '--amber-soft': '#2c2c2e',
    '--btn': '#e5e5ea',
    '--on-btn': '#000000',
    '--income': '#8fd3a6',
    '--glow-a': '#1c1c1e',
    '--glow-b': '#2c2c2e',
    '--shadow': '0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.22)',
  },
};
