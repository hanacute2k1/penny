'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  activeMeters,
  entriesForMeterMonth,
  sumAllTransportMonth,
  sumMeterMonth,
} from '@/lib/helper/transport';
import { Amount } from '@/components/Base/Amount';
import { IconPicker } from '@/components/Base/IconPicker';
import { ICON_CHOICES } from '@/lib/helper/icons';
import { ItemIcon } from '@/components/Base/ItemIcon';

export function TransportHubView() {
  const { yearMonth } = useMonth();
  const { ready, transportMeters, transportEntries, addTransportMeter } = useStore();
  const { t, tx, money } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('motorbike');

  const meters = useMemo(() => activeMeters(transportMeters), [transportMeters]);
  const monthTotal = sumAllTransportMonth(transportEntries, yearMonth);

  if (!ready) {
    return <LoadingText />;
  }

  function submit() {
    if (!name.trim()) return;
    addTransportMeter({ name: name.trim(), icon });
    setName('');
    setIcon('motorbike');
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            {t.transport.title}
          </h1>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
            {t.transport.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary tap shrink-0 self-start rounded-2xl px-5 py-3 text-sm font-semibold sm:self-auto"
        >
          + {t.transport.addMeter}
        </button>
      </header>

      <section className="panel p-5 md:p-6">
        <p className="eyebrow">{t.transport.monthTotal}</p>
        <div className="mt-2">
          <Amount value={monthTotal} size="xl" tone="ink" />
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          {tx(t.transport.daysLogged, {
            count: meters.reduce(
              (n, m) => n + entriesForMeterMonth(transportEntries, m.id, yearMonth).length,
              0,
            ),
          })}
        </p>
      </section>

      {showForm ? (
        <section className="panel space-y-4 p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">{t.transport.addMeter}</h2>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.transport.name}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.transport.namePlaceholder}
              className="w-full rounded-2xl bg-paper px-4 py-3 outline-none ring-accent focus:ring-2"
            />
          </label>
          <div>
            <span className="field-label mb-2.5 block">{t.transport.chooseIcon}</span>
            <IconPicker
              value={icon}
              onChange={setIcon}
              choices={ICON_CHOICES.transport}
              label={t.transport.chooseIcon}
            />
          </div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={submit}
              className="btn-primary tap rounded-2xl px-5 py-3.5 font-semibold sm:flex-1"
            >
              {t.common.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="tap rounded-2xl bg-paper px-5 py-3.5 font-semibold text-ink-soft sm:flex-1"
            >
              {t.transport.cancel}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        {meters.length === 0 ? (
          <div className="panel py-12 text-center text-sm text-ink-muted">{t.transport.empty}</div>
        ) : (
          meters.map((meter) => {
            const total = sumMeterMonth(transportEntries, meter.id, yearMonth);
            const logged = entriesForMeterMonth(transportEntries, meter.id, yearMonth).length;
            return (
              <Link
                key={meter.id}
                href={`/transport/${meter.id}?month=${yearMonth}`}
                className="tap panel flex items-center gap-4 px-4 py-4 transition hover:bg-paper md:px-5"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper text-2xl">
                  <ItemIcon value={meter.icon} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="section-title">{meter.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {tx(t.transport.daysLogged, { count: logged })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-base font-semibold text-ink">
                    {money(total, { compact: true })}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-accent">{t.transport.open}</p>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
