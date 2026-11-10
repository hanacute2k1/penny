import { CURRENCY_CODES, type CurrencyCode } from '@/lib/currency';
import { z } from 'zod';

/**
 * The data the app syncs, one entry per database table.
 * `key` is the field that identifies a row for its owner (budgets are one per month).
 * The zod schema is the contract for anything a client sends to the API.
 */

const id = z.string().min(1).max(100);
const money = z.number().int().nonnegative().max(1e13);
const positiveMoney = z.number().int().positive().max(1e13);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);
const kind = z.enum(['expense', 'income']);
const text = (max: number) => z.string().max(max);
const timestamp = z.string().max(40);

const category = z.object({
  id,
  name: text(80).min(1),
  icon: text(16),
  color: text(32),
  type: kind,
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
});

const transaction = z.object({
  id,
  categoryId: id,
  amount: positiveMoney,
  type: kind,
  date: isoDate,
  note: text(300).optional(),
  recurringRuleId: id.optional(),
  planId: id.optional(),
  transportMeterId: id.optional(),
  spendPlanId: id.optional(),
  createdAt: timestamp,
});

const budget = z.object({
  yearMonth,
  note: text(300).optional(),
  categories: z.array(z.object({ categoryId: id, limitAmount: money })).max(200),
});

const recurringRule = z.object({
  id,
  name: text(120).min(1),
  categoryId: id,
  amount: positiveMoney,
  type: kind,
  dayOfMonth: z.number().int().min(1).max(28),
  startMonth: yearMonth,
  endMonth: yearMonth.nullable().optional(),
  isActive: z.boolean(),
  createdAt: timestamp,
});

const monthPlan = z.object({
  id,
  title: text(120).min(1),
  note: text(300).optional(),
  amount: positiveMoney,
  categoryId: id,
  type: kind,
  targetMonth: yearMonth,
  dayOfMonth: z.number().int().min(1).max(28),
  isPosted: z.boolean(),
  createdAt: timestamp,
});

const transportMeter = z.object({
  id,
  name: text(80).min(1),
  icon: text(16),
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
  createdAt: timestamp,
});

const transportEntry = z.object({
  id,
  meterId: id,
  date: isoDate,
  amount: money,
  legs: z.array(z.object({ id, from: text(120), to: text(120), amount: money })).max(50),
  transactionId: id,
  createdAt: timestamp,
});

export const spendPlanSchema = z.object({
  id,
  title: text(120).min(1),
  icon: text(16),
  startDate: isoDate,
  endDate: isoDate.optional(),
  note: text(300).optional(),
  people: z.number().int().min(1).max(99).default(1),
  items: z
    .array(
      z.object({
        id,
        name: text(120),
        categoryId: id,
        estimate: money,
        deposit: money.default(0),
        actual: money.nullable(),
        isExtra: z.boolean(),
      }),
    )
    .max(200),
  activities: z
    .array(
      z.object({
        id,
        date: isoDate,
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        title: text(160),
        place: text(200).optional(),
        mapUrl: z.string().url().max(2000).optional(),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        note: text(500).optional(),
        kind: z.enum(['move', 'stay', 'food', 'see', 'other']),
        from: text(200).optional(),
        fromMapUrl: z.string().url().max(2000).optional(),
        fromLat: z.number().min(-90).max(90).optional(),
        fromLng: z.number().min(-180).max(180).optional(),
        endDate: isoDate.optional(),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .optional(),
        done: z.boolean(),
        endDone: z.boolean().optional(),
      }),
    )
    .max(500)
    .default([]),
  checklist: z
    .array(z.object({ id, text: text(160), done: z.boolean() }))
    .max(300)
    .default([]),
  shareId: z
    .string()
    .regex(/^[a-f0-9]{32}$/)
    .optional(),
  currency: z.enum(CURRENCY_CODES as [CurrencyCode, ...CurrencyCode[]]).optional(),
  collaborative: z.boolean().optional(),
  inviteId: z
    .string()
    .regex(/^[a-f0-9]{32}$/)
    .optional(),
  status: z.enum(['planning', 'done']),
  postedCount: z.number().int().nonnegative(),
  createdAt: timestamp,
});

export const COLLECTIONS = {
  categories: { table: 'categories', key: 'id', schema: category },
  transactions: { table: 'transactions', key: 'id', schema: transaction },
  budgets: { table: 'budgets', key: 'yearMonth', schema: budget },
  recurringRules: { table: 'recurring_rules', key: 'id', schema: recurringRule },
  monthPlans: { table: 'month_plans', key: 'id', schema: monthPlan },
  transportMeters: { table: 'transport_meters', key: 'id', schema: transportMeter },
  transportEntries: { table: 'transport_entries', key: 'id', schema: transportEntry },
  spendPlans: { table: 'spend_plans', key: 'id', schema: spendPlanSchema },
} as const;

export type CollectionName = keyof typeof COLLECTIONS;
export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

export function isCollectionName(value: string): value is CollectionName {
  return value in COLLECTIONS;
}

/** Column name in the database for a key field ("yearMonth" → "year_month"). */
export function keyColumn(name: CollectionName): string {
  return toSnake(COLLECTIONS[name].key);
}

/** Body of POST /api/v1/sync: rows to upsert and keys to delete, per collection. */
export const syncRequestSchema = z.object({
  upserts: z.record(z.string(), z.array(z.unknown()).max(2000)).default({}),
  deletes: z.record(z.string(), z.array(id).max(2000)).default({}),
});
export type SyncRequest = {
  upserts?: Partial<Record<CollectionName, unknown[]>>;
  deletes?: Partial<Record<CollectionName, string[]>>;
};

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** App object → table row. Top-level keys only; jsonb columns keep their camelCase shape. */
export function toRow(value: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) row[toSnake(key)] = v === undefined ? null : v;
  return row;
}

/** Table row → app object. Drops ownership/bookkeeping columns and empty optionals. */
export function fromRow(row: Record<string, unknown>): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(row)) {
    if (key === 'user_id' || key === 'updated_at' || v === null) continue;
    value[toCamel(key)] = v;
  }
  return value;
}
