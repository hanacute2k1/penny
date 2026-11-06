'use client';

import { useEffect } from 'react';
import { useMonth } from '@/hooks/useMonth';
import { useStore } from '@/contexts/StoreContext';

/** Posts fixed costs + due month-plans when viewing a month that has arrived. */
export function EnsureRecurring() {
  const { yearMonth } = useMonth();
  const { ready, ensureRecurringForMonth, ensurePlansForMonth } = useStore();

  useEffect(() => {
    if (!ready) return;
    ensureRecurringForMonth(yearMonth);
    ensurePlansForMonth(yearMonth);
  }, [ready, yearMonth, ensureRecurringForMonth, ensurePlansForMonth]);

  return null;
}
