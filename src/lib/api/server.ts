import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  COLLECTIONS,
  COLLECTION_NAMES,
  fromRow,
  isCollectionName,
  keyColumn,
  toRow,
  type CollectionName,
} from './collections';

export type ApiError = { error: string; details?: unknown };

export function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json<ApiError>({ error, details }, { status });
}

/** The signed-in user's Supabase client, or a 401 response to return as-is. */
export async function requireUser(): Promise<
  { supabase: SupabaseClient; userId: string } | { response: NextResponse }
> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { response: jsonError(401, 'Not signed in') };
  return { supabase, userId: data.user.id };
}

/** Every collection for this user, in the app's shape. */
export async function loadAll(supabase: SupabaseClient) {
  const results = await Promise.all(
    COLLECTION_NAMES.map(async (name) => {
      const { data, error } = await supabase.from(COLLECTIONS[name].table).select('*');
      if (error) throw new Error(`${name}: ${error.message}`);
      return [name, (data ?? []).map(fromRow)] as const;
    }),
  );
  return Object.fromEntries(results) as Record<CollectionName, Record<string, unknown>[]>;
}

export async function loadCollection(supabase: SupabaseClient, name: CollectionName) {
  const { data, error } = await supabase.from(COLLECTIONS[name].table).select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Validates rows against the collection schema; returns rows or a list of problems. */
export function validateRows(name: CollectionName, rows: unknown[]) {
  const schema = COLLECTIONS[name].schema;
  const valid: Record<string, unknown>[] = [];
  const problems: { collection: string; index: number; issues: unknown }[] = [];
  rows.forEach((row, index) => {
    const parsed = schema.safeParse(row);
    if (parsed.success) valid.push(parsed.data as Record<string, unknown>);
    else problems.push({ collection: name, index, issues: parsed.error.flatten().fieldErrors });
  });
  return { valid, problems };
}

/** Upsert validated rows for this user. */
export async function upsertRows(
  supabase: SupabaseClient,
  userId: string,
  name: CollectionName,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  const now = new Date().toISOString();
  const payload = rows.map((row) => ({ ...toRow(row), user_id: userId, updated_at: now }));
  const { error } = await supabase
    .from(COLLECTIONS[name].table)
    .upsert(payload, { onConflict: `user_id,${keyColumn(name)}` });
  if (error) throw new Error(`${name}: ${error.message}`);
}

export async function deleteRows(
  supabase: SupabaseClient,
  userId: string,
  name: CollectionName,
  keys: string[],
) {
  if (!keys.length) return;
  const { error } = await supabase
    .from(COLLECTIONS[name].table)
    .delete()
    .eq('user_id', userId)
    .in(keyColumn(name), keys);
  if (error) throw new Error(`${name}: ${error.message}`);
}

/** Resolves a `[collection]` route segment, or a 404 response. */
export function collectionFromParam(value: string): CollectionName | NextResponse {
  return isCollectionName(value) ? value : jsonError(404, `Unknown collection "${value}"`);
}
