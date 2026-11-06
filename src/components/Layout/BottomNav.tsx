'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { Icon } from '@/components/Base/Icon';
import { isNavActive, navItems } from './navItems';

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const month = searchParams.get('month');
  const qs = month ? `?month=${month}` : '';

  return (
    <nav
      className="bottom-bar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-0.5 pt-1.5 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between">
        {navItems(t).map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={`${item.href}${qs}`}
              data-module={item.module ?? undefined}
              aria-current={active ? 'page' : undefined}
              className={`tap flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-1 ${
                active ? 'text-accent-deep' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span
                className={`grid h-8 w-12 place-items-center rounded-full ${
                  active ? 'bg-accent-soft' : ''
                }`}
              >
                <Icon name={item.icon} size={22} />
              </span>
              <span
                className={`max-w-full truncate text-[11px] leading-4 tracking-tight ${
                  active ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
