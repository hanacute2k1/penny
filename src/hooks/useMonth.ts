'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { currentYearMonth, shiftYearMonth } from '@/lib/helper/date';

export function useMonth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Server and browser agree on the month except in the last hours of a month
  // across time zones, which is far better than flashing a hard-coded month.
  const [fallbackMonth] = useState(currentYearMonth);

  const yearMonth = useMemo(() => {
    const q = searchParams.get('month');
    if (q && /^\d{4}-\d{2}$/.test(q)) return q;
    return fallbackMonth;
  }, [searchParams, fallbackMonth]);

  const setMonth = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('month', next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const shift = useCallback(
    (delta: number) => setMonth(shiftYearMonth(yearMonth, delta)),
    [setMonth, yearMonth],
  );

  return { yearMonth, setMonth, shift };
}
