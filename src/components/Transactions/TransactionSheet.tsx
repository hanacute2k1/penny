'use client';

import { Sheet } from '@/components/Base/Sheet';
import { CATEGORY_IDS, STORAGE_KEYS } from '@/lib/constants';
import { useMemo, useState } from 'react';
import {
  formatAmountText,
  parseAmountInput,
  readAmountInput,
  amountInputMode,
} from '@/lib/helper/format';
import { useI18n } from '@/contexts/I18nContext';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { Icon } from '@/components/Base/Icon';
import { Segmented } from '@/components/Base/Segmented';
import { categoryTint } from '@/lib/helper/categoryTone';
import { useStore } from '@/contexts/StoreContext';
import { CategorySheet, type CategoryDraft } from '@/components/Categories/CategorySheet';
import type { Category, Transaction, TransactionInput } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

/** Where typed-in items go, so they still count in budgets and reports. */
const FALLBACK_CATEGORY = {
  expense: CATEGORY_IDS.otherExpense,
  income: CATEGORY_IDS.otherIncome,
} as const;
const FALLBACK_DEFAULTS = {
  expense: { name: 'Other', icon: 'box' },
  income: { name: 'Other income', icon: 'coins' },
} as const;
type EntryMode = 'custom' | 'category';

function savedMode(): EntryMode {
  try {
    return localStorage.getItem(STORAGE_KEYS.entryMode) === 'custom' ? 'custom' : 'category';
  } catch {
    return 'category';
  }
}

function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  initial?: Transaction | null;
  defaultType?: 'expense' | 'income';
  onSave: (input: TransactionInput) => void;
  onDelete?: () => void;
};

