"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useProfileStore } from "@/stores/profileStore";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  configured: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();
  const setUsername = useProfileStore((s) => s.setUsername);
  const setCity = useProfileStore((s) => s.setCity);
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sync remote profile → zustand store on first appearance of a user.
  // Also claim daily login bonus (+25 ducats once per day).
  useEffect(() => {
    if (!user) {
      lastSyncedUserId.current = null;
      return;
    }
    if (lastSyncedUserId.current === user.id) return;
    lastSyncedUserId.current = user.id;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    supabase
      .from("profiles")
      .select("username, display_name, city")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name || data?.username) {
          setUsername(data.display_name || data.username);
        }
        if (data?.city) setCity(data.city);
      });

    // Daily login bonus — RPC handles the once-per-day check server-side
    supabase
      .rpc("award_ducats", { p_amount: 25, p_reason: "daily_login" })
      .then(({ data }) => {
        if (typeof data === "number" && data > 0) {
          // Could trigger a toast here; for now silent (visible via wallet realtime)
        }
      });
  }, [user, setUsername, setCity]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      loading,
      configured,
      async signOut() {
        const supabase = getBrowserSupabase();
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
