'use client';

import { Suspense, type ReactNode } from 'react';
import { EnsureRecurring } from '@/components/FixedCosts/EnsureRecurring';
import { BottomNav } from './BottomNav';
import { MonthPicker } from './MonthPicker';
import { SideNav } from './SideNav';
import { LoadErrorPanel, SyncNotice } from './SyncNotice';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';

export function AppShell({
  children,
  showMonthPicker = true,
  showNav = true,
}: {
  children: ReactNode;
  showMonthPicker?: boolean;
  showNav?: boolean;
  fab?: ReactNode;
}) {
  const { loadError } = useStore();
  const { t } = useI18n();
  return (
    <div className="min-h-dvh w-full">
      {/*
        App chrome renders straight into the first HTML chunk — no Suspense around it.
        A Suspense boundary that lands past React's first-chunk size gets streamed
        separately and revealed ~300ms later, which looked like a flash on reload.
        (Safe because the root layout renders per request: `instant = false`.)
      */}
      {showNav ? <SideNav /> : null}
      {showNav ? <BottomNav /> : null}

      <div className={showNav ? 'md:pl-[var(--sidebar-w)]' : ''}>
        {showMonthPicker ? (
          <MonthPicker showSettings={showNav} />
        ) : (
          <div className="top-bar sticky top-0 z-30 border-b border-line bg-paper/90 px-4 py-3.5 backdrop-blur-sm md:hidden">
            <p className="text-lg font-semibold tracking-tight">{t.brand}</p>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl px-4 pb-40 pt-5 md:px-8 md:pb-12 md:pt-8">
          <Suspense fallback={null}>
            <EnsureRecurring />
          </Suspense>
          <SyncNotice />
          {loadError ? <LoadErrorPanel /> : children}
        </main>
      </div>
    </div>
  );
}
