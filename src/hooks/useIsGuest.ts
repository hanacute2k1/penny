'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * True while the visitor uses Penny as a guest (an anonymous Supabase account).
 * Read from the local session, so it costs no request; false until known.
 */
export function useIsGuest(): boolean {
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const auth = createClient().auth;
    let active = true;
    auth.getSession().then(({ data }) => {
      if (active) setIsGuest(Boolean(data.session?.user.is_anonymous));
    });
    const { data } = auth.onAuthStateChange((_event, session) => {
      setIsGuest(Boolean(session?.user.is_anonymous));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return isGuest;
}
