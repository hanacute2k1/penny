/** Keys in localStorage (and the locale cookie). Changing one resets that setting for everyone. */
export const STORAGE_KEYS = {
  theme: 'valoir-theme',
  textSize: 'valoir-text-size',
  glass: 'valoir-glass',
  locale: 'valoir-locale',
  currency: 'valoir-currency',
  hiddenModules: 'valoir-hidden-modules',
  entryMode: 'valoir-entry-mode',
  /** Data kept on the device by the app before accounts existed. */
  legacyData: 'valoir-expense-v7',
} as const;

/** Window events used to tell React that a setting stored outside it has changed. */
export const CHANGE_EVENTS = {
  appearance: 'valoir-appearance',
  hiddenModules: 'valoir-hidden-modules',
} as const;

/** Built-in categories the app relies on. */
export const CATEGORY_IDS = {
  otherExpense: 'c-other',
  otherIncome: 'c-other-in',
  transport: 'c-transport',
} as const;

/** Saving to the server: edits within SAVE_DELAY share one request; failures retry with backoff. */
export const SYNC = {
  saveDelayMs: 400,
  firstRetryMs: 2000,
  maxRetryMs: 30_000,
} as const;
