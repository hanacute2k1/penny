'use client';

import { formatDayLabel, monthCalendarCells, monthDayDates, todayIso } from '@/lib/helper/date';
import { compactDayAmount, formatLegRoute } from '@/lib/helper/transport';
import { useI18n } from '@/contexts/I18nContext';
import type { Locale } from '@/lib/i18n';
import { useEffect, useRef, useState } from 'react';
import type { TransportEntry } from '@/lib/type';

type GridProps = {
  yearMonth: string;
  amounts: Map<string, number>;
  onSelectDay: (date: string) => void;
};

const WEEKDAYS: Record<Locale, string[]> = {
  vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ko: ['월', '화', '수', '목', '금', '토', '일'],
};

export function CalendarGrid({ yearMonth, amounts, onSelectDay }: GridProps) {
  const { locale, currency } = useI18n();
  const cells = monthCalendarCells(yearMonth, 1);
  const today = todayIso();
  const labels = WEEKDAYS[locale];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {labels.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-ink-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.date) {
            return <div key={`pad-${i}`} className="aspect-square" />;
          }
          const amount = amounts.get(cell.date) ?? 0;
          const isToday = cell.date === today;
          const hasSpend = amount > 0;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDay(cell.date!)}
              className={`tap relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-center transition ${
                isToday
                  ? 'border-btn bg-btn text-on-btn shadow-md'
                  : hasSpend
                    ? 'border-line bg-paper hover:border-accent/40'
                    : 'border-transparent bg-paper/50 hover:bg-paper'
              }`}
            >
              <span className={`text-sm font-semibold ${isToday ? 'text-on-btn' : 'text-ink'}`}>
                {cell.day}
              </span>
              {hasSpend ? (
                <span
                  className={`num mt-0.5 text-[11px] font-semibold md:text-xs ${
                    isToday ? 'text-on-btn/90' : 'text-ink'
                  }`}
                >
                  {compactDayAmount(amount, locale, currency)}
                </span>
              ) : (
                <span className="mt-0.5 h-2.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type StripProps = {
  yearMonth: string;
  entriesByDate: Map<string, TransportEntry>;
};

export function CalendarStrip({ yearMonth, entriesByDate }: StripProps) {
  const { t, locale, money } = useI18n();
  const dates = monthDayDates(yearMonth);
  const today = todayIso();
  const todayRef = useRef<HTMLLIElement>(null);
  const [openDate, setExpanded] = useState<string | null>(null);
  // An open row only counts in its own month, so changing month closes it.
  const expanded = openDate?.startsWith(yearMonth) ? openDate : null;

  useEffect(() => {
    todayRef.current?.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
  }, [yearMonth]);

  return (
    <ul className="space-y-1.5">
      {dates.map((date) => {
        const entry = entriesByDate.get(date);
        const amount = entry?.amount ?? 0;
        const legs = entry?.legs ?? [];
        const isToday = date === today;
        const hasSpend = amount > 0;
        const isOpen = expanded === date;

        return (
          <li
            key={date}
            ref={isToday ? todayRef : undefined}
            className={`rounded-2xl ${hasSpend ? 'bg-paper ring-1 ring-line' : 'bg-transparent'}`}
          >
            <button
              type="button"
              onClick={() => setExpanded((cur) => (cur === date ? null : date))}
              className="tap flex w-full items-start gap-3 px-3 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize text-ink">
                  {isToday ? t.transport.today : formatDayLabel(date, locale)}
                </p>
                <p className="num mt-1 text-base font-semibold text-ink">
                  {hasSpend ? `-${money(amount)}` : t.transport.noSpend}
                </p>
              </div>
              <span
                className={`mt-1 shrink-0 text-xs font-semibold text-ink-muted transition ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                ▾
              </span>
            </button>

            {isOpen ? (
              <div className="mx-3 mb-3 space-y-1.5 rounded-xl bg-surface px-3 py-2.5">
                {!hasSpend || legs.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t.transport.noLegs}</p>
                ) : (
                  legs.map((leg) => {
                    const route = formatLegRoute(leg);
                    return (
                      <div key={leg.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-ink-soft">
                          {route || t.transport.unnamedLeg}
                        </span>
                        <span className="num shrink-0 font-semibold text-ink">
                          -{money(leg.amount, { compact: true })}
                        </span>
                      </div>
                    );
                  })
                )}
                {hasSpend && legs.length > 1 ? (
                  <div className="flex items-center justify-between border-t border-line pt-2 text-sm font-semibold">
                    <span>{t.transport.dayTotal}</span>
                    <span className="num text-ink">-{money(amount)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
