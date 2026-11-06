import { addMonths, endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns';
import { enUS, ko, vi } from 'date-fns/locale';
import type { Locale as AppLocale } from '@/lib/i18n';

export const dateLocales = { en: enUS, vi, ko } as const;

/** How each language writes dates — Korean puts year/month/day first with 년·월·일. */
const PATTERNS: Record<AppLocale, { monthYear: string; day: string }> = {
  en: { monthYear: 'MMMM yyyy', day: 'EEEE, MMM d' },
  vi: { monthYear: 'MMMM yyyy', day: 'EEEE, d/M' },
  ko: { monthYear: 'yyyy년 M월', day: 'M월 d일 EEEE' },
};

export function currentYearMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function parseYearMonth(yearMonth: string): Date {
  return parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const base = parseYearMonth(yearMonth);
  const next = delta >= 0 ? addMonths(base, delta) : subMonths(base, Math.abs(delta));
  return format(next, 'yyyy-MM');
}

export function labelYearMonth(yearMonth: string, locale: AppLocale = 'en'): string {
  return format(parseYearMonth(yearMonth), PATTERNS[locale].monthYear, {
    locale: dateLocales[locale],
  });
}

export function shortLabelYearMonth(yearMonth: string): string {
  return format(parseYearMonth(yearMonth), 'MM/yyyy');
}

export function monthRange(yearMonth: string): { start: string; endExclusive: string } {
  const start = startOfMonth(parseYearMonth(yearMonth));
  const end = addMonths(start, 1);
  return {
    start: format(start, 'yyyy-MM-dd'),
    endExclusive: format(end, 'yyyy-MM-dd'),
  };
}

export function inMonth(date: string, yearMonth: string): boolean {
  const { start, endExclusive } = monthRange(yearMonth);
  return date >= start && date < endExclusive;
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDayHeading(
  date: string,
  labels: { today: string; yesterday: string },
  locale: AppLocale = 'en',
): string {
  const d = parse(date, 'yyyy-MM-dd', new Date());
  const today = todayIso();
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  if (date === today) return labels.today;
  if (date === yesterday) return labels.yesterday;
  return format(d, PATTERNS[locale].day, { locale: dateLocales[locale] });
}

export function previousYearMonth(yearMonth: string): string {
  return shiftYearMonth(yearMonth, -1);
}

export function daysInMonth(yearMonth: string): number {
  return endOfMonth(parseYearMonth(yearMonth)).getDate();
}

export function yearFromYearMonth(yearMonth: string): number {
  return Number(yearMonth.slice(0, 4));
}

export function shortMonthLabel(yearMonth: string, locale: AppLocale = 'en'): string {
  return format(parseYearMonth(yearMonth), locale === 'ko' ? 'M월' : 'MMM', {
    locale: dateLocales[locale],
  });
}

export function shiftYear(yearMonth: string, delta: number): string {
  const year = yearFromYearMonth(yearMonth) + delta;
  const month = yearMonth.slice(5, 7);
  return `${year}-${month}`;
}

export type CalendarCell = {
  date: string | null;
  day: number | null;
};

/** Build a month grid. weekStartsOn: 0 = Sunday, 1 = Monday. */
export function monthCalendarCells(yearMonth: string, weekStartsOn: 0 | 1 = 1): CalendarCell[] {
  const start = parseYearMonth(yearMonth);
  const days = daysInMonth(yearMonth);
  const weekday = start.getDay();
  const pad = weekStartsOn === 1 ? (weekday === 0 ? 6 : weekday - 1) : weekday;
  const cells: CalendarCell[] = [];
  for (let i = 0; i < pad; i += 1) cells.push({ date: null, day: null });
  for (let d = 1; d <= days; d += 1) {
    cells.push({
      date: `${yearMonth}-${String(d).padStart(2, '0')}`,
      day: d,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}

export function monthDayDates(yearMonth: string): string[] {
  const days = daysInMonth(yearMonth);
  return Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    return `${yearMonth}-${String(d).padStart(2, '0')}`;
  });
}

export function formatDayLabel(date: string, locale: AppLocale = 'en'): string {
  return format(parse(date, 'yyyy-MM-dd', new Date()), PATTERNS[locale].day, {
    locale: dateLocales[locale],
  });
}
