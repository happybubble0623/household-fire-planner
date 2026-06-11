"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/storage/supabase-sync";

export type UseSessionResult = {
  session: Session | null;
  user: User | null;
  /** True until the initial session has been resolved. */
  loading: boolean;
  signOut: () => Promise<void>;
};

/**
 * Small client hook over supabase.auth.onAuthStateChange. Exposes the current
 * session/user and a signOut helper. When Supabase is not configured it stays
 * in the signed-out state forever, so the anonymous local-first experience is
 * unaffected.
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  // When Supabase is not configured there is no session to resolve, so we are
  // never "loading". Lazy-initialized to avoid a synchronous setState in the
  // effect for that case.
  const [loading, setLoading] = useState(() => getSupabaseClient() !== null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  return { session, user: session?.user ?? null, loading, signOut };
}
