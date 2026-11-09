import { cache } from 'react';
import { fromRow } from '@/lib/api/collections';
import { normalizeSpendPlan } from '@/lib/helper/spendPlans';
import type { SpendPlan } from '@/lib/type';
import { SUPABASE_KEY, SUPABASE_URL } from './env';

/**
 * A plan shared by link, read through the `get_shared_plan` database function
 * (see supabase/schema.sql), so no account is needed. Null if the link is wrong
 * or sharing was turned off. Cached per request: metadata and page share one call.
 */
export const getSharedPlan = cache(async (shareId: string): Promise<SpendPlan | null> => {
  if (!/^[a-f0-9]{32}$/.test(shareId)) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_shared_plan`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_share_id: shareId }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[share]', res.status, await res.text());
      return null;
    }
    const row = (await res.json()) as Record<string, unknown> | null;
    return row ? normalizeSpendPlan(fromRow(row) as unknown as SpendPlan) : null;
  } catch (error) {
    console.error('[share]', error);
    return null;
  }
});
