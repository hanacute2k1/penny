import { NextResponse } from 'next/server';
import {
  collectionFromParam,
  jsonError,
  loadCollection,
  requireUser,
  upsertRows,
  validateRows,
} from '@/lib/api/server';

/** GET /api/v1/{collection} — all rows of one collection. */
export async function GET(_request: Request, ctx: RouteContext<'/api/v1/[collection]'>) {
  const name = collectionFromParam((await ctx.params).collection);
  if (name instanceof NextResponse) return name;
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  try {
    return NextResponse.json(await loadCollection(auth.supabase, name));
  } catch (error) {
    return jsonError(500, 'Could not load data', String(error));
  }
}

/** POST /api/v1/{collection} — create (or replace) one row. */
export async function POST(request: Request, ctx: RouteContext<'/api/v1/[collection]'>) {
  const name = collectionFromParam((await ctx.params).collection);
  if (name instanceof NextResponse) return name;
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const { valid, problems } = validateRows(name, [await request.json().catch(() => null)]);
  if (problems.length) return jsonError(400, 'Validation failed', problems);
  try {
    await upsertRows(auth.supabase, auth.userId, name, valid);
  } catch (error) {
    return jsonError(500, 'Could not save', String(error));
  }
  return NextResponse.json(valid[0], { status: 201 });
}
