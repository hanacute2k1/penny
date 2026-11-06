'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { categoryTint } from '@/lib/helper/categoryTone';
import { Icon } from '@/components/Base/Icon';
import { Segmented } from '@/components/Base/Segmented';
import { CategorySheet, type CategoryDraft } from './CategorySheet';
import type { Category, CategoryType } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';

/** Expense and income categories: add, rename / change icon, hide and bring back. */
export function CategoriesView() {
  const { categories, transactions, upsertCategory, archiveCategory, deleteCategory } = useStore();
  const { t, categoryName } = useI18n();
  const [type, setType] = useState<CategoryType>('expense');
  const [sheet, setSheet] = useState<{ editing: Category | null } | null>(null);

  const ofType = categories
    .filter((c) => c.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const visible = ofType.filter((c) => !c.isArchived);
  const hidden = ofType.filter((c) => c.isArchived);
  const nextSortOrder = Math.max(0, ...ofType.map((c) => c.sortOrder)) + 1;

  function save(draft: CategoryDraft) {
    const editing = sheet?.editing;
    if (editing) {
      // Keep the stored name when unchanged, so built-in names stay translatable.
      const renamed = draft.name !== categoryName(editing);
      upsertCategory({ ...editing, name: renamed ? draft.name : editing.name, icon: draft.icon });
      return;
    }
    upsertCategory({
      id: `c-${crypto.randomUUID()}`,
      name: draft.name,
      icon: draft.icon,
      color: '',
      type,
      sortOrder: nextSortOrder,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/settings" className="mb-3 inline-block text-sm font-semibold text-ink-soft">
        {t.categories.back}
      </Link>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight md:text-[1.75rem]">
        {t.categories.title}
      </h1>

      <Segmented
        value={type}
        onChange={setType}
        ariaLabel={t.categories.title}
        options={[
          { value: 'expense', label: t.categories.expense },
          { value: 'income', label: t.categories.income },
        ]}
      />

      <div className="panel mt-4 overflow-hidden">
        {visible.length ? (
          <ul className="divide-y divide-line">
            {visible.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 md:px-4">
                <button
                  type="button"
                  onClick={() => setSheet({ editing: c })}
                  className="tap flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
                    style={{ background: categoryTint(c) }}
                  >
                    <ItemIcon value={c.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{categoryName(c)}</span>
                  <Icon name="edit" size={18} className="text-ink-muted" />
                </button>
                <button
                  type="button"
                  onClick={() => archiveCategory(c.id)}
                  className="tap shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink"
                >
                  {t.categories.hide}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-[0.9375rem] text-ink-muted">
            {t.categories.empty}
          </p>
        )}
        <button
          type="button"
          onClick={() => setSheet({ editing: null })}
          className="tap flex min-h-14 w-full items-center justify-center gap-2 border-t border-line text-[0.9375rem] font-semibold hover:bg-paper"
        >
          <Icon name="plus" size={20} />
          {type === 'expense' ? t.categories.addExpense : t.categories.addIncome}
        </button>
      </div>

      {hidden.length ? (
        <section className="mt-6">
          <h2 className="mb-1 px-1 text-sm font-semibold text-ink-soft">{t.categories.hidden}</h2>
          <p className="mb-2 px-1 text-sm text-ink-muted">{t.categories.hideHint}</p>
          <ul className="panel divide-y divide-line overflow-hidden">
            {hidden.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 opacity-70 md:px-4">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-paper text-xl"
                >
                  <ItemIcon value={c.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{categoryName(c)}</span>
                <button
                  type="button"
                  onClick={() => upsertCategory({ ...c, isArchived: false })}
                  className="tap shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold"
                >
                  {t.categories.show}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CategorySheet
        open={sheet !== null}
        type={type}
        initial={sheet?.editing ?? null}
        nextSortOrder={nextSortOrder}
        onClose={() => setSheet(null)}
        onSave={save}
        onDelete={sheet?.editing ? () => deleteCategory(sheet.editing!.id) : undefined}
        inUse={transactions.some((tr) => tr.categoryId === sheet?.editing?.id)}
      />
    </div>
  );
}
