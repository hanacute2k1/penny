'use client';

import { ArrowDownUp, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  FX_CODES,
  FX_CURRENCIES,
  convert,
  currencyName,
  formatFx,
  formatNote,
  fxInputText,
  isFxCode,
  rateBetween,
  readFxInput,
  type FxCode,
} from '@/lib/currency/exchange';
import type { Locale } from '@/lib/i18n';

type Props = { onClose: () => void };

/** Money exchange with live rates and the banknotes of the currency you change from. */
export function ExchangeSheet({ open, ...props }: Props & { open: boolean }) {
  return open ? <SheetBody {...props} /> : null;
}

type Pair = { from: FxCode; to: FxCode };

/** Last pair used on this device; otherwise dollars into the account's currency. */
function initialPair(home: FxCode): Pair {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.exchangePair) ?? 'null') as {
      from?: unknown;
      to?: unknown;
    } | null;
    if (saved && isFxCode(saved.from) && isFxCode(saved.to) && saved.from !== saved.to) {
      return { from: saved.from, to: saved.to };
    }
  } catch {
    // Nothing saved, or storage is blocked.
  }
  return { from: home === 'USD' ? 'EUR' : 'USD', to: home };
}

function savePair(pair: Pair) {
  try {
    localStorage.setItem(STORAGE_KEYS.exchangePair, JSON.stringify(pair));
  } catch {
    // Only a convenience.
  }
}

function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso));
}

