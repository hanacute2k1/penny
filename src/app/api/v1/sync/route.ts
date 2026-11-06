import { NextResponse } from 'next/server';
import { COLLECTION_NAMES, isCollectionName, syncRequestSchema } from '@/lib/api/collections';
import { deleteRows, jsonError, requireUser, upsertRows, validateRows } from '@/lib/api/server';

/**
 * POST /api/v1/sync — apply a batch of changes:
 * `{ upserts: { transactions: [...] }, deletes: { transactions: ["t-1"] } }`.
 * Everything is validated before anything is written.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const body = syncRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(400, 'Invalid body', body.error.flatten());

  const unknown = [...Object.keys(body.data.upserts), ...Object.keys(body.data.deletes)].filter(
    (name) => !isCollectionName(name),
  );
  if (unknown.length) return jsonError(400, 'Unknown collection', unknown);

  const upserts = new Map<string, Record<string, unknown>[]>();
  const problems: unknown[] = [];
  for (const [name, rows] of Object.entries(body.data.upserts)) {
    if (!isCollectionName(name)) continue;
    const result = validateRows(name, rows);
    upserts.set(name, result.valid);
    problems.push(...result.problems);
  }
  if (problems.length) return jsonError(400, 'Validation failed', problems.slice(0, 20));

  try {
    for (const name of COLLECTION_NAMES) {
      await deleteRows(auth.supabase, auth.userId, name, body.data.deletes[name] ?? []);
      await upsertRows(auth.supabase, auth.userId, name, upserts.get(name) ?? []);
    }
  } catch (error) {
    return jsonError(500, 'Could not save changes', String(error));
  }
  return NextResponse.json({ ok: true });
}
