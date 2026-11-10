'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  formatAmountText,
  parseAmountInput,
  readAmountInput,
  amountInputMode,
} from '@/lib/helper/format';
import { Amount } from '@/components/Base/Amount';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { categoryTone } from '@/lib/helper/categoryTone';
import { previousYearMonth } from '@/lib/helper/date';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { Toast } from '@/components/Base/Toast';
import type { MonthBudget } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

export function BudgetsView() {
  const { yearMonth } = useMonth();
  const { t, tx, categoryName, money, currency, currencySymbol } = useI18n();
  const {
    ready,
    categories,
    getMonthView,
    getBudget,
    saveBudget,
    copyBudgetFromPrevious,
    restoreBudget,
  } = useStore();
  const view = useMemo(() => getMonthView(yearMonth), [getMonthView, yearMonth]);
  const budget = getBudget(yearMonth);

  const expenseCats = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense' && !c.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  /** Limits as saved for this month (falls back to what the month view suggests). */
  const savedLimits = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of expenseCats) {
      const fromBudget = budget?.categories.find((b) => b.categoryId === c.id);
      const fromView = view.categories.find((v) => v.categoryId === c.id);
      map[c.id] = formatAmountText(fromBudget?.limitAmount ?? fromView?.limit ?? 0, currency);
    }
    return map;
  }, [budget, expenseCats, view.categories, currency]);

  /**
   * Unsaved typing, tied to the saved values it started from — when those change
   * (another month, save, copy, undo) the draft is simply dropped.
   */
  const [draft, setDraft] = useState<{
    base: Record<string, string>;
    values: Record<string, string>;
  } | null>(null);
  const limits = draft && draft.base === savedLimits ? draft.values : savedLimits;
  const setLimits = (update: (prev: Record<string, string>) => Record<string, string>) =>
    setDraft({ base: savedLimits, values: update(limits) });
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);
  /** What to put back if the user taps Undo right after copying (null = there was no budget). */
  const [undo, setUndo] = useState<{ yearMonth: string; before: MonthBudget | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function flashToast(show: () => void, clear: () => void, ms: number) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    show();
    toastTimer.current = setTimeout(clear, ms);
  }

  function askCopy() {
    if (!getBudget(previousYearMonth(yearMonth))) {
      flashToast(
        () => setNotice(t.budgets.noPrevious),
        () => setNotice(null),
        3000,
      );
      return;
    }
    setConfirmCopy(true);
  }

  function doCopy() {
    setConfirmCopy(false);
    const before = getBudget(yearMonth) ?? null;
    if (!copyBudgetFromPrevious(yearMonth)) return;
    setNotice(null);
    flashToast(
      () => setUndo({ yearMonth, before }),
      () => setUndo(null),
      8000,
    );
  }

  if (!ready) {
    return <LoadingText />;
  }

  const draftTotal = expenseCats.reduce(
    (s, c) => s + (parseAmountInput(limits[c.id] ?? '0', currency) || 0),
    0,
  );

  function handleSave() {
    saveBudget(
      yearMonth,
      expenseCats.map((c) => ({
        categoryId: c.id,
        limitAmount: parseAmountInput(limits[c.id] ?? '0', currency) || 0,
      })),
    );
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            {t.nav.budget}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary tap hidden rounded-full px-4 py-2.5 text-sm font-semibold md:inline-flex"
        >
          {savedFlash ? t.budgets.saved : t.budgets.save}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel p-5 md:p-6 lg:col-span-4">
          <p className="eyebrow">{t.budgets.totalLimit}</p>
          <Amount value={draftTotal} size="xl" tone="ink" />
          <p className="mt-2 text-sm text-ink-soft">
            {tx(t.budgets.spentLeft, {
              spent: money(view.expense, { compact: true }),
              left: money(draftTotal - view.expense, { compact: true }),
            })}
          </p>
          <button
            type="button"
            onClick={askCopy}
            className="tap mt-4 w-full rounded-2xl border border-dashed border-accent/40 bg-accent-soft/60 py-3 text-sm font-semibold text-accent-deep"
          >
            {t.budgets.copyPrevious}
          </button>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
          {expenseCats.map((c) => {
            const spent = view.categories.find((v) => v.categoryId === c.id)?.spent ?? 0;
            const limit = parseAmountInput(limits[c.id] ?? '0', currency) || 0;
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            return (
              <div key={c.id} className="panel px-4 py-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <ItemIcon value={c.icon} size={18} className="text-ink-soft" />
                    {categoryName(c)}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {tx(t.budgets.spent, {
                      amount: money(spent, { compact: true }),
                    })}
                  </span>
                </div>
                <label className="mb-2 flex items-center gap-2 rounded-xl bg-paper px-3 py-2">
                  <span className="shrink-0 whitespace-nowrap text-sm font-medium text-ink-muted">
                    {t.budgets.limit}
                  </span>
                  <input
                    inputMode={amountInputMode(currency)}
                    value={limits[c.id]}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        [c.id]: readAmountInput(e.target.value, currency).text,
                      }))
                    }
                    className="num w-full bg-transparent text-right font-semibold outline-none"
                  />
                  <span className="text-ink-muted">{currencySymbol}</span>
                </label>
                <ProgressBar percent={percent} color={categoryTone(c)} />
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="btn-primary tap mt-5 w-full rounded-2xl py-3.5 font-semibold md:hidden"
      >
        {savedFlash ? t.budgets.saved : t.budgets.save}
      </button>

      <ConfirmDialog
        open={confirmCopy}
        danger={false}
        message={t.budgets.copyConfirm}
        confirmLabel={t.budgets.copyConfirmButton}
        onCancel={() => setConfirmCopy(false)}
        onConfirm={doCopy}
      />

      {undo ? (
        <Toast
          message={t.budgets.copied}
          actionLabel={t.budgets.undo}
          onAction={() => {
            restoreBudget(undo.yearMonth, undo.before);
            setUndo(null);
          }}
        />
      ) : notice ? (
        <Toast message={notice} />
      ) : null}
    </>
  );
}
