'use client';

import { Sheet } from '@/components/Base/Sheet';
import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { categoryTint } from '@/lib/helper/categoryTone';
import { Icon } from '@/components/Base/Icon';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { IconPicker } from '@/components/Base/IconPicker';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { ICON_CHOICES } from '@/lib/helper/icons';
import type { Category, CategoryType } from '@/lib/type';

export type CategoryDraft = { name: string; icon: string };

type Props = {
  open: boolean;
  type: CategoryType;
  /** The category being edited, or null to add a new one. */
  initial: Category | null;
  /** Sort position of a new category — decides its colour. */
  nextSortOrder: number;
  onClose: () => void;
  onSave: (draft: CategoryDraft) => void;
  /** Shown when editing. Deletes the category (or hides it if it's in use). */
  onDelete?: () => void;
  /** Whether transactions already use this category (changes the delete wording). */
  inUse?: boolean;
};

/** Add or edit one category: name + icon, with a live preview of its coloured tile. */
export function CategorySheet({ open, ...props }: Props) {
  // Mounting fresh on every open seeds the form without an effect.
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({
  type,
  initial,
  nextSortOrder,
  onClose,
  onSave,
  onDelete,
  inUse = false,
}: Omit<Props, 'open'>) {
  const { t, categoryName } = useI18n();
  const [name, setName] = useState(initial ? categoryName(initial) : '');
  const [icon, setIcon] = useState(initial?.icon ?? ICON_CHOICES[type][0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = name.trim().length > 0 && icon.trim().length > 0;
  const preview = { type, sortOrder: initial?.sortOrder ?? nextSortOrder };

  function submit() {
    if (!canSave) return;
    onSave({ name: name.trim(), icon: icon.trim() });
    onClose();
  }

  return (
    <>
      <Sheet
        title={
          initial
            ? t.categories.edit
            : type === 'expense'
              ? t.categories.addExpense
              : t.categories.addIncome
        }
        onClose={onClose}
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
            style={{ background: categoryTint(preview) }}
          >
            <ItemIcon value={icon} size={28} />
          </span>
          <label className="min-w-0 flex-1">
            <span className="field-label mb-1.5 block">{t.categories.name}</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={t.categories.namePlaceholder}
              maxLength={40}
              className="min-h-12 w-full rounded-2xl border border-line bg-paper px-4 outline-none placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10"
            />
          </label>
        </div>

        <p className="field-label mb-2">{t.categories.icon}</p>
        <IconPicker
          value={icon}
          onChange={setIcon}
          choices={ICON_CHOICES[type]}
          label={t.categories.icon}
        />

        <button
          type="button"
          disabled={!canSave}
          onClick={submit}
          className="btn-primary tap mt-6 min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.common.save}
        </button>

        {initial && onDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="tap mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            <Icon name="trash" size={18} />
            {t.categories.delete}
          </button>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title={t.categories.deleteConfirm}
        message={inUse ? t.categories.deleteUsed : t.reset.irreversible}
        confirmLabel={t.common.delete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.();
          onClose();
        }}
      />
    </>
  );
}
