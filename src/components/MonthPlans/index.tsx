'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { currentYearMonth, labelYearMonth, shiftYearMonth } from '@/lib/helper/date';
import {
  formatAmountText,
  parseAmountInput,
  readAmountInput,
  amountInputMode,
} from '@/lib/helper/format';
import { upcomingPlans } from '@/lib/helper/monthPlans';
import { categoryTint } from '@/lib/helper/categoryTone';
import { ConfirmDialog } from '@/components/Base/ConfirmDialog';
import type { MonthPlan, MonthPlanInput } from '@/lib/type';
import { ItemIcon } from '@/components/Base/ItemIcon';
import { iconText } from '@/lib/helper/icons';

function emptyForm(targetMonth: string): MonthPlanInput {
  return {
    title: '',
    note: '',
    amount: 0,
    categoryId: 'c-other',
    type: 'expense',
    targetMonth,
    dayOfMonth: 15,
  };
}

export function PlansView() {
  const { ready, categories, monthPlans, addPlan, updatePlan, deletePlan } = useStore();
  const { t, tx, locale, categoryName, money, currency, currencySymbol } = useI18n();
  const [nowMonth] = useState(currentYearMonth);
  const [form, setForm] = useState(() => emptyForm(shiftYearMonth(currentYearMonth(), 1)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cats = useMemo(
    () =>
      categories
        .filter((c) => !c.isArchived)
        .sort((a, b) => a.type.localeCompare(b.type) || a.sortOrder - b.sortOrder),
    [categories],
  );

  const upcoming = useMemo(
    () => upcomingPlans(monthPlans, shiftYearMonth(nowMonth, 1)),
    [monthPlans, nowMonth],
  );

  const sorted = useMemo(
    () =>
      [...monthPlans].sort((a, b) =>
        a.targetMonth === b.targetMonth
          ? a.dayOfMonth - b.dayOfMonth
          : a.targetMonth.localeCompare(b.targetMonth),
      ),
    [monthPlans],
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(shiftYearMonth(nowMonth, 1)));
    setAmountRaw('');
    setShowForm(true);
  }

  function openEdit(plan: MonthPlan) {
    if (plan.isPosted) return;
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      note: plan.note ?? '',
      amount: plan.amount,
      categoryId: plan.categoryId,
      type: plan.type,
      targetMonth: plan.targetMonth,
      dayOfMonth: plan.dayOfMonth,
    });
    setAmountRaw(formatAmountText(plan.amount, currency));
    setShowForm(true);
  }

  function submit() {
    const amount = parseAmountInput(amountRaw, currency) || form.amount;
    if (!form.title.trim() || amount <= 0 || !form.categoryId) return;
    const payload: MonthPlanInput = {
      ...form,
      amount,
      dayOfMonth: Math.min(28, Math.max(1, Number(form.dayOfMonth) || 1)),
    };
    if (editingId) updatePlan(editingId, payload);
    else addPlan(payload);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm(shiftYearMonth(nowMonth, 1)));
    setAmountRaw('');
  }

  if (!ready) {
    return <LoadingText />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/settings" className="mb-3 inline-block text-sm font-semibold text-accent">
        {t.plans.back}
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            {t.plans.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t.plans.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary tap rounded-full px-4 py-2.5 text-sm font-semibold"
        >
          + {t.plans.add}
        </button>
      </div>

      <p className="mb-4 text-xs text-ink-muted">{t.plans.autoHint}</p>

      {showForm ? (
        <section className="panel mb-4 space-y-3 p-4 md:p-5">
          <h2 className="section-title">{editingId ? t.plans.edit : t.plans.add}</h2>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.plans.titleLabel}</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t.plans.titlePlaceholder}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.plans.note}</span>
            <input
              value={form.note ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder={t.plans.notePlaceholder}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none ring-accent focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="field-label mb-1.5 block">{t.plans.amount}</span>
            <div className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5">
              <input
                inputMode={amountInputMode(currency)}
                value={amountRaw}
                onChange={(e) => setAmountRaw(readAmountInput(e.target.value, currency).text)}
                className="num w-full bg-transparent outline-none"
                placeholder="0"
              />
              <span className="text-ink-muted">{currencySymbol}</span>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="field-label mb-1.5 block">{t.plans.type}</span>
              <select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as 'expense' | 'income';
                  const first = cats.find((c) => c.type === type);
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
              <span className="field-label mb-1.5 block">{t.plans.dayOfMonth}</span>
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
            <span className="field-label mb-1.5 block">{t.plans.category}</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none"
            >
              {cats
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
            <span className="field-label mb-1.5 block">{t.plans.targetMonth}</span>
            <input
              type="month"
              value={form.targetMonth}
              min={shiftYearMonth(nowMonth, 1)}
              onChange={(e) => setForm((f) => ({ ...f, targetMonth: e.target.value }))}
              className="w-full rounded-xl bg-paper px-3 py-2.5 outline-none"
            />
          </label>
          <p className="text-xs text-ink-muted">{tx(t.plans.dayHint, { day: form.dayOfMonth })}</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={submit}
              className="btn-primary tap flex-1 rounded-xl py-3 font-semibold"
            >
              {t.plans.save}
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

      <p className="eyebrow mb-2">
        {t.plans.upcoming} · {upcoming.length}
      </p>

      <ul className="space-y-2">
        {sorted.length === 0 ? (
          <li className="panel py-10 text-center text-sm text-ink-muted">{t.plans.empty}</li>
        ) : (
          sorted.map((plan) => {
            const cat = categories.find((c) => c.id === plan.categoryId);
            const isFuture = plan.targetMonth > nowMonth;
            return (
              <li key={plan.id} className="panel px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg"
                    style={{ background: categoryTint(cat) }}
                  >
                    <ItemIcon value={cat?.icon} fallback="note" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{plan.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          plan.isPosted
                            ? 'bg-accent-soft text-accent-deep'
                            : 'bg-paper text-ink-muted'
                        }`}
                      >
                        {plan.isPosted
                          ? t.plans.posted
                          : isFuture
                            ? t.plans.scheduled
                            : t.plans.posted}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {labelYearMonth(plan.targetMonth, locale)} · {cat ? categoryName(cat) : '—'} ·{' '}
                      {tx(t.plans.dayHint, { day: plan.dayOfMonth })}
                    </p>
                    {plan.note ? <p className="mt-0.5 text-xs text-ink-soft">{plan.note}</p> : null}
                    <p
                      className={`num mt-1 text-sm font-semibold ${
                        plan.type === 'expense' ? 'text-ink' : 'text-income'
                      }`}
                    >
                      {plan.type === 'expense' ? '-' : '+'}
                      {money(plan.amount)}
                    </p>
                  </div>
                </div>
                {!plan.isPosted ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(plan)}
                      className="tap rounded-full bg-paper px-3 py-1.5 text-xs font-semibold"
                    >
                      {t.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(plan.id)}
                      className="tap rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft"
                    >
                      {t.plans.delete}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      <ConfirmDialog
        open={Boolean(deleteId)}
        message={`${t.plans.delete}?`}
        confirmLabel={t.plans.delete}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deletePlan(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
