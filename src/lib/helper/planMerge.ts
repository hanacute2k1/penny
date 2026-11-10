/**
 * Merging two people's edits to the same shared plan.
 *
 * Each person edits their own copy and sends it with the copy it started from
 * (`base`). The server merges that against what is stored now (`theirs`): only
 * what this person actually changed since `base` is applied, so friends editing
 * at the same time don't wipe out each other's work.
 *
 * - Plain fields (title, dates…): mine if I changed it, else theirs.
 * - Lists with ids (stops, checklist, cost items): merged item by item. Items I
 *   added are kept, items I removed are dropped, and for an item both of us
 *   touched, each field takes my value if I changed it, else theirs.
 *   An item someone else removed stays removed.
 */
import type { SpendPlan } from '@/lib/type';

type Row = Record<string, unknown>;

/** JSON with object keys sorted, so key order never makes two equal values differ. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

/** Same content, ignoring key order and unset (undefined) fields. */
export const same = (a: unknown, b: unknown) => stableJson(a) === stableJson(b);

/** Field by field: mine where I changed it since base, else theirs. */
function mergeFields<T extends Row>(base: T | undefined, mine: T, theirs: T): T {
  const out: Row = { ...theirs };
  const keys = new Set([...Object.keys(mine), ...Object.keys(theirs), ...Object.keys(base ?? {})]);
  for (const key of keys) {
    if (!same(mine[key], base?.[key])) {
      if (mine[key] === undefined) delete out[key];
      else out[key] = mine[key];
    }
  }
  return out as T;
}

/** Lists of `{ id, … }`, merged item by item (order follows theirs, my new items last). */
export function mergeList<T extends { id: string }>(base: T[], mine: T[], theirs: T[]): T[] {
  const baseById = new Map(base.map((x) => [x.id, x]));
  const mineById = new Map(mine.map((x) => [x.id, x]));
  const theirIds = new Set(theirs.map((x) => x.id));
  const out: T[] = [];
  for (const item of theirs) {
    const before = baseById.get(item.id);
    const mineNow = mineById.get(item.id);
    if (before && !mineNow) continue; // I removed it.
    if (!mineNow) {
      out.push(item); // Someone else added it.
      continue;
    }
    out.push(
      same(mineNow, before)
        ? item
        : (mergeFields(before as Row | undefined, mineNow as Row, item as Row) as T),
    );
  }
  for (const item of mine) {
    // New on my side. (Something in base but gone from theirs was removed by someone else.)
    if (!theirIds.has(item.id) && !baseById.has(item.id)) out.push(item);
  }
  return out;
}

const LISTS = ['items', 'activities', 'checklist'] as const;

export function mergePlan(base: SpendPlan, mine: SpendPlan, theirs: SpendPlan): SpendPlan {
  const plain = (p: SpendPlan): Row => {
    const copy: Row = { ...p };
    for (const key of LISTS) delete copy[key];
    return copy;
  };
  const merged = mergeFields(plain(base), plain(mine), plain(theirs)) as unknown as SpendPlan;
  return {
    ...merged,
    items: mergeList(base.items, mine.items, theirs.items),
    activities: mergeList(base.activities, mine.activities, theirs.activities),
    checklist: mergeList(base.checklist, mine.checklist, theirs.checklist),
  };
}
