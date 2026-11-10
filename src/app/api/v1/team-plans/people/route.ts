import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, requireUser } from '@/lib/api/server';
import { loadTeamPeople, removeTeamMember, teamError } from '@/lib/api/teamPlans';

/** `owner` left out means my own plan. */
const planQuery = z.object({
  owner: z.string().uuid().optional(),
  plan: z.string().min(1).max(100),
});

/** GET /api/v1/team-plans/people?owner=&plan= — everyone in a plan, owner first. */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const query = planQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return jsonError(400, 'Invalid query');
  try {
    const owner = query.data.owner ?? auth.userId;
    const people = await loadTeamPeople(auth.supabase, owner, query.data.plan);
    return NextResponse.json({ me: auth.userId, people });
  } catch (error) {
    return teamError(error, 'Could not load people');
  }
}

/**
 * DELETE /api/v1/team-plans/people?owner=&plan=&member= — leave a plan (no member,
 * or member is me), or as its owner remove someone. The database only allows those two.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const query = planQuery
    .extend({ member: z.string().uuid().optional() })
    .safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return jsonError(400, 'Invalid query');
  // No member given: leave the plan myself.
  const { owner = auth.userId, plan, member = auth.userId } = query.data;
  if (member !== auth.userId && owner !== auth.userId) return jsonError(403, 'Not allowed');
  try {
    await removeTeamMember(auth.supabase, owner, plan, member);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return teamError(error, 'Could not remove');
  }
}
