/** Client calls to the Penny API (/api/v1). A 401 means the session ended. */
import type { SyncRequest } from '@/lib/api/collections';
import type { AppState } from '@/lib/store/state';

export class UnauthorizedError extends Error {}

export async function fetchRemoteState(): Promise<AppState> {
  const res = await fetch('/api/v1/data', { cache: 'no-store' });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`Load failed (${res.status})`);
  const data = (await res.json()) as Partial<AppState>;
  return {
    categories: data.categories ?? [],
    transactions: data.transactions ?? [],
    budgets: data.budgets ?? [],
    recurringRules: data.recurringRules ?? [],
    monthPlans: data.monthPlans ?? [],
    transportMeters: data.transportMeters ?? [],
    transportEntries: data.transportEntries ?? [],
    spendPlans: data.spendPlans ?? [],
  };
}

export async function pushChanges(changes: SyncRequest, opts?: { keepalive?: boolean }) {
  const res = await fetch('/api/v1/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
    keepalive: opts?.keepalive,
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`Save failed (${res.status}): ${await res.text()}`);
}
