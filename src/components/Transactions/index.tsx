'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { inMonth, formatDayHeading } from '@/lib/helper/date';
import { AddFab } from '@/components/Base/AddFab';
import { MoneySummary } from '@/components/Base/MoneySummary';
import { Segmented } from '@/components/Base/Segmented';
import { Icon } from '@/components/Base/Icon';
import { TransactionRow } from './TransactionRow';
import { TransactionSheet } from './TransactionSheet';
import type { Transaction } from '@/lib/type';
import { iconText } from '@/lib/helper/icons';

export function TransactionsView() {
  const { yearMonth } = useMonth();
  const { t, locale, categoryName } = useI18n();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category') ?? 'all';
  const { ready, categories, transactions, addTransaction, updateTransaction, deleteTransaction } =
    useStore();

  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryId, setCategoryId] = useState(categoryFilter);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const expenseCats = categories
    .filter((c) => c.type === 'expense' && !c.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const filtered = useMemo(() => {
    return transactions
      .filter((item) => inMonth(item.date, yearMonth))
      .filter((item) => (type === 'all' ? true : item.type === type))
      .filter((item) =>
        categoryId === 'all' || type === 'income' ? true : item.categoryId === categoryId,
      )
      .filter((item) => {
        if (!q.trim()) return true;
        const cat = catMap.get(item.categoryId);
        const catLabel = cat ? categoryName(cat) : '';
        return `${item.note ?? ''} ${catLabel}`.toLowerCase().includes(q.toLowerCase());
      })
      .sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
      );
  }, [transactions, yearMonth, type, categoryId, q, catMap, categoryName]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const item of filtered) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return [...map.entries()];
  }, [filtered]);

  /** The whole month, whatever the filters: what came in, what went out. */
  const month = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const item of transactions) {
      if (!inMonth(item.date, yearMonth)) continue;
      if (item.type === 'income') income += item.amount;
      else expense += item.amount;
    }
    return { income, expense };
  }, [transactions, yearMonth]);

  if (!ready) {
    return <LoadingText />;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
          {t.nav.activity}
        </h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="btn-primary tap hidden min-h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold md:inline-flex"
        >
          <Icon name="plus" size={20} />
          {t.transactions.add}
        </button>
      </div>

      <div className="mb-4">
        <MoneySummary
          title={t.transactions.monthSummary}
          income={month.income}
          expense={month.expense}
        />
      </div>

      <div className="panel mb-4 space-y-3 p-3 md:p-4">
        <Segmented
          value={type}
          onChange={setType}
          ariaLabel={t.transactions.typeAll}
          options={[
            { value: 'all', label: t.transactions.typeAll },
            { value: 'expense', label: t.transactions.expense },
            { value: 'income', label: t.transactions.income },
          ]}
        />
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <span className="sr-only">{t.common.searchNotes}</span>
            <Icon
              name="search"
              size={20}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.common.searchNotes}
              className="min-h-12 w-full rounded-xl border border-line bg-paper py-3 pl-11 pr-4 outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </label>
          {type !== 'income' ? (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label={t.transactions.category}
              className="min-h-12 min-w-0 rounded-xl border border-line bg-surface px-3 text-[0.9375rem] font-medium outline-none focus:border-accent"
            >
              <option value="all">{t.transactions.allCategories}</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {iconText(c.icon)}
                  {categoryName(c)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {grouped.length === 0 ? (
          <p className="panel py-10 text-center text-sm text-ink-muted md:col-span-2">
            {t.transactions.empty}
          </p>
        ) : (
          grouped.map(([date, list]) => (
            <section key={date} className="panel p-2 md:p-3">
              <h3 className="px-2 pb-1 pt-2 text-sm font-semibold text-ink-soft">
                {formatDayHeading(
                  date,
                  { today: t.month.today, yesterday: t.month.yesterday },
                  locale,
                )}
              </h3>
              <div>
                {list.map((item) => (
                  <TransactionRow
                    key={item.id}
                    tx={item}
                    category={catMap.get(item.categoryId)}
                    onClick={() => {
                      setEditing(item);
                      setSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="md:hidden">
        <AddFab
          label={t.transactions.add}
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        />
      </div>

      <TransactionSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        categories={categories}
        initial={editing}
        onSave={(input) => {
          if (editing) updateTransaction(editing.id, input);
          else addTransaction(input);
        }}
        onDelete={editing ? () => deleteTransaction(editing.id) : undefined}
      />
    </>
  );
}
