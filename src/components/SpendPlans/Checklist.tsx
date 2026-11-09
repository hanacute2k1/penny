'use client';

import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { ProgressBar } from '@/components/Base/ProgressBar';
import { useI18n } from '@/contexts/I18nContext';
import type { PlanChecklistItem } from '@/lib/type';

type Props = {
  items: PlanChecklistItem[];
  /** Leave the handlers out for a read-only list (the shared page). */
  onAdd?: (text: string) => void;
  onToggle?: (id: string) => void;
  onRemove?: (id: string) => void;
};

/** What to pack and prepare before leaving, with one-tap suggestions. */
export function Checklist({ items, onAdd, onToggle, onRemove }: Props) {
  const { t, tx } = useI18n();
  const [text, setText] = useState('');
  const done = items.filter((item) => item.done).length;
  const have = new Set(items.map((item) => item.text.toLowerCase()));
  const suggestions = t.spendPlans.checklistSuggestions.filter((s) => !have.has(s.toLowerCase()));

  function add() {
    if (!text.trim()) return;
    onAdd?.(text);
    setText('');
  }

  return (
    <section className="panel p-4 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="section-title">{t.spendPlans.checklistTitle}</h2>
        {items.length ? (
          <span className="text-sm text-ink-muted">
            {tx(t.spendPlans.checklistDone, { done, total: items.length })}
          </span>
        ) : null}
      </div>
      {items.length ? (
        <div className="mb-3">
          <ProgressBar percent={Math.round((done / items.length) * 100)} />
        </div>
      ) : null}

      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              {onToggle ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.done}
                  aria-label={item.text}
                  onClick={() => onToggle(item.id)}
                  className={`tap grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${
                    item.done
                      ? 'border-income bg-income text-paper'
                      : 'border-line text-transparent'
                  }`}
                >
                  <Check size={15} strokeWidth={2.8} aria-hidden="true" />
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${
                    item.done
                      ? 'border-income bg-income text-paper'
                      : 'border-line text-transparent'
                  }`}
                >
                  <Check size={15} strokeWidth={2.8} />
                </span>
              )}
              <span
                className={`min-w-0 flex-1 ${item.done ? 'text-ink-muted line-through decoration-ink-muted/60' : 'font-medium'}`}
              >
                {item.text}
              </span>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`${t.spendPlans.removeChecklist}: ${item.text}`}
                  className="tap grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-muted hover:text-coral"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-4 py-4 text-center text-sm text-ink-muted">
          {t.spendPlans.checklistEmpty}
        </p>
      )}

      {onAdd ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.spendPlans.checklistPlaceholder}
              aria-label={t.spendPlans.checklistPlaceholder}
              maxLength={160}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 outline-none placeholder:text-ink-muted focus:border-ink"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="btn-primary tap min-h-11 shrink-0 rounded-xl px-4 font-semibold disabled:opacity-40"
            >
              {t.spendPlans.checklistAdd}
            </button>
          </form>
          {suggestions.length ? (
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-semibold text-ink-soft">
                {t.spendPlans.suggestions}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onAdd(suggestion)}
                    className="tap inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-paper px-3 text-sm font-medium text-ink-soft hover:text-ink"
                  >
                    <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
