/** Client calls for plans planned together (/api/v1/team-plans). */
import { UnauthorizedError } from '@/apis/data';
import { normalizeSpendPlan } from '@/lib/helper/spendPlans';
import type { SpendPlan } from '@/lib/type';

export type TeamPerson = {
  userId: string;
  email: string | null;
  isGuest: boolean;
  isOwner: boolean;
};

export class TeamPlanRequestError extends Error {
  constructor(readonly status: number) {
    super(`Request failed (${status})`);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new TeamPlanRequestError(res.status);
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** Shared plans I own or joined (`ownerId` set on the ones I joined). */
export async function fetchTeamPlans(): Promise<SpendPlan[]> {
  return (await call<SpendPlan[]>('/api/v1/team-plans')).map(normalizeSpendPlan);
}

/** Saves my copy of a shared plan; returns it as stored, with everyone's changes. */
export async function saveTeamPlan(base: SpendPlan, plan: SpendPlan): Promise<SpendPlan> {
  const saved = await call<SpendPlan>(
    '/api/v1/team-plans',
    json({ ownerId: plan.ownerId, base, plan }),
  );
  return normalizeSpendPlan(plan.ownerId ? { ...saved, ownerId: plan.ownerId } : saved);
}

export async function joinTeamPlan(inviteId: string) {
  return call<{ ownerId: string; planId: string }>('/api/v1/team-plans/join', json({ inviteId }));
}

/** Everyone in a plan; `ownerId` left out means my own plan. */
export async function fetchTeamPeople(ownerId: string | undefined, planId: string) {
  const query = new URLSearchParams({ plan: planId });
  if (ownerId) query.set('owner', ownerId);
  return call<{ me: string; people: TeamPerson[] }>(`/api/v1/team-plans/people?${query}`);
}

/** As the owner, remove someone; with no member, leave the plan myself. */
export async function removeTeamPerson(
  ownerId: string | undefined,
  planId: string,
  memberId?: string,
) {
  const query = new URLSearchParams({ plan: planId });
  if (ownerId) query.set('owner', ownerId);
  if (memberId) query.set('member', memberId);
  await call(`/api/v1/team-plans/people?${query}`, { method: 'DELETE' });
}
