import type { Dictionary } from '@/lib/i18n';
import type { IconName } from '@/components/Base/Icon';

/** The app's three sections. */
export function navItems(t: Dictionary) {
  return [
    { href: '/', label: t.nav.overview, icon: 'home' },
    { href: '/transactions', label: t.nav.activity, icon: 'list' },
    { href: '/plan', label: t.nav.plans, icon: 'plan' },
  ] as const satisfies ReadonlyArray<{ href: string; label: string; icon: IconName }>;
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
