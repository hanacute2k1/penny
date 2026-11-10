'use client';

import { Sheet } from '@/components/Base/Sheet';
import { CATEGORY_IDS } from '@/lib/constants';

import { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { useI18n } from '@/contexts/I18nContext';
import { SPEND_PLAN_TEMPLATES } from '@/lib/helper/spendPlans';
import { ICON_CHOICES } from '@/lib/helper/icons';
import { IconPicker } from '@/components/Base/IconPicker';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { Icon } from '@/components/Base/Icon';
import { AmountInput } from '@/components/Base/AmountInput';
import { CategorySelect } from './shared';
import type { Category, SpendPlan, SpendPlanInput } from '@/lib/type';

type DraftItem = SpendPlanInput['items'][number];

const FALLBACK_CATEGORY = CATEGORY_IDS.otherExpense;

function inAWeek(): string {
  return format(addDays(new Date(), 7), 'yyyy-MM-dd');
}

type SheetProps = {
  onClose: () => void;
  initial?: SpendPlan | null;
  categories: Category[];
  onSave: (input: SpendPlanInput) => void;
};

/** Create / edit a plan: name, dates and the planned items with estimates. */
export function SpendPlanSheet({ open, ...props }: SheetProps & { open: boolean }) {
  // Mounting fresh on every open seeds the form from `initial` without an effect.
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ onClose, initial, categories, onSave }: SheetProps) {
  const { t, tx, money } = useI18n();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [icon, setIcon] = useState<string>(initial?.icon ?? ICON_CHOICES.plan[0]);
  const [startDate, setStartDate] = useState(initial?.startDate ?? inAWeek);
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [people, setPeople] = useState(initial?.people ?? 1);
  const [items, setItems] = useState<DraftItem[]>(
    () => initial?.items.map((item) => ({ ...item })) ?? [],
  );

  const expenseCats = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense' && !c.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );
  const validCategory = (id: string) =>
    expenseCats.some((c) => c.id === id) ? id : (expenseCats[0]?.id ?? FALLBACK_CATEGORY);

  const total = items.reduce((sum, item) => (item.isExtra ? sum : sum + item.estimate), 0);
  const canSave = Boolean(title.trim() && startDate);

  function applyTemplate(key: (typeof SPEND_PLAN_TEMPLATES)[number]['key']) {
    const template = SPEND_PLAN_TEMPLATES.find((tpl) => tpl.key === key);
    if (!template) return;
    setIcon(template.icon);
    if (!title.trim()) setTitle(t.spendPlans.templates[key]);
    setItems((current) => [
      ...current.filter((item) => item.isExtra || item.name.trim()),
      ...template.items.map((item) => ({
        name: t.spendPlans.templateItems[item.key],
        categoryId: validCategory(item.categoryId),
        estimate: 0,
        deposit: 0,
        actual: null,
        isExtra: false,
      })),
    ]);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        name: '',
        categoryId: validCategory(FALLBACK_CATEGORY),
        estimate: 0,
        deposit: 0,
        actual: null,
        isExtra: false,
      },
    ]);
  }

  function submit() {
    if (!canSave) return;
    onSave({ title, icon, startDate, endDate: endDate || undefined, note, people, items });
    onClose();
  }

  const fieldClass =
    'min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10';

  return (
    <Sheet title={initial ? t.spendPlans.edit : t.spendPlans.create} onClose={onClose} wide>
      {!initial ? (
        <div className="mb-5">
          <p className="field-label mb-2">{t.spendPlans.template}</p>
          <div className="grid grid-cols-4 gap-2">
            {SPEND_PLAN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => applyTemplate(tpl.key)}
                className="tap flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl bg-paper px-1 py-2 text-xs font-medium text-ink-soft hover:bg-paper-2"
              >
                <ItemIcon value={tpl.icon} size={24} className="text-ink" />
                {t.spendPlans.templates[tpl.key]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="mb-4 block">
        <span className="field-label mb-1.5 block">{t.spendPlans.name}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.spendPlans.namePlaceholder}
          className={fieldClass}
        />
      </label>

      <div className="mb-4">
        <p className="field-label mb-2">{t.spendPlans.icon}</p>
        <IconPicker
          value={icon}
          onChange={setIcon}
          choices={ICON_CHOICES.plan}
          label={t.spendPlans.icon}
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <label className="block min-w-0">
          <span className="field-label mb-1.5 block">{t.spendPlans.startDate}</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block min-w-0">
          <span className="field-label mb-1.5 block">{t.spendPlans.endDate}</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mb-5">
        <p className="field-label mb-1.5">{t.spendPlans.people}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
            disabled={people <= 1}
            aria-label="−"
            className="tap grid h-12 w-12 place-items-center rounded-2xl border border-line bg-paper disabled:opacity-40"
          >
            <Icon name="minus" size={18} />
          </button>
          <span className="num min-w-24 text-center text-lg font-semibold" aria-live="polite">
            {tx(t.spendPlans.peopleCount, { count: people })}
          </span>
          <button
            type="button"
            onClick={() => setPeople((n) => Math.min(99, n + 1))}
            aria-label="+"
            className="tap grid h-12 w-12 place-items-center rounded-2xl border border-line bg-paper"
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="field-label">{t.spendPlans.items}</p>
          <p className="num text-sm font-semibold">{money(total)}</p>
        </div>
        <ul className="space-y-2">
          {items.map((item, index) =>
            item.isExtra ? null : (
              <li key={item.id ?? `new-${index}`} className="flex items-center gap-2">
                <CategorySelect
                  value={item.categoryId}
                  categories={expenseCats}
                  onChange={(categoryId) => updateItem(index, { categoryId })}
                />
                <input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder={t.spendPlans.itemPlaceholder}
                  aria-label={t.spendPlans.itemPlaceholder}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 outline-none placeholder:text-ink-muted focus:border-ink"
                />
                <div className="flex min-h-11 w-28 shrink-0 items-center rounded-xl border border-line bg-paper px-3 focus-within:border-ink">
                  <AmountInput
                    value={item.estimate || null}
                    onChange={(estimate) => updateItem(index, { estimate: estimate ?? 0 })}
                    ariaLabel={`${t.spendPlans.estimate} ${item.name}`}
                    className="w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  aria-label={t.spendPlans.removeItem}
                  title={t.spendPlans.removeItem}
                  className="tap grid h-11 w-9 shrink-0 place-items-center rounded-xl text-ink-muted hover:text-coral"
                >
                  <Icon name="close" size={18} />
                </button>
              </li>
            ),
          )}
        </ul>
        <button
          type="button"
          onClick={addItem}
          className="tap mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
        >
          <Icon name="plus" size={18} />
          {t.spendPlans.addItem}
        </button>
      </div>

      <label className="mb-6 block">
        <span className="field-label mb-1.5 block">{t.spendPlans.note}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.common.optional}
          className={fieldClass}
        />
      </label>

      <button
        type="button"
        disabled={!canSave}
        onClick={submit}
        className="btn-primary tap min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t.common.save}
      </button>
    </Sheet>
  );
}
