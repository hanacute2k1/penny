'use client';

import { LoadingText } from '@/components/Base/LoadingText';
import { useMemo, useState } from 'react';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';
import { useI18n } from '@/contexts/I18nContext';
import { daysInMonth } from '@/lib/helper/date';
import { dailyExpenseSeries } from '@/lib/helper/aggregations';
import { formatVnd } from '@/lib/helper/format';
import { Amount } from '@/components/Base/Amount';
import { categoryTone } from '@/lib/helper/categoryTone';
import { YearReviewView } from './YearReview';
import { ItemIcon } from '@/components/Base/ItemIcon';

type ReportTab = 'month' | 'year';

export function ReportsView() {
  const { yearMonth } = useMonth();
  const { t, tx, categoryName } = useI18n();
  const { ready, transactions, categories, getMonthView } = useStore();
  const [tab, setTab] = useState<ReportTab>('year');

  const view = useMemo(() => getMonthView(yearMonth), [getMonthView, yearMonth]);
  const days = daysInMonth(yearMonth);
  const series = useMemo(
    () => dailyExpenseSeries(transactions, yearMonth, days),
    [transactions, yearMonth, days],
  );
  const maxDay = Math.max(...series, 1);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const ranked = useMemo(
    () => [...view.categories].filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent),
    [view.categories],
  );

  const donut = useMemo(() => {
    const total = ranked.reduce((s, c) => s + c.spent, 0) || 1;
    const slices = ranked.slice(0, 6);
    const pcts = slices.map((c) => (c.spent / total) * 100);
    return slices.map((c, i) => {
      const pct = pcts[i];
      const start = pcts.slice(0, i).reduce((sum, p) => sum + p, 0);
      const cat = catMap.get(c.categoryId);
      return {
        ...c,
        color: categoryTone(cat),
        pct,
        start,
        label: cat ? categoryName(cat) : c.name,
      };
    });
  }, [ranked, catMap, categoryName]);

  const gradient = donut.length
    ? `conic-gradient(${donut.map((d) => `${d.color} ${d.start}% ${d.start + d.pct}%`).join(', ')})`
    : 'conic-gradient(var(--paper-2) 0 100%)';

  if (!ready) {
    return <LoadingText />;
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            {t.nav.reports}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab('year')}
            className={`tap rounded-full px-4 py-2 text-sm font-semibold ${
              tab === 'year' ? 'btn-primary' : 'text-ink-soft'
            }`}
          >
            {t.reports.tabYear}
          </button>
          <button
            type="button"
            onClick={() => setTab('month')}
            className={`tap rounded-full px-4 py-2 text-sm font-semibold ${
              tab === 'month' ? 'btn-primary' : 'text-ink-soft'
            }`}
          >
            {t.reports.tabMonth}
          </button>
        </div>
      </div>

      {tab === 'year' ? (
        <YearReviewView />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <section className="panel p-5 md:p-6 lg:col-span-5">
            <h2 className="mb-4 section-title">{t.reports.breakdown}</h2>
            <div
              className="mx-auto grid h-44 w-44 place-items-center rounded-full"
              style={{ background: gradient }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-surface-solid text-center">
                <p className="text-xs font-medium text-ink-muted">{t.reports.spent}</p>
                <Amount value={view.expense} size="md" compact />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2">
              {donut.map((d) => (
                <span
                  key={d.categoryId}
                  className="flex items-center gap-1.5 text-xs text-ink-soft"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: d.color }}
                  />
                  {d.label} {Math.round(d.pct)}%
                </span>
              ))}
            </div>
          </section>

          <section className="panel p-5 md:p-6 lg:col-span-7">
            <h2 className="mb-3 section-title">{t.reports.daily}</h2>
            <div className="flex h-32 items-end gap-[3px] md:h-40">
              {series.map((v, i) => (
                <div
                  key={i}
                  className="relative flex-1 rounded-t-sm bg-chart-1"
                  style={{
                    height: `${Math.max((v / maxDay) * 100, v > 0 ? 6 : 2)}%`,
                    opacity: v > 0 ? 1 : 0.25,
                  }}
                  title={tx(t.reports.day, { day: i + 1, amount: formatVnd(v) })}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-muted">
              <span>1</span>
              <span>{Math.round(days / 2)}</span>
              <span>{days}</span>
            </div>
          </section>

          <section className="panel p-5 md:p-6 lg:col-span-12">
            <h2 className="mb-3 section-title">{t.reports.topCategories}</h2>
            <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {ranked.length === 0 ? (
                <li className="py-8 text-center text-sm text-ink-muted md:col-span-2 xl:col-span-3">
                  {t.reports.empty}
                </li>
              ) : (
                ranked.slice(0, 6).map((c, idx) => {
                  const cat = catMap.get(c.categoryId);
                  return (
                    <li
                      key={c.categoryId}
                      className="flex items-center gap-3 rounded-2xl bg-paper/80 px-3 py-3"
                    >
                      <span className="num w-5 text-sm font-semibold text-ink-muted">
                        {idx + 1}.
                      </span>
                      <span className="flex flex-1 items-center gap-2 font-medium">
                        <ItemIcon value={c.icon} size={18} className="text-ink-soft" />
                        {cat ? categoryName(cat) : c.name}
                      </span>
                      <Amount value={c.spent} size="sm" />
                    </li>
                  );
                })
              )}
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
