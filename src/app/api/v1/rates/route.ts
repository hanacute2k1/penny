import { NextResponse } from 'next/server';
import { loadUsdRates } from '@/lib/api/rates';
import { jsonError, requireUser } from '@/lib/api/server';

/**
 * GET /api/v1/rates — exchange rates against USD for the currencies in the
 * money exchange: `{ rates: { VND: 25715.7, KRW: 1335.9, ... }, updatedAt }`.
 */
export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;

  try {
    return NextResponse.json(await loadUsdRates());
  } catch {
    return jsonError(502, 'Exchange rates are unavailable');
  }
}
