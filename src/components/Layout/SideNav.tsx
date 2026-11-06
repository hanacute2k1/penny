'use client';

import { BrandMark } from '@/components/Base/BrandMark';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { Icon } from '@/components/Base/Icon';
import { isNavActive, navItems } from './navItems';

export function SideNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const month = searchParams.get('month');
  const qs = month ? `?month=${month}` : '';
  const settingsActive = pathname.startsWith('/settings');

  const linkClass = (active: boolean) =>
    `tap flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] font-medium ${
      active
        ? 'bg-accent-soft font-semibold text-accent-deep'
        : 'text-ink-soft hover:bg-paper hover:text-ink'
    }`;

  return (
    <aside className="side-bar fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] flex-col border-r border-line bg-surface px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <BrandMark size={36} />
        <span className="text-lg font-semibold tracking-tight">{t.brand}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems(t).map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={`${item.href}${qs}`}
              data-module={item.module ?? undefined}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        aria-current={settingsActive ? 'page' : undefined}
        className={linkClass(settingsActive)}
      >
        <Icon name="settings" />
        {t.settings.title}
      </Link>
    </aside>
  );
}
