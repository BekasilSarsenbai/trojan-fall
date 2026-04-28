"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SiegeRoom } from "@/lib/siege/types";

export function useSiegeRoom(roomId: string | null) {
  const [room, setRoom] = useState<SiegeRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase не сконфигурирован");
      setLoading(false);
      return;
    }

    let active = true;

    supabase
      .from("siege_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else if (!data) setError("Комната не найдена");
        else setRoom(data as SiegeRoom);
        setLoading(false);
      });

    const channelKey = `siege:${roomId}:${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase
      .channel(channelKey)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "siege_rooms", filter: `id=eq.${roomId}` },
        (p) => {
          if (!active) return;
          setRoom(p.new as SiegeRoom);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [roomId]);

  return { room, loading, error };
}
