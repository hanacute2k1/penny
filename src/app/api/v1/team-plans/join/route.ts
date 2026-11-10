import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError, requireUser } from '@/lib/api/server';
import { joinTeamPlan, teamError } from '@/lib/api/teamPlans';

const joinBody = z.object({ inviteId: z.string().regex(/^[a-f0-9]{32}$/) });

/** POST /api/v1/team-plans/join — `{ inviteId }` → `{ ownerId, planId }`. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = joinBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(404, 'Invite link not found');
  try {
    return NextResponse.json(await joinTeamPlan(auth.supabase, body.data.inviteId));
  } catch (error) {
    return teamError(error, 'Could not join the plan');
  }
}
