"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Match } from "@/lib/multiplayer/types";

interface UseMatchResult {
  match: Match | null;
  loading: boolean;
  matchError: string | null;
  joinError: string | null;
  myColor: "white" | "black" | null;
  isMyTurn: boolean;
  joinAsBlack: (userId: string, username: string) => Promise<void>;
  pushMove: (newPgn: string, newFen: string, newTurn: "white" | "black") => Promise<void>;
  finish: (result: Match["result"], method: Match["end_method"]) => Promise<void>;
  resign: () => Promise<void>;
  cancelMatch: () => Promise<{ ok: boolean; error?: string }>;
  clearJoinError: () => void;
}

export function useMatch(matchId: string, userId: string | null): UseMatchResult {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const matchRef = useRef<Match | null>(null);
  matchRef.current = match;

  // Initial fetch + subscribe
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setMatchError("Supabase не сконфигурирован");
      setLoading(false);
      return;
    }
    if (!matchId) return;

    let active = true;

    supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMatchError(error.message);
        } else if (!data) {
          setMatchError("Матч не найден");
        } else {
          setMatch(data as Match);
        }
        setLoading(false);
      });

    const channelKey = `match:${matchId}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelKey)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          if (!active) return;
          setMatch(payload.new as Match);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const myColor: "white" | "black" | null = !match || !userId
    ? null
    : match.white_user_id === userId
    ? "white"
    : match.black_user_id === userId
    ? "black"
    : null;

  const isMyTurn = !!(match && myColor && match.status === "active" && match.turn === myColor);

  const joinAsBlack = useCallback(
    async (uid: string, username: string) => {
      const supabase = getBrowserSupabase();
      if (!supabase || !match) return;
      if (match.white_user_id === uid) return;
      if (match.black_user_id) return;
      const { error } = await supabase.rpc("join_match", {
        p_match_id: match.id,
        p_username: username,
      });
      if (error) setJoinError(translateJoinError(error.message));
      else setJoinError(null);
    },
    [match],
  );

  const pushMove = useCallback(
    async (newPgn: string, newFen: string, newTurn: "white" | "black") => {
      const supabase = getBrowserSupabase();
      if (!supabase || !match) return;
      const { error } = await supabase
        .from("matches")
        .update({ pgn: newPgn, current_fen: newFen, turn: newTurn })
        .eq("id", match.id);
      if (error) setJoinError(error.message);
    },
    [match],
  );

  const finish = useCallback(
    async (result: Match["result"], method: Match["end_method"]) => {
      const supabase = getBrowserSupabase();
      if (!supabase || !match) return;
      const { error } = await supabase
        .from("matches")
        .update({ status: "finished", result, end_method: method })
        .eq("id", match.id);
      if (error) setJoinError(error.message);
    },
    [match],
  );

  const resign = useCallback(async () => {
    if (!match || !myColor) return;
    const result: Match["result"] = myColor === "white" ? "win_black" : "win_white";
    await finish(result, "resignation");
  }, [match, myColor, finish]);

  const cancelMatch = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !match) return { ok: false, error: "no_supabase" };
    const { error } = await supabase.rpc("cancel_match", { p_match_id: match.id });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, [match]);

  const clearJoinError = useCallback(() => setJoinError(null), []);

  return {
    match,
    loading,
    matchError,
    joinError,
    myColor,
    isMyTurn,
    joinAsBlack,
    pushMove,
    finish,
    resign,
    cancelMatch,
    clearJoinError,
  };
}

function translateJoinError(msg: string): string {
  if (msg.includes("insufficient_ducats")) return "Недостаточно дукатов для входа в матч.";
  if (msg.includes("match_full")) return "В матче уже два игрока.";
  if (msg.includes("match_not_waiting")) return "Матч уже идёт или закончился.";
  if (msg.includes("cannot_join_own_match")) return "Нельзя присоединиться к своему матчу.";
  if (msg.includes("not_authenticated")) return "Войди в систему, чтобы играть.";
  return msg;
}
