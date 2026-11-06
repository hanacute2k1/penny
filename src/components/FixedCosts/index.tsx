'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { currentYearMonth } from '@/lib/helper/date';
import { formatVnd, parseAmountInput } from '@/lib/helper/format';
import { Amount } from '@/components/Base/Amount';
import { categoryTint } from '@/lib/helper/categoryTone';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import { sumFixedForMonth } from '@/lib/helper/recurring';
import type { RecurringInput, RecurringRule } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { iconText } from '@/lib/helper/icons';

function emptyForm(startMonth: string): RecurringInput & { id?: string } {
  return {
    name: '',
    categoryId: 'c-home',
    amount: 0,
    type: 'expense',
    dayOfMonth: 1,
    startMonth,
    endMonth: null,
    isActive: true,
  };
}

export function FixedCostsView() {
  const {
    ready,
    categories,
    recurringRules,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    toggleRecurring,
  } = useStore();
  const { t, tx, locale, categoryName } = useI18n();
  const [month] = useState(currentYearMonth);
  const [form, setForm] = useState(() => emptyForm(currentYearMonth()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const expenseCats = useMemo(
    () =>
      categories
        .filter((c) => !c.isArchived)
        .sort((a, b) => a.type.localeCompare(b.type) || a.sortOrder - b.sortOrder),
    [categories],
  );

  const totalFixed = sumFixedForMonth(recurringRules, month, 'expense');

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(month));
    setAmountRaw('');
    setShowForm(true);
  }

  function openEdit(rule: RecurringRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      categoryId: rule.categoryId,
      amount: rule.amount,
      type: rule.type,
      dayOfMonth: rule.dayOfMonth,
      startMonth: rule.startMonth,
      endMonth: rule.endMonth ?? null,
      isActive: rule.isActive,
    });
    setAmountRaw(String(rule.amount));
    setShowForm(true);
  }

  function submit() {
    const amount = parseAmountInput(amountRaw) || form.amount;
    if (!form.name.trim() || amount <= 0 || !form.categoryId) return;
    const payload: RecurringInput = {
      ...form,
      amount,
      dayOfMonth: Math.min(28, Math.max(1, Number(form.dayOfMonth) || 1)),
    };
    if (editingId) updateRecurring(editingId, payload);
    else addRecurring(payload);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm(month));
    setAmountRaw('');
  }

  if (!ready) {
    return <LoadingText />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/settings" className="mb-3 inline-block text-sm font-semibold text-accent">
        {t.fixed.back}
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            {t.fixed.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t.fixed.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary tap rounded-full px-4 py-2.5 text-sm font-semibold"
        >
          + {t.fixed.add}
        </button>
      </div>

      <section className="panel mb-4 p-5">
        <p className="eyebrow">{t.fixed.totalMonthly}</p>
        <Amount value={totalFixed} size="xl" tone="ink" />
      </section>

      {showForm ? (
        <section className="panel mb-4 space-y-3 p-4 md:p-5">
          <h2 className="section-title">{editingId ? t.fixed.edit : t.fixed.add}</h2>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.fixed.name}</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t.fixed.namePlaceholder}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.fixed.amount}</span>
            <div className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5">
              <input
                inputMode="numeric"
                value={
                  amountRaw ? formatVnd(parseAmountInput(amountRaw)).replace('₫', '').trim() : ''
                }
                onChange={(e) => setAmountRaw(String(parseAmountInput(e.target.value) || ''))}
                className="num w-full bg-transparent outline-none"
                placeholder="0"
              />
              <span className="text-ink-muted">{t.common.currencyUnit}</span>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="field-label mb-1.5 block">{t.fixed.type}</span>
              <select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as 'expense' | 'income';
                  const first = expenseCats.find((c) => c.type === type);
                  setForm((f) => ({
                    ...f,
                    type,
                    categoryId: first?.id ?? f.categoryId,
                  }));
                }}
                className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none"
              >
                <option value="expense">{t.transactions.expense}</option>
                <option value="income">{t.transactions.income}</option>
              </select>
            </label>
            <label className="block">
              <span className="field-label mb-1.5 block">{t.fixed.dayOfMonth}</span>
              <input
                type="number"
                min={1}
                max={28}
                value={form.dayOfMonth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dayOfMonth: Number(e.target.value) || 1 }))
                }
                className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none"
              />
            </label>
          </div>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.fixed.category}</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none"
            >
              {expenseCats
                .filter((c) => c.type === form.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {iconText(c.icon)}
                    {categoryName(c)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.fixed.startMonth}</span>
            <input
              type="month"
              value={form.startMonth}
              onChange={(e) => setForm((f) => ({ ...f, startMonth: e.target.value }))}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none"
            />
          </label>
          <p className="text-xs text-ink-muted">{tx(t.fixed.dayHint, { day: form.dayOfMonth })}</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={submit}
              className="btn-primary tap flex-1 rounded-xl py-3 font-semibold"
            >
              {t.fixed.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="tap flex-1 rounded-xl bg-paper py-3 font-semibold text-ink-soft"
            >
              {t.common.close}
            </button>
          </div>
        </section>
      ) : null}

      <ul className="space-y-2">
        {recurringRules.length === 0 ? (
          <li className="panel py-10 text-center text-sm text-ink-muted">{t.fixed.empty}</li>
        ) : (
          recurringRules.map((rule) => {
            const cat = categories.find((c) => c.id === rule.categoryId);
            return (
              <li key={rule.id} className="panel px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg"
                    style={{ background: categoryTint(cat) }}
                  >
                    <ItemIcon value={cat?.icon} fallback="pin" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          rule.isActive
                            ? 'bg-accent-soft text-accent-deep'
                            : 'bg-paper text-ink-muted'
                        }`}
                      >
                        {rule.isActive ? t.fixed.active : t.fixed.inactive}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {cat ? categoryName(cat) : '—'} ·{' '}
                      {tx(t.fixed.dayHint, { day: rule.dayOfMonth })}
                    </p>
                    <p
                      className={`num mt-1 text-sm font-semibold ${
                        rule.type === 'expense' ? 'text-ink' : 'text-income'
                      }`}
                    >
                      {rule.type === 'expense' ? '-' : '+'}
                      {formatVnd(rule.amount, { locale })}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(rule)}
                    className="tap rounded-full bg-paper px-3 py-1.5 text-xs font-semibold"
                  >
                    {t.common.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleRecurring(rule.id)}
                    className="tap rounded-full bg-paper px-3 py-1.5 text-xs font-semibold"
                  >
                    {rule.isActive ? t.fixed.inactive : t.fixed.active}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(rule.id)}
                    className="tap rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    {t.fixed.delete}
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <ConfirmDialog
        open={Boolean(deleteId)}
        message={`${t.fixed.delete}?`}
        confirmLabel={t.fixed.delete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteRecurring(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
