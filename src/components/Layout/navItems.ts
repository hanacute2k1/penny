import type { Dictionary } from '@/lib/i18n';
import type { IconName } from '@/components/Base/Icon';
import type { AppModule } from '@/lib/helper/modules';

export const NAV_HREFS = [
  '/',
  '/transport',
  '/transactions',
  '/budgets',
  '/plan',
  '/reports',
] as const;

export function navItems(t: Dictionary) {
  return [
    { href: '/', label: t.nav.overview, icon: 'home', module: null },
    { href: '/transactions', label: t.nav.activity, icon: 'list', module: null },
    { href: '/budgets', label: t.nav.budget, icon: 'wallet', module: 'budgets' },
    { href: '/plan', label: t.nav.plans, icon: 'plan', module: 'plan' },
    { href: '/transport', label: t.nav.transport, icon: 'transport', module: 'transport' },
    { href: '/reports', label: t.nav.reports, icon: 'chart', module: 'reports' },
  ] as const satisfies ReadonlyArray<{
    href: (typeof NAV_HREFS)[number];
    label: string;
    icon: IconName;
    /** null = core section, always shown. */
    module: AppModule | null;
  }>;
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
