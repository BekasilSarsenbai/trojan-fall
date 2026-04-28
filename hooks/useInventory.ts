"use client";
import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface InventoryItem {
  id: string;
  item_key: string;
  quantity: number;
}

export function useInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeSkin, setActiveSkin] = useState<string>("skin_classic");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const [{ data: inv }, { data: profile }] = await Promise.all([
      supabase.from("inventory").select("id, item_key, quantity").eq("user_id", user.id),
      supabase.from("profiles").select("active_board_skin").eq("id", user.id).maybeSingle(),
    ]);
    setItems((inv as InventoryItem[]) ?? []);
    if (profile?.active_board_skin) setActiveSkin(profile.active_board_skin);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime updates of inventory
  useEffect(() => {
    if (!user) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const ch = supabase
      .channel(`inv:${user.id}:${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (p) => {
          const next = (p.new as { active_board_skin?: string }).active_board_skin;
          if (next) setActiveSkin(next);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, refresh]);

  const owns = (key: string) => items.some((i) => i.item_key === key);
  const qty  = (key: string) => items.find((i) => i.item_key === key)?.quantity ?? 0;

  return { items, activeSkin, loading, owns, qty, refresh };
}
