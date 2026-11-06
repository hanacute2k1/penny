import { NextResponse } from 'next/server';
import { COLLECTIONS } from '@/lib/api/collections';
import {
  collectionFromParam,
  deleteRows,
  jsonError,
  requireUser,
  upsertRows,
  validateRows,
} from '@/lib/api/server';

type Ctx = RouteContext<'/api/v1/[collection]/[key]'>;

/** PUT /api/v1/{collection}/{key} — replace one row; the body's key must match the URL. */
export async function PUT(request: Request, ctx: Ctx) {
  const params = await ctx.params;
  const name = collectionFromParam(params.collection);
  if (name instanceof NextResponse) return name;
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  const { valid, problems } = validateRows(name, [await request.json().catch(() => null)]);
  if (problems.length) return jsonError(400, 'Validation failed', problems);
  if (valid[0][COLLECTIONS[name].key] !== params.key) {
    return jsonError(400, `Body ${COLLECTIONS[name].key} does not match the URL`);
  }
  try {
    await upsertRows(auth.supabase, auth.userId, name, valid);
  } catch (error) {
    return jsonError(500, 'Could not save', String(error));
  }
  return NextResponse.json(valid[0]);
}

/** DELETE /api/v1/{collection}/{key} */
export async function DELETE(_request: Request, ctx: Ctx) {
  const params = await ctx.params;
  const name = collectionFromParam(params.collection);
  if (name instanceof NextResponse) return name;
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  try {
    await deleteRows(auth.supabase, auth.userId, name, [params.key]);
  } catch (error) {
    return jsonError(500, 'Could not delete', String(error));
  }
  return new NextResponse(null, { status: 204 });
}
