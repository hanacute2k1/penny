import type { Category } from '@/lib/type';

const EXPENSE_TONES = 8;
const INCOME_TONE = 3; // mint

/**
 * Each category keeps one pastel from the chart palette everywhere it appears
 * (icon tile, progress bar, donut slice), so colour alone identifies it.
 * Expense categories cycle through --chart-1…8 by sort order; income is mint.
 */
export function categoryTone(category?: Pick<Category, 'type' | 'sortOrder'>): string {
  if (!category) return 'var(--paper-2)';
  if (category.type === 'income') return `var(--chart-${INCOME_TONE})`;
  const index = (((category.sortOrder - 1) % EXPENSE_TONES) + EXPENSE_TONES) % EXPENSE_TONES;
  return `var(--chart-${index + 1})`;
}

/** Softer version of the tone for backgrounds behind emoji / text. */
export function categoryTint(category?: Pick<Category, 'type' | 'sortOrder'>): string {
  if (!category) return 'var(--paper)';
  return `color-mix(in srgb, ${categoryTone(category)} var(--tone-mix), transparent)`;
}
