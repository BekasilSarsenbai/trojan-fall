"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface WalletEvent {
  id: string;
  amount: number;
  reason: string;
  match_id: string | null;
  balance_after: number | null;
  created_at: string;
}

export const REASON_LABELS: Record<string, string> = {
  match_stake_create: "Дуэль — создан матч",
  match_stake_join: "Дуэль — присоединение",
  match_win: "Победа в матче",
  match_win_resign: "Победа сдачей соперника",
  match_draw_refund: "Возврат за ничью",
  ai_win: "Победа над AI",
  accuracy_bonus: "Бонус за точность",
  daily_login: "Ежедневный вход",
};

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setEvents([]);
      setLoading(false);
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    // Initial fetch
    Promise.all([
      supabase.from("profiles").select("ducats").eq("id", user.id).maybeSingle(),
      supabase
        .from("wallet_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]).then(([{ data: profile }, { data: history }]) => {
      if (!active) return;
      setBalance(profile?.ducats ?? 500);
      setEvents((history as WalletEvent[]) ?? []);
      setLoading(false);
    });

    // Live updates: profiles row + new wallet_events
    // Unique channel name per hook instance — multiple components (Navbar + Profile)
    // can mount this hook simultaneously, and Supabase reuses channels by topic.
    const channelKey = `wallet:${user.id}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelKey)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          if (!active) return;
          const next = payload.new as { ducats: number };
          if (typeof next.ducats === "number") setBalance(next.ducats);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_events", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (!active) return;
          setEvents((prev) => [payload.new as WalletEvent, ...prev].slice(0, 30));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { balance, events, loading };
}
