/**
 * Plans planned together (see supabase/migrations/2026-11-10-plan-together.sql).
 *
 * A shared plan is still one row owned by its creator. Everyone in it saves
 * through `saveTeamPlan`, which merges their changes into what is stored now
 * (lib/helper/planMerge) and writes only if nobody saved in between (`version`),
 * retrying otherwise. The normal sync never overwrites a shared plan.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { mergePlan } from '@/lib/helper/planMerge';
import { normalizeSpendPlan } from '@/lib/helper/spendPlans';
import type { SpendPlan } from '@/lib/type';
import { fromRow, spendPlanSchema, toRow } from './collections';
import { jsonError } from './server';

const TABLE = 'spend_plans';
/** Saves that collide with someone else's are merged again this many times. */
const MAX_ATTEMPTS = 4;

export type TeamPerson = {
  userId: string;
  email: string | null;
  isGuest: boolean;
  isOwner: boolean;
};

export class TeamPlanError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function toPlan(row: Record<string, unknown>, me: string): SpendPlan {
  const owner = String(row.user_id);
  const plan = normalizeSpendPlan(fromRow(row) as unknown as SpendPlan);
  delete (plan as Partial<SpendPlan> & { version?: number }).version;
  return owner === me ? plan : { ...plan, ownerId: owner };
}

/** Only what may be stored: drops app-only fields (ownerId) and checks every value. */
function clean(plan: unknown): SpendPlan {
  const parsed = spendPlanSchema.safeParse(plan);
  if (!parsed.success) throw new TeamPlanError(400, 'Invalid plan');
  return parsed.data as unknown as SpendPlan;
}

/** Shared plans I own or joined, newest first; `ownerId` marks the ones I joined. */
export async function loadTeamPlans(supabase: SupabaseClient, me: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('collaborative', true)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toPlan(row, me));
}

/** Plans friends shared with me (not my own), for the first load of the app. */
export async function loadJoinedPlans(supabase: SupabaseClient, me: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('collaborative', true)
    .neq('user_id', me);
  // Before the migration has run, there are none.
  if (error) return [];
  return data.map((row) => toPlan(row, me));
}

/**
 * Saves my copy of a shared plan: what I changed since `base` is merged into
 * the stored plan. Returns the plan as stored now (with everyone's changes).
 */
export async function saveTeamPlan(
  supabase: SupabaseClient,
  me: string,
  input: { ownerId?: string; base?: unknown; plan?: unknown },
): Promise<SpendPlan> {
  const owner = input.ownerId ?? me;
  const mine = clean(input.plan);
  const base = clean(input.base ?? input.plan);
  if (mine.id !== base.id) throw new TeamPlanError(400, 'Plan and base differ');
  // Only the owner turns a plan into a shared one; members can't take it private.
  if (owner !== me) mine.collaborative = true;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: row, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', owner)
      .eq('id', mine.id)
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!row) {
      // A plan that was never saved yet: only its owner can create it.
      if (owner !== me) throw new TeamPlanError(404, 'Plan not found');
      const { error: insertError } = await supabase
        .from(TABLE)
        .insert({ ...toRow(mine as unknown as Record<string, unknown>), user_id: me, version: 1 });
      if (!insertError) return mine;
      if (insertError.code !== '23505') throw new Error(insertError.message);
      continue; // Created meanwhile by another tab: merge into it.
    }

    const version = Number(row.version ?? 0);
    const theirs = clean(fromRow(row));
    const merged =
      owner === me
        ? mergePlan(base, mine, theirs)
        : keepOwnerFields(mergePlan(base, mine, theirs), theirs);
    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update({
        ...toRow(merged as unknown as Record<string, unknown>),
        version: version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', owner)
      .eq('id', mine.id)
      .eq('version', version)
      .select('*');
    if (updateError) throw new Error(updateError.message);
    if (updated?.length) return toPlan(updated[0], me);
    // Someone saved in between: read again and merge on top of theirs.
  }
  throw new TeamPlanError(409, 'Too many people saving at once, try again');
}

/**
 * Things only the owner decides: the links, sharing itself, and closing the plan
 * out (it posts the costs into the owner's own transactions).
 */
function keepOwnerFields(merged: SpendPlan, stored: SpendPlan): SpendPlan {
  return {
    ...merged,
    collaborative: true,
    inviteId: stored.inviteId,
    shareId: stored.shareId,
    status: stored.status,
    postedCount: stored.postedCount,
  };
}

/** Joins the plan behind an invite link; returns which plan it is. */
export async function joinTeamPlan(supabase: SupabaseClient, inviteId: string) {
  const { data, error } = await supabase.rpc('join_plan', { p_invite_id: inviteId });
  if (error) throw new Error(error.message);
  if (!data) throw new TeamPlanError(404, 'Invite link not found');
  return data as { ownerId: string; planId: string };
}

/** Everyone in a plan, owner first. */
export async function loadTeamPeople(
  supabase: SupabaseClient,
  ownerId: string,
  planId: string,
): Promise<TeamPerson[]> {
  const { data, error } = await supabase.rpc('plan_people', {
    p_owner_id: ownerId,
    p_plan_id: planId,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    userId: String(row.user_id),
    email: (row.email as string | null) ?? null,
    isGuest: Boolean(row.is_guest),
    isOwner: Boolean(row.is_owner),
  }));
}

/** Leave a plan (member == me) or, as its owner, remove someone from it. */
export async function removeTeamMember(
  supabase: SupabaseClient,
  ownerId: string,
  planId: string,
  memberId: string,
) {
  const { error } = await supabase
    .from('plan_members')
    .delete()
    .eq('owner_id', ownerId)
    .eq('plan_id', planId)
    .eq('member_id', memberId);
  if (error) throw new Error(error.message);
}

/** Turns a failure into the right response: 4xx for the caller's mistakes, else 500. */
export function teamError(error: unknown, what: string) {
  if (error instanceof TeamPlanError) return jsonError(error.status, error.message);
  return jsonError(500, what, String(error));
}
