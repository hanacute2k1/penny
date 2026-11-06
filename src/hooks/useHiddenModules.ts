'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  applyHiddenModules,
  readHiddenModules,
  subscribeHiddenModules,
  type AppModule,
} from '@/lib/helper/modules';

const readSnapshot = () => readHiddenModules().join(' ');
const serverSnapshot = () => '';

/** Which optional sections are switched off, plus a toggle for Settings. */
export function useHiddenModules() {
  const snapshot = useSyncExternalStore(subscribeHiddenModules, readSnapshot, serverSnapshot);
  const hidden = snapshot ? (snapshot.split(' ') as AppModule[]) : [];

  const setVisible = useCallback((module: AppModule, visible: boolean) => {
    const current = readHiddenModules().filter((m) => m !== module);
    applyHiddenModules(visible ? current : [...current, module]);
  }, []);

  return { hidden, setVisible };
}
