'use client';

import { Sheet } from '@/components/Base/Sheet';
import { useMemo, useState } from 'react';
import { useStore, type ResetScope } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { currentYearMonth, labelYearMonth } from '@/lib/helper/date';
import { Segmented } from '@/components/Base/Segmented';

type Range = 'thisMonth' | 'months' | 'all';

/**
 * Deleting data asks three things, in order: which period, what kind of data,
 * then shows exactly what will go before the final tap. "Everything" also needs
 * the confirm word typed, so it can't happen by accident.
 */
export function ResetDataSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  return open ? <SheetBody onClose={onClose} onDone={onDone} /> : null;
}

function SheetBody({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t, tx, locale } = useI18n();
  const { transactions, budgets, recurringRules, resetData } = useStore();
  const thisMonth = currentYearMonth();

  const [range, setRange] = useState<Range>('thisMonth');
  const [picked, setPicked] = useState<string[]>([]);
  const [withTransactions, setWithTransactions] = useState(true);
  const [withBudgets, setWithBudgets] = useState(true);
  const [typed, setTyped] = useState('');

  /** Months that actually have something to delete, newest first. */
  const monthsWithData = useMemo(() => {
    const set = new Set<string>();
    for (const tr of transactions) set.add(tr.date.slice(0, 7));
    for (const b of budgets) set.add(b.yearMonth);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions, budgets]);

  const months = range === 'thisMonth' ? [thisMonth] : picked;
  const txCount = withTransactions
    ? transactions.filter((tr) => months.includes(tr.date.slice(0, 7))).length
    : 0;
  const budgetCount = withBudgets ? budgets.filter((b) => months.includes(b.yearMonth)).length : 0;

  const refillsFixed =
    range !== 'all' &&
    withTransactions &&
    months.includes(thisMonth) &&
    recurringRules.some((r) => r.isActive);

  const canDelete =
    range === 'all'
      ? typed.trim().toLocaleUpperCase() === t.reset.confirmWord.toLocaleUpperCase()
      : txCount + budgetCount > 0;

  function submit() {
    if (!canDelete) return;
    const scope: ResetScope =
      range === 'all'
        ? { kind: 'all' }
        : { kind: 'months', months, transactions: withTransactions, budgets: withBudgets };
    resetData(scope);
    onDone();
    onClose();
  }

  const chip = (active: boolean) =>
    `tap inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[0.9375rem] font-medium ${
      active ? 'border-ink bg-btn text-on-btn' : 'border-line bg-paper text-ink-soft hover:text-ink'
    }`;

  return (
    <Sheet title={t.reset.title} onClose={onClose}>
      <Segmented
        value={range}
        onChange={setRange}
        ariaLabel={t.reset.title}
        options={[
          { value: 'thisMonth', label: t.reset.scopeThisMonth },
          { value: 'months', label: t.reset.scopeMonths },
          { value: 'all', label: t.reset.scopeAll },
        ]}
      />

      {range === 'months' ? (
        <div className="mt-5">
          <p className="field-label mb-2">{t.reset.pickMonths}</p>
          {monthsWithData.length ? (
            <div className="flex flex-wrap gap-2">
              {monthsWithData.map((ym) => {
                const on = picked.includes(ym);
                return (
                  <button
                    key={ym}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setPicked((cur) => (on ? cur.filter((m) => m !== ym) : [...cur, ym]))
                    }
                    className={`${chip(on)} capitalize`}
                  >
                    {labelYearMonth(ym, locale)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[0.9375rem] text-ink-muted">{t.reset.noMonths}</p>
          )}
        </div>
      ) : null}

      {range !== 'all' ? (
        <div className="mt-5">
          <p className="field-label mb-2">{t.reset.whatToDelete}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={withTransactions}
              onClick={() => setWithTransactions((v) => !v)}
              className={chip(withTransactions)}
            >
              {t.reset.transactions}
            </button>
            <button
              type="button"
              aria-pressed={withBudgets}
              onClick={() => setWithBudgets((v) => !v)}
              className={chip(withBudgets)}
            >
              {t.reset.budgets}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl bg-coral-soft px-4 py-3 text-[0.9375rem] text-ink">
        {range === 'all' ? (
          <p>{t.reset.allSummary}</p>
        ) : txCount + budgetCount > 0 ? (
          <p className="font-medium">
            {tx(t.reset.summary, { transactions: txCount, budgets: budgetCount })}
          </p>
        ) : (
          <p>{t.reset.nothing}</p>
        )}
        {refillsFixed ? <p className="mt-1 text-sm text-ink-soft">{t.reset.fixedNote}</p> : null}
        <p className="mt-1 text-sm font-semibold text-coral">{t.reset.irreversible}</p>
      </div>

      {range === 'all' ? (
        <label className="mt-4 block">
          <span className="field-label mb-1.5 block">
            {tx(t.reset.typeToConfirm, { word: t.reset.confirmWord })}
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            className="min-h-12 w-full rounded-2xl border border-line bg-paper px-4 font-semibold tracking-wide outline-none focus:border-coral"
          />
        </label>
      ) : null}

      <button
        type="button"
        disabled={!canDelete}
        onClick={submit}
        className="btn-danger tap mt-5 min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t.reset.confirm}
      </button>
    </Sheet>
  );
}
