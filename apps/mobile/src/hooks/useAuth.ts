import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setSession, clearSession } from '../lib/auth-store';

export interface AuthState {
  session: Session | null;
  initialized: boolean;
}

export function useAuth(): AuthState {
  const [session, setSessionState] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSessionState(s);
      if (s) setSession(s.access_token, s.user.id);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSessionState(s);
      if (s) {
        setSession(s.access_token, s.user.id);
      } else {
        clearSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, initialized };
}
