import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError, requireUser } from '@/lib/api/server';
import { loadTeamPlans, saveTeamPlan, teamError } from '@/lib/api/teamPlans';

/** GET /api/v1/team-plans — shared plans I own or joined (`ownerId` = joined). */
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  try {
    return NextResponse.json(await loadTeamPlans(auth.supabase, auth.userId));
  } catch (error) {
    return teamError(error, 'Could not load shared plans');
  }
}

const saveBody = z.object({
  ownerId: z.string().uuid().optional(),
  base: z.unknown(),
  plan: z.unknown(),
});

/**
 * POST /api/v1/team-plans — save my copy of a shared plan:
 * `{ ownerId?, base, plan }`, where `base` is the copy my edits started from.
 * Answers with the plan as stored now, everyone's changes included.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = saveBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(400, 'Invalid body', body.error.flatten());
  try {
    return NextResponse.json(await saveTeamPlan(auth.supabase, auth.userId, body.data));
  } catch (error) {
    return teamError(error, 'Could not save the plan');
  }
}
