import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from './supabase';

// The signed-in user, or null before sign-in finishes. Always get the user from here, never a fixed ID.
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Calls back straight away with the current session, then again on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}
