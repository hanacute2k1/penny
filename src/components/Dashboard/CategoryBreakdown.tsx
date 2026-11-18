'use client';

import { ItemIcon } from '@/components/Base/ItemIcon';
import { useI18n } from '@/contexts/I18nContext';
import { categoryTone } from '@/lib/helper/categoryTone';
import type { PeriodSummary } from '@/lib/helper/period';
import type { Category } from '@/lib/type';

/** Slices drawn in the ring; the rest still shows in the list. */
const RING_SLICES = 6;

/** Where the money went: a ring of the biggest categories and the full list. */
export function CategoryBreakdown({
  summary,
  categories,
}: {
  summary: PeriodSummary;
  categories: Category[];
}) {
  const { t, categoryName, money } = useI18n();
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const total = summary.expense || 1;
  const rows = summary.byCategory.map((row) => {
    const cat = catMap.get(row.categoryId);
    return {
      ...row,
      cat,
      name: cat ? categoryName(cat) : t.transactions.fallbackName,
      color: categoryTone(cat),
      pct: (row.amount / total) * 100,
    };
  });

  const slices = rows.slice(0, RING_SLICES);
  const ends = slices.map((_, i) => slices.slice(0, i + 1).reduce((sum, r) => sum + r.pct, 0));
  const stops = slices.map((row, i) => `${row.color} ${ends[i] - row.pct}% ${ends[i]}%`);
  const start = ends[ends.length - 1] ?? 0;
  const ring = stops.length
    ? `conic-gradient(${stops.join(', ')}, var(--paper-2) ${start}% 100%)`
    : 'conic-gradient(var(--paper-2) 0 100%)';

  return (
    <section className="panel p-5 md:p-6">
      <h2 className="section-title mb-4">{t.dashboard.byCategory}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">{t.dashboard.empty}</p>
      ) : (
        <div className="grid items-center gap-5 md:grid-cols-[auto_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="mx-auto grid h-40 w-40 place-items-center rounded-full"
            style={{ background: ring }}
          >
            <div className="grid h-26 w-26 place-items-center rounded-full bg-surface-solid text-center">
              <p className="text-xs font-medium text-ink-muted">{t.dashboard.expense}</p>
              <p className="num text-sm font-semibold">
                {money(summary.expense, { compact: true })}
              </p>
            </div>
          </div>
          <ol className="grid gap-x-4 gap-y-1 md:grid-cols-2">
            {rows.map((row) => (
              <li key={row.categoryId} className="flex items-center gap-3 py-1.5">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${row.color} 45%, transparent)` }}
                >
                  <ItemIcon value={row.cat?.icon} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{row.name}</span>
                  <span className="block text-xs text-ink-muted">{Math.round(row.pct)}%</span>
                </span>
                <span className="num shrink-0 font-semibold">{money(row.amount)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
