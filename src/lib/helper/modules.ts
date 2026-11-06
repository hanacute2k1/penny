import { CHANGE_EVENTS, STORAGE_KEYS } from '@/lib/constants';
/**
 * Optional app sections the user can switch off in Settings.
 * Overview and Transactions are the core and always stay on.
 *
 * Hidden sections are written to <html data-hidden="plan transport"> (also by
 * the boot script in app/layout.tsx), and CSS hides every [data-module="…"]
 * element that matches — so nav items disappear before first paint.
 */
export const OPTIONAL_MODULES = ['budgets', 'plan', 'transport', 'reports'] as const;
export type AppModule = (typeof OPTIONAL_MODULES)[number];

export function isAppModule(value: string): value is AppModule {
  return (OPTIONAL_MODULES as readonly string[]).includes(value);
}

export function readHiddenModules(): AppModule[] {
  if (typeof document === 'undefined') return [];
  return (document.documentElement.dataset.hidden ?? '').split(' ').filter(isAppModule);
}

export function applyHiddenModules(hidden: AppModule[]) {
  document.documentElement.dataset.hidden = hidden.join(' ');
  localStorage.setItem(STORAGE_KEYS.hiddenModules, hidden.join(' '));
  window.dispatchEvent(new Event(CHANGE_EVENTS.hiddenModules));
}

export function subscribeHiddenModules(onChange: () => void) {
  window.addEventListener(CHANGE_EVENTS.hiddenModules, onChange);
  return () => window.removeEventListener(CHANGE_EVENTS.hiddenModules, onChange);
}
