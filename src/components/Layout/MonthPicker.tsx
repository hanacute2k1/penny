'use client';

import Link from 'next/link';
import { useState } from 'react';
import { currentYearMonth, labelYearMonth } from '@/lib/helper/date';
import { useMonth } from '@/hooks/useMonth';
import { useI18n } from '@/contexts/I18nContext';
import { ThemeToggle } from '@/components/Base/ThemeToggle';
import { Icon } from '@/components/Base/Icon';

export function MonthPicker({ showSettings = true }: { showSettings?: boolean }) {
  const { yearMonth, shift, setMonth } = useMonth();
  const { t, locale } = useI18n();
  // Read once on mount; the page is rendered per request, so server and browser agree.
  const [nowMonth] = useState(currentYearMonth);

  const isCurrent = yearMonth === nowMonth;

  return (
    <header className="top-bar sticky top-0 z-30 border-b border-line bg-paper/90 px-4 py-2.5 backdrop-blur-sm md:px-8 md:py-3">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="glass-control flex min-w-0 items-center rounded-full border border-line bg-surface p-1">
            <button
              type="button"
              aria-label={t.month.previous}
              title={t.month.previous}
              onClick={() => shift(-1)}
              className="tap grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
            >
              <Icon name="chevronLeft" size={20} />
            </button>
            <p
              aria-live="polite"
              className="shrink-0 px-1 text-center text-[0.9375rem] font-semibold capitalize tracking-tight sm:min-w-[8.5rem] md:min-w-[10.5rem] md:text-base"
            >
              {labelYearMonth(yearMonth, locale)}
            </p>
            <button
              type="button"
              aria-label={t.month.next}
              title={t.month.next}
              onClick={() => shift(1)}
              className="tap grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
            >
              <Icon name="chevronRight" size={20} />
            </button>
          </div>
          {!isCurrent ? (
            <button
              type="button"
              onClick={() => setMonth(nowMonth)}
              className="tap shrink-0 whitespace-nowrap rounded-full px-1.5 py-2 text-sm font-semibold text-ink hover:text-ink-soft"
            >
              {t.month.thisMonth}
            </button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden md:block">
            <ThemeToggle compact />
          </span>
          {showSettings ? (
            <Link
              href="/settings"
              aria-label={t.settings.title}
              title={t.settings.title}
              className="glass-control tap grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-soft hover:text-ink md:hidden"
            >
              <Icon name="settings" size={20} />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
