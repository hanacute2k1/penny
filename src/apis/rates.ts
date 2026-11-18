/** Client call for exchange rates. */
import { pickRates, type RatesSnapshot } from '@/lib/currency/exchange';

/** Latest rates against USD, or null when the server or the network can't give them. */
export async function fetchUsdRates(): Promise<RatesSnapshot | null> {
  try {
    const res = await fetch('/api/v1/rates', { cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { rates?: Record<string, unknown>; updatedAt?: string };
    if (!body.rates || typeof body.updatedAt !== 'string') return null;
    return { rates: pickRates(body.rates), updatedAt: body.updatedAt };
  } catch {
    return null;
  }
}
