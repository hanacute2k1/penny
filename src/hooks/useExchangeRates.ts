'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchUsdRates } from '@/apis/rates';
import { STORAGE_KEYS } from '@/lib/constants';
import { pickRates, type RatesSnapshot } from '@/lib/currency/exchange';

/** `saved` = the last rates this device got, shown while offline (abroad without data). */
export type RatesStatus = 'loading' | 'live' | 'saved' | 'error';

function readSaved(): RatesSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.exchangeRates);
    if (!raw) return null;
    const data = JSON.parse(raw) as { rates?: Record<string, unknown>; updatedAt?: unknown };
    if (!data.rates || typeof data.updatedAt !== 'string') return null;
    return { rates: pickRates(data.rates), updatedAt: data.updatedAt };
  } catch {
    return null;
  }
}

function writeSaved(snapshot: RatesSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEYS.exchangeRates, JSON.stringify(snapshot));
  } catch {
    // Private mode or full storage: the rates just won't be there offline.
  }
}

/** Rates against USD: fetched when mounted, falling back to the last saved ones. */
export function useExchangeRates() {
  // Saved rates show at once; the fresh ones replace them when they arrive.
  const [snapshot, setSnapshot] = useState<RatesSnapshot | null>(readSaved);
  const [status, setStatus] = useState<RatesStatus>('loading');

  /** Bumped by "try again" to fetch once more. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchUsdRates().then((live) => {
      if (cancelled) return;
      if (live) {
        writeSaved(live);
        setSnapshot(live);
        setStatus('live');
        return;
      }
      const saved = readSaved();
      setSnapshot(saved);
      setStatus(saved ? 'saved' : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  return { snapshot, status, reload };
}
