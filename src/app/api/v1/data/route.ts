import { NextResponse } from 'next/server';
import { jsonError, loadAll, requireUser } from '@/lib/api/server';
import { loadJoinedPlans } from '@/lib/api/teamPlans';

/**
 * GET /api/v1/data — everything the signed-in user owns, keyed by collection,
 * plus the plans friends invited them to (marked with `ownerId`).
 */
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  try {
    const [all, joined] = await Promise.all([
      loadAll(auth.supabase, auth.userId),
      loadJoinedPlans(auth.supabase, auth.userId),
    ]);
    return NextResponse.json({ ...all, spendPlans: [...all.spendPlans, ...joined] });
  } catch (error) {
    return jsonError(500, 'Could not load data', String(error));
  }
}
