import { NextResponse } from 'next/server';
import { jsonError, loadAll, requireUser } from '@/lib/api/server';

/** GET /api/v1/data — everything the signed-in user owns, keyed by collection. */
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  try {
    return NextResponse.json(await loadAll(auth.supabase));
  } catch (error) {
    return jsonError(500, 'Could not load data', String(error));
  }
}