export function TransactionSheet({ open, ...props }: Props) {
  // Mounting fresh on every open seeds the form from `initial` without an effect.
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({
  onClose,
  categories,
  initial,
  defaultType = 'expense',
  onSave,
  onDelete,
}: Omit<Props, 'open'>) {
  const { t, tx, categoryName, currency, currencySymbol } = useI18n();
  const { transactions, upsertCategory, deleteCategory } = useStore();
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? defaultType);
  const [amountRaw, setAmountRaw] = useState(
    initial ? formatAmountText(initial.amount, currency) : '',
  );
  const [pickedCategoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [date, setDate] = useState(initial?.date ?? localToday);
  // An existing item filed under "Other" with a note was typed in; open it that way.
  const [mode, setMode] = useState<EntryMode>(() =>
    initial
      ? initial.categoryId === FALLBACK_CATEGORY[initial.type] && initial.note
        ? 'custom'
        : 'category'
      : savedMode(),
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Editing mode for the category grid, and which category sheet is open. */
  const [managing, setManaging] = useState(false);
  const [categorySheet, setCategorySheet] = useState<{ editing: Category | null } | null>(null);

  const filtered = useMemo(
    () =>
      categories
        .filter((c) => c.type === type && !c.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, type],
  );
  // Falls back to the first category of the current type (e.g. after switching Expense ↔ Income).
  const categoryId = filtered.some((c) => c.id === pickedCategoryId)
    ? pickedCategoryId
    : (filtered[0]?.id ?? '');
  const nextSortOrder =
    Math.max(0, ...categories.filter((c) => c.type === type).map((c) => c.sortOrder)) + 1;

  function saveCategory(draft: CategoryDraft) {
    const editing = categorySheet?.editing;
    if (editing) {
      // Keep the stored name when unchanged, so built-in names stay translatable.
      const renamed = draft.name !== categoryName(editing);
      upsertCategory({ ...editing, name: renamed ? draft.name : editing.name, icon: draft.icon });
      return;
    }
    const id = `c-${crypto.randomUUID()}`;
    upsertCategory({
      id,
      name: draft.name,
      icon: draft.icon,
      color: '',
      type,
      sortOrder: nextSortOrder,
    });
    setCategoryId(id); // a brand-new category is what the user wants to use
  }

  const amount = parseAmountInput(amountRaw, currency);
  const fallbackId = FALLBACK_CATEGORY[type];
  const fallback = categories.find((c) => c.id === fallbackId);
  const canSave = amount > 0 && (mode === 'custom' ? note.trim().length > 0 : Boolean(categoryId));

  /** Things typed in before (newest first, most used first), offered as one-tap chips. */
  const frequent = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tr of transactions) {
      if (tr.type !== type || tr.categoryId !== FALLBACK_CATEGORY[type] || !tr.note) continue;
      counts.set(tr.note, (counts.get(tr.note) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([text]) => text);
  }, [transactions, type]);

  function chooseMode(next: EntryMode) {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEYS.entryMode, next);
    } catch {
      // Remembering the choice is a convenience only.
    }
  }

  function submit() {
    if (!canSave) return;
    if (mode === 'custom') {
      // Make sure the "Other" bucket exists (and is visible) before filing into it.
      if (!fallback || fallback.isArchived) {
        upsertCategory({
          id: fallbackId,
          name: fallback?.name ?? FALLBACK_DEFAULTS[type].name,
          icon: fallback?.icon ?? FALLBACK_DEFAULTS[type].icon,
          color: '',
          type,
          sortOrder: fallback?.sortOrder ?? nextSortOrder,
        });
      }
      onSave({ amount, categoryId: fallbackId, type, date, note: note.trim() });
    } else {
      onSave({ amount, categoryId, type, date, note });
    }
    onClose();
  }

  const title = initial
    ? t.transactions.edit
    : type === 'expense'
      ? t.transactions.addExpense
      : t.transactions.addIncome;

  return (
    <>
      <Sheet title={title} onClose={onClose}>
        <div className="mb-4">
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: t.transactions.expense, icon: 'minus' },
              { value: 'income', label: t.transactions.income, icon: 'plus' },
            ]}
          />
        </div>

        <label className="mb-5 block">
          <span className="field-label mb-1.5 block">{t.transactions.amount}</span>
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
            <input
              autoFocus
              inputMode={amountInputMode(currency)}
              value={amountRaw}
              onChange={(e) => setAmountRaw(readAmountInput(e.target.value, currency).text)}
              placeholder="0"
              className={`num w-full bg-transparent text-[2rem] font-semibold outline-none placeholder:text-ink-muted/50 ${
                type === 'income' ? 'text-income' : ''
              }`}
            />
            <span className="text-lg font-medium text-ink-muted">{currencySymbol}</span>
          </div>
        </label>

        <div className="mb-4">
          <Segmented
            value={mode}
            onChange={chooseMode}
            ariaLabel={t.transactions.category}
            options={[
              { value: 'custom', label: t.transactions.modeCustom, icon: 'edit' },
              { value: 'category', label: t.transactions.modeCategory, icon: 'tag' },
            ]}
          />
        </div>

        {mode === 'custom' ? (
          <div className="mb-5">
            <label className="block">
              <span className="field-label mb-1.5 block">
                {type === 'expense' ? t.transactions.whatFor : t.transactions.fromWhere}
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                maxLength={120}
                placeholder={
                  type === 'expense'
                    ? t.transactions.whatForPlaceholder
                    : t.transactions.fromWherePlaceholder
                }
                className="min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[1.0625rem] outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </label>
            {frequent.length ? (
              <div className="mt-3">
                <p className="mb-1.5 text-sm text-ink-muted">{t.transactions.frequent}</p>
                <div className="flex flex-wrap gap-2">
                  {frequent.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => setNote(text)}
                      className={`tap rounded-full border px-3 py-1.5 text-sm font-medium ${
                        note === text
                          ? 'border-ink bg-btn text-on-btn'
                          : 'border-line bg-paper text-ink-soft hover:text-ink'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-2 text-sm text-ink-muted">
              {tx(t.transactions.customHint, {
                category: fallback ? categoryName(fallback) : t.categoryNames[fallbackId],
              })}
            </p>
          </div>
        ) : (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="field-label">{t.transactions.category}</p>
              <button
                type="button"
                onClick={() => setManaging((v) => !v)}
                aria-pressed={managing}
                className="tap -my-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink"
              >
                {managing ? t.categories.manageDone : t.categories.manage}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((c) => {
                const active = !managing && c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      managing ? setCategorySheet({ editing: c }) : setCategoryId(c.id)
                    }
                    style={{ background: categoryTint(c) }}
                    className={`tap relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-2 text-center ${
                      active
                        ? 'border-ink font-semibold text-ink'
                        : managing
                          ? 'border-dashed border-ink/30 text-ink-soft'
                          : 'border-transparent text-ink-soft hover:border-line'
                    }`}
                  >
                    {managing ? (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-surface-solid text-ink shadow-sm">
                        <Icon name="edit" size={12} />
                      </span>
                    ) : null}
                    <ItemIcon value={c.icon} size={24} />
                    <span className="line-clamp-2 text-xs font-medium leading-tight">
                      {categoryName(c)}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCategorySheet({ editing: null })}
                className="tap flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line px-1 py-2 text-center text-ink-soft hover:border-ink/40 hover:text-ink"
              >
                <Icon name="plus" size={22} />
                <span className="text-xs font-medium leading-tight">{t.categories.addShort}</span>
              </button>
            </div>
          </div>
        )}

        <div
          className={`mb-6 grid grid-cols-1 gap-4 ${mode === 'category' ? 'sm:grid-cols-2' : ''}`}
        >
          <label className="block">
            <span className="field-label mb-1.5 block">{t.transactions.date}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </label>

          {/* In "type it" mode the typed text already is the note. */}
          {mode === 'category' ? (
            <label className="block">
              <span className="field-label mb-1.5 block">{t.transactions.note}</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.common.optional}
                className="min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
              />
            </label>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!canSave}
          onClick={submit}
          className="btn-primary tap min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.common.save}
        </button>

        {initial && onDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="tap mt-2 min-h-12 w-full rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            {t.transactions.delete}
          </button>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        message={t.transactions.deleteConfirm}
        confirmLabel={t.common.delete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          onDelete?.();
          setConfirmDelete(false);
          onClose();
        }}
      />

      <CategorySheet
        open={categorySheet !== null}
        type={type}
        initial={categorySheet?.editing ?? null}
        nextSortOrder={nextSortOrder}
        onClose={() => setCategorySheet(null)}
        onSave={saveCategory}
        onDelete={
          categorySheet?.editing ? () => deleteCategory(categorySheet.editing!.id) : undefined
        }
        inUse={transactions.some((tr) => tr.categoryId === categorySheet?.editing?.id)}
      />
    </>
  );
}
