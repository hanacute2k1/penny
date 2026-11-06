'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { todayIso } from '@/lib/helper/date';
import {
  amountByDate,
  entriesForMeterMonth,
  entryByDate,
  sumMeterMonth,
} from '@/lib/helper/transport';
import { Amount } from '@/components/Base/Amount';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { CalendarGrid } from './Calendar';
import { CalendarStrip } from './Calendar';
import { DayAmountSheet } from './DayAmountSheet';
import { ItemIcon } from '@/components/Base/ItemIcon';

type ViewMode = 'calendar' | 'strip';

export function TransportMeterView() {
  const params = useParams<{ meterId: string }>();
  const meterId = params.meterId;
  const { yearMonth } = useMonth();
  const { ready, transportMeters, transportEntries, setTransportDayLegs, archiveTransportMeter } =
    useStore();
  const { t, tx } = useI18n();
  const [view, setView] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [today] = useState(todayIso);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const meter = transportMeters.find((m) => m.id === meterId && !m.isArchived);

  const amounts = useMemo(
    () => amountByDate(transportEntries, meterId, yearMonth),
    [transportEntries, meterId, yearMonth],
  );
  const entriesMap = useMemo(
    () => entryByDate(transportEntries, meterId, yearMonth),
    [transportEntries, meterId, yearMonth],
  );
  const total = sumMeterMonth(transportEntries, meterId, yearMonth);
  const logged = entriesForMeterMonth(transportEntries, meterId, yearMonth).length;
  const selectedLegs = selectedDate ? (entriesMap.get(selectedDate)?.legs ?? []) : [];

  if (!ready) {
    return <LoadingText />;
  }

  if (!meter) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">{t.transport.empty}</p>
        <Link href="/transport" className="mt-4 inline-block text-sm font-semibold text-accent">
          {t.transport.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/transport?month=${yearMonth}`}
        className="inline-flex text-sm font-semibold text-accent hover:text-accent-deep"
      >
        {t.transport.back}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper text-2xl">
            <ItemIcon value={meter.icon} size={26} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
              {meter.name}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {tx(t.transport.daysLogged, { count: logged })}
            </p>
          </div>
        </div>

        <label className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[11.5rem]">
          <span className="text-sm font-medium text-ink-muted">{t.transport.viewMode}</span>
          <select
            value={view}
            onChange={(e) => {
              const next = e.target.value as ViewMode;
              setView(next);
              if (next === 'strip') setSelectedDate(null);
            }}
            className="tap w-full rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold outline-none ring-accent focus:ring-2"
          >
            <option value="calendar">{t.transport.viewCalendar}</option>
            <option value="strip">{t.transport.viewStrip}</option>
          </select>
        </label>
      </header>

      <section className="panel p-5 md:p-6">
        <p className="eyebrow">{t.transport.monthTotal}</p>
        <div className="mt-2">
          <Amount value={total} size="xl" tone="ink" />
        </div>
        {today.startsWith(yearMonth) && view === 'calendar' ? (
          <button
            type="button"
            onClick={() => setSelectedDate(today)}
            className="btn-primary tap mt-5 w-full rounded-2xl px-5 py-3.5 text-sm font-semibold sm:w-auto"
          >
            {t.transport.logToday}
            {amounts.has(today) ? ` · ${amounts.get(today)?.toLocaleString('vi-VN')}đ` : ''}
          </button>
        ) : null}
      </section>

      <section className="panel p-4 md:p-6">
        {view === 'calendar' ? (
          <CalendarGrid yearMonth={yearMonth} amounts={amounts} onSelectDay={setSelectedDate} />
        ) : (
          <CalendarStrip yearMonth={yearMonth} entriesByDate={entriesMap} />
        )}
      </section>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setConfirmArchive(true)}
          className="tap rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-paper-2"
        >
          {tx(t.transport.archive, { name: meter.name })}
        </button>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        message={tx(t.transport.archiveConfirm, { name: meter.name })}
        confirmLabel={t.common.delete}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={() => {
          archiveTransportMeter(meter.id);
          setConfirmArchive(false);
        }}
      />

      {view === 'calendar' ? (
        <DayAmountSheet
          open={Boolean(selectedDate)}
          date={selectedDate}
          legs={selectedLegs}
          meterName={meter.name}
          onClose={() => setSelectedDate(null)}
          onSave={(legs) => {
            if (selectedDate) {
              setTransportDayLegs(meter.id, selectedDate, legs);
              setSelectedDate(null);
            }
          }}
          onClear={() => {
            if (selectedDate) {
              setTransportDayLegs(meter.id, selectedDate, []);
              setSelectedDate(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
