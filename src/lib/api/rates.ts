import { cacheLife } from 'next/cache';
import { pickRates, type RatesSnapshot } from '@/lib/currency/exchange';

/**
 * Exchange rates against USD from free public sources that need no key
 * (mid-market rates, refreshed by the source about once a day). The first
 * source is open.er-api.com; if it fails, the fawazahmed0 currency API on jsDelivr.
 */
const SOURCES: Array<{ url: string; read: (body: unknown) => RatesSnapshot | null }> = [
  {
    url: 'https://open.er-api.com/v6/latest/USD',
    read: (body) => {
      const data = body as {
        result?: string;
        rates?: Record<string, unknown>;
        time_last_update_unix?: number;
      };
      if (data.result !== 'success' || !data.rates) return null;
      const updated = data.time_last_update_unix
        ? new Date(data.time_last_update_unix * 1000)
        : new Date();
      return { rates: pickRates(data.rates), updatedAt: updated.toISOString() };
    },
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
    read: (body) => {
      const data = body as { date?: string; usd?: Record<string, unknown> };
      if (!data.usd) return null;
      const updated = data.date ? new Date(`${data.date}T00:00:00Z`) : new Date();
      return { rates: pickRates(data.usd), updatedAt: updated.toISOString() };
    },
  },
];

/** Latest rates, cached on the server for an hour so every visit doesn't call the source. */
export async function loadUsdRates(): Promise<RatesSnapshot> {
  'use cache';
  cacheLife('hours');

  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const snapshot = source.read(await res.json());
      if (snapshot && snapshot.rates.USD && snapshot.rates.VND) return snapshot;
    } catch {
      // Try the next source.
    }
  }
  throw new Error('No exchange rate source answered');
}
