import type { Locale } from '@/lib/i18n';
import { compactNumber } from './format';
import { inMonth } from './date';
import type { TransportEntry, TransportLeg, TransportMeter } from '@/lib/type';

export function sumLegs(legs: { amount: number }[]): number {
  return legs.reduce((s, leg) => s + Math.max(0, Math.round(leg.amount)), 0);
}

export function formatLegRoute(leg: TransportLeg): string {
  const from = leg.from.trim();
  const to = leg.to.trim();
  if (from && to) return `${from} → ${to}`;
  if (from) return from;
  if (to) return to;
  return '';
}

export function legsNote(legs: TransportLeg[], meterName: string): string {
  const routes = legs.map((leg) => formatLegRoute(leg)).filter(Boolean);
  if (routes.length === 0) return meterName;
  return `${meterName} · ${routes.join(', ')}`;
}

export function normalizeTransportEntry(entry: TransportEntry): TransportEntry {
  const legs =
    entry.legs?.length > 0
      ? entry.legs.map((leg) => ({
          ...leg,
          from: leg.from ?? '',
          to: leg.to ?? '',
          amount: Math.max(0, Math.round(leg.amount)),
        }))
      : entry.amount > 0
        ? [
            {
              id: `${entry.id}-leg0`,
              from: '',
              to: '',
              amount: entry.amount,
            },
          ]
        : [];
  return {
    ...entry,
    legs,
    amount: sumLegs(legs),
  };
}

export function activeMeters(meters: TransportMeter[]): TransportMeter[] {
  return meters
    .filter((m) => !m.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function entriesForMeterMonth(
  entries: TransportEntry[],
  meterId: string,
  yearMonth: string,
): TransportEntry[] {
  return entries.filter((e) => e.meterId === meterId && inMonth(e.date, yearMonth));
}

export function amountByDate(
  entries: TransportEntry[],
  meterId: string,
  yearMonth: string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entriesForMeterMonth(entries, meterId, yearMonth)) {
    map.set(e.date, e.amount);
  }
  return map;
}

export function entryByDate(
  entries: TransportEntry[],
  meterId: string,
  yearMonth: string,
): Map<string, TransportEntry> {
  const map = new Map<string, TransportEntry>();
  for (const e of entriesForMeterMonth(entries, meterId, yearMonth)) {
    map.set(e.date, e);
  }
  return map;
}

export function sumMeterMonth(
  entries: TransportEntry[],
  meterId: string,
  yearMonth: string,
): number {
  return entriesForMeterMonth(entries, meterId, yearMonth).reduce((s, e) => s + e.amount, 0);
}

export function sumAllTransportMonth(entries: TransportEntry[], yearMonth: string): number {
  return entries.filter((e) => inMonth(e.date, yearMonth)).reduce((s, e) => s + e.amount, 0);
}

/** Compact label for calendar cells (e.g. 78k, 1.2tr, 12만). */
export function compactDayAmount(amount: number, locale: Locale = 'vi'): string {
  if (amount <= 0) return '';
  return compactNumber(amount, locale);
}