function SheetBody({ onClose }: Props) {
  const { t, tx, locale, currency } = useI18n();
  const { snapshot, status, reload } = useExchangeRates();
  const [pair, setPair] = useState<Pair>(() => initialPair(currency));
  const [text, setText] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  const rates = snapshot?.rates ?? {};
  const { from, to } = pair;
  const result = amount === null ? null : convert(amount, from, to, rates);
  const rate = rateBetween(from, to, rates);

  const changePair = (next: Pair) => {
    setPair(next);
    savePair(next);
    // Keep the typed number, written the way the new currency writes it.
    if (amount !== null) {
      const kept = fxInputText(amount, next.from);
      setText(kept.text);
      setAmount(kept.value);
    }
  };

  const pick = (side: keyof Pair, code: FxCode) => {
    const other = side === 'from' ? 'to' : 'from';
    // Picking the other side's currency swaps them.
    const next =
      code === pair[other] ? { from: pair.to, to: pair.from } : { ...pair, [side]: code };
    changePair(next);
  };

  const type = (raw: string) => {
    const read = readFxInput(raw, from);
    setText(read.text);
    setAmount(read.value);
  };

  /** "1 USD = 25.716 ₫", from the side worth more so the number isn't a tiny fraction. */
  const rateLine =
    rate === null
      ? null
      : rate >= 1
        ? `1 ${from} = ${formatFx(rate, to, locale)}`
        : `1 ${to} = ${formatFx(1 / rate, from, locale)}`;

  return (
    <Sheet title={t.exchange.title} onClose={onClose}>
      <div className="space-y-2">
        <CurrencyBox
          label={t.exchange.from}
          code={from}
          onPick={(code) => pick('from', code)}
          locale={locale}
        >
          <input
            inputMode={FX_CURRENCIES[from].decimals ? 'decimal' : 'numeric'}
            aria-label={t.exchange.amount}
            value={text}
            onChange={(e) => type(e.target.value)}
            placeholder="0"
            autoFocus
            className="num min-w-0 flex-1 bg-transparent text-right text-2xl font-semibold outline-none placeholder:text-ink-muted"
          />
        </CurrencyBox>

        <div className="relative z-10 -my-4 flex justify-center">
          <button
            type="button"
            onClick={() => changePair({ from: to, to: from })}
            aria-label={t.exchange.swap}
            title={t.exchange.swap}
            className="tap grid h-11 w-11 place-items-center rounded-full border border-line bg-surface-solid text-ink-soft shadow-[var(--shadow)] hover:text-ink"
          >
            <ArrowDownUp size={19} aria-hidden="true" />
          </button>
        </div>

        <CurrencyBox
          label={t.exchange.to}
          code={to}
          onPick={(code) => pick('to', code)}
          locale={locale}
        >
          <output
            aria-live="polite"
            className="num min-w-0 flex-1 truncate text-right text-2xl font-semibold"
          >
            {result === null ? (
              <span className="text-ink-muted">—</span>
            ) : (
              formatFx(result, to, locale)
            )}
          </output>
        </CurrencyBox>
      </div>

      <RateStatus
        line={rateLine}
        status={status}
        updatedAt={snapshot ? formatTime(snapshot.updatedAt, locale) : null}
        onRetry={reload}
      />

      <section className="mt-5">
        <h3 className="field-label mb-0.5">{tx(t.exchange.notes, { code: from })}</h3>
        <p className="mb-2 text-[0.8125rem] text-ink-muted">{t.exchange.notesHint}</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FX_CURRENCIES[from].notes.map((note) => {
            const value = convert(note, from, to, rates);
            const active = amount === note;
            return (
              <li key={note}>
                <button
                  type="button"
                  onClick={() => type(String(note))}
                  aria-pressed={active}
                  className={`tap flex w-full flex-col items-start rounded-2xl border px-3 py-2 text-left ${
                    active ? 'border-accent/50 bg-accent-soft' : 'border-line bg-paper'
                  }`}
                >
                  <span className="num font-semibold">
                    {formatNote(note, from)} <span className="text-ink-muted">{from}</span>
                  </span>
                  <span className="num truncate text-[0.8125rem] text-ink-soft">
                    ≈ {value === null ? '—' : formatFx(value, to, locale)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-4 text-[0.8125rem] text-ink-muted">{t.exchange.disclaimer}</p>
    </Sheet>
  );
}

function CurrencyBox({
  label,
  code,
  onPick,
  locale,
  children,
}: {
  label: string;
  code: FxCode;
  onPick: (code: FxCode) => void;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3">
      <div className="flex items-center gap-3">
        <label className="shrink-0">
          <span className="sr-only">{label}</span>
          <select
            value={code}
            onChange={(e) => onPick(e.target.value as FxCode)}
            className="min-h-11 rounded-xl border border-line bg-surface px-2 text-[0.9375rem] font-semibold outline-none focus:border-accent"
          >
            {FX_CODES.map((c) => (
              <option key={c} value={c}>
                {FX_CURRENCIES[c].flag} {c}
              </option>
            ))}
          </select>
        </label>
        {children}
      </div>
      <p className="mt-1 text-[0.8125rem] text-ink-muted">
        {label} · {currencyName(code, locale)}
      </p>
    </div>
  );
}

function RateStatus({
  line,
  status,
  updatedAt,
  onRetry,
}: {
  line: string | null;
  status: ReturnType<typeof useExchangeRates>['status'];
  updatedAt: string | null;
  onRetry: () => void;
}) {
  const { t, tx } = useI18n();
  const note =
    status === 'error'
      ? t.exchange.error
      : status === 'saved' && updatedAt
        ? tx(t.exchange.saved, { time: updatedAt })
        : status === 'loading' && !line
          ? t.exchange.loading
          : updatedAt
            ? tx(t.exchange.updated, { time: updatedAt })
            : null;

  return (
    <div className="mt-3 flex items-center justify-between gap-3 px-1">
      <div className="min-w-0">
        {line ? <p className="num font-semibold">{line}</p> : null}
        {note ? (
          <p
            className={`text-[0.8125rem] ${status === 'error' || status === 'saved' ? 'text-coral' : 'text-ink-muted'}`}
          >
            {note}
          </p>
        ) : null}
      </div>
      {status === 'error' || status === 'saved' ? (
        <button
          type="button"
          onClick={onRetry}
          className="tap inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-paper px-3 text-sm font-semibold"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {t.exchange.retry}
        </button>
      ) : null}
    </div>
  );
}
