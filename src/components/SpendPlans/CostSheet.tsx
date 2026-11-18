'use client';

import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AmountInput } from '@/components/Base/AmountInput';
import { Sheet } from '@/components/Base/Sheet';
import { useI18n } from '@/contexts/I18nContext';
import type { PlanActivity, SpendPlanItem, SpendPlanItemInput } from '@/lib/type';

type Props = {
  /** The cost being edited, or null to add one. */
  item: SpendPlanItem | null;
  /** Day a new cost goes on; none = a general cost of the trip. */
  date?: string;
  /** The itinerary stop being priced: its name and place come from the stop. */
  stop?: PlanActivity;
  onSave: (input: SpendPlanItemInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** Add / edit one cost: what it's for and where (unless it's a stop), and how much. */
export function CostSheet({ open, ...props }: Props & { open: boolean }) {
  return open ? <SheetBody {...props} /> : null;
}

function SheetBody({ item, date, stop, onSave, onDelete, onClose }: Props) {
  const { t } = useI18n();
  const sp = t.spendPlans;
  const [name, setName] = useState(item?.name ?? '');
  const [place, setPlace] = useState(item?.place ?? '');
  const [estimate, setEstimate] = useState<number | null>(item?.estimate || null);
  const [deposit, setDeposit] = useState<number | null>(item?.deposit || null);
  const [actual, setActual] = useState<number | null>(item?.actual ?? null);

  const canSave = Boolean(stop) || name.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: stop ? stop.title : name,
      place: stop ? stop.place : place,
      date: item ? item.date : (stop?.date ?? date),
      activityId: stop?.id ?? item?.activityId,
      estimate: estimate ?? 0,
      deposit: deposit ?? 0,
      actual,
    });
    onClose();
  };

  const fieldClass =
    'min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10';

  const amountField = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void,
    placeholder = '0',
  ) => (
    <label className="block min-w-0">
      <span className="field-label mb-1.5 block truncate">{label}</span>
      <span className="flex min-h-12 items-center rounded-2xl border border-line bg-paper px-3 focus-within:border-ink">
        <AmountInput
          value={value}
          onChange={onChange}
          ariaLabel={label}
          placeholder={placeholder}
          className="w-full"
        />
      </span>
    </label>
  );

  return (
    <Sheet title={stop ? stop.title : item ? sp.editCost : sp.addCost} onClose={onClose}>
      <form onSubmit={submit}>
        {stop ? (
          stop.place ? (
            <p className="-mt-2 mb-4 text-sm text-ink-muted">{stop.place}</p>
          ) : null
        ) : (
          <>
            <label className="mb-4 block">
              <span className="field-label mb-1.5 block">{sp.costName}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={sp.costNamePlaceholder}
                autoFocus={!item}
                maxLength={120}
                className={fieldClass}
              />
            </label>
            <label className="mb-4 block">
              <span className="field-label mb-1.5 block">{sp.costPlace}</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder={sp.costPlacePlaceholder}
                maxLength={200}
                className={fieldClass}
              />
            </label>
          </>
        )}

        <div className="mb-6 grid grid-cols-3 gap-2">
          {amountField(sp.estimate, estimate, setEstimate)}
          {amountField(sp.deposit, deposit, setDeposit)}
          {amountField(sp.actual, actual, setActual, '—')}
        </div>

        <button
          type="submit"
          disabled={!canSave}
          className="btn-primary tap min-h-14 w-full rounded-2xl text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.common.save}
        </button>
        {item && onDelete ? (
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="tap mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-coral hover:bg-coral-soft"
          >
            <Trash2 size={18} aria-hidden="true" />
            {stop ? sp.costClear : sp.costDelete}
          </button>
        ) : null}
      </form>
    </Sheet>
  );
}
