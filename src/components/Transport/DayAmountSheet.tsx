'use client';

import { useMemo, useState } from 'react';
import { formatVnd, parseAmountInput } from '@/lib/helper/format';
import { formatDayLabel } from '@/lib/helper/date';
import { useI18n } from '@/contexts/I18nContext';
import { sumLegs } from '@/lib/helper/transport';
import type { TransportLeg } from '@/lib/type';

type DraftLeg = {
  key: string;
  from: string;
  to: string;
  amountRaw: string;
};

type Props = {
  open: boolean;
  date: string | null;
  legs: TransportLeg[];
  meterName: string;
  onClose: () => void;
  onSave: (legs: Omit<TransportLeg, 'id'>[]) => void;
  onClear: () => void;
};

function emptyLeg(): DraftLeg {
  return {
    key: `d-${crypto.randomUUID()}`,
    from: '',
    to: '',
    amountRaw: '',
  };
}

export function DayAmountSheet({ open, ...props }: Props) {
  // Mounting fresh per open day seeds the drafts from `legs` without an effect.
  return open ? <SheetBody key={props.date ?? ''} {...props} /> : null;
}

function SheetBody({ date, legs, meterName, onClose, onSave, onClear }: Omit<Props, 'open'>) {
  const { t, locale } = useI18n();
  const [drafts, setDrafts] = useState<DraftLeg[]>(() =>
    legs.length > 0
      ? legs.map((leg) => ({
          key: leg.id,
          from: leg.from,
          to: leg.to,
          amountRaw: String(leg.amount),
        }))
      : [emptyLeg()],
  );

  const parsedLegs = useMemo(
    () =>
      drafts.map((d) => ({
        from: d.from,
        to: d.to,
        amount: parseAmountInput(d.amountRaw),
      })),
    [drafts],
  );
  const total = sumLegs(parsedLegs);
  const canSave = total > 0;

  if (!date) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t.common.close}
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="animate-sheet relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <p className="eyebrow">{meterName}</p>
        <h2 className="mt-1 font-display text-xl font-semibold capitalize">
          {formatDayLabel(date, locale)}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t.transport.legsHint}</p>

        <div className="mt-4 space-y-3">
          {drafts.map((draft, index) => (
            <div key={draft.key} className="rounded-2xl bg-paper p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="field-label">
                  {t.transport.leg} {index + 1}
                </span>
                {drafts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setDrafts((list) => list.filter((d) => d.key !== draft.key))}
                    className="tap text-xs font-semibold text-ink-muted"
                  >
                    {t.transport.removeLeg}
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  value={draft.from}
                  onChange={(e) =>
                    setDrafts((list) =>
                      list.map((d) => (d.key === draft.key ? { ...d, from: e.target.value } : d)),
                    )
                  }
                  placeholder={t.transport.from}
                  className="rounded-xl bg-surface px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                />
                <span className="text-ink-muted">→</span>
                <input
                  value={draft.to}
                  onChange={(e) =>
                    setDrafts((list) =>
                      list.map((d) => (d.key === draft.key ? { ...d, to: e.target.value } : d)),
                    )
                  }
                  placeholder={t.transport.to}
                  className="rounded-xl bg-surface px-3 py-2.5 text-sm outline-none ring-accent focus:ring-2"
                />
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
                <input
                  inputMode="numeric"
                  autoFocus={index === 0}
                  value={
                    draft.amountRaw
                      ? formatVnd(parseAmountInput(draft.amountRaw)).replace('₫', '').trim()
                      : ''
                  }
                  onChange={(e) =>
                    setDrafts((list) =>
                      list.map((d) =>
                        d.key === draft.key
                          ? {
                              ...d,
                              amountRaw: String(parseAmountInput(e.target.value) || ''),
                            }
                          : d,
                      ),
                    )
                  }
                  className="num w-full bg-transparent outline-none"
                  placeholder={t.plans.amount}
                />
                <span className="text-ink-muted">{t.common.currencyUnit}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDrafts((list) => [...list, emptyLeg()])}
          className="tap mt-3 w-full rounded-xl border border-dashed border-line py-2.5 text-sm font-semibold text-accent"
        >
          + {t.transport.addLeg}
        </button>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
          <span className="text-sm font-semibold text-ink-soft">{t.transport.dayTotal}</span>
          <span className="num text-lg font-semibold text-ink">{formatVnd(total, { locale })}</span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              if (!canSave) return;
              onSave(parsedLegs.filter((l) => l.amount > 0));
            }}
            disabled={!canSave}
            className="btn-primary tap rounded-2xl px-4 py-3.5 font-semibold disabled:opacity-40 sm:flex-1"
          >
            {t.transport.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="tap rounded-2xl bg-paper px-4 py-3.5 font-semibold text-ink-soft sm:flex-1"
          >
            {t.transport.cancel}
          </button>
        </div>
        {legs.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="tap mt-4 w-full rounded-2xl border border-line bg-paper py-3 text-sm font-semibold text-ink-soft"
          >
            {t.transport.clear}
          </button>
        ) : null}
      </div>
    </div>
  );
}
