"use client";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SiegeRoom } from "./types";

export function generateRoomId(): string {
  // 8 chars: lowercase alphanumeric
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function createRoom(roomId: string, username: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { ok: false, error: "Supabase не сконфигурирован" };
  const { error } = await supabase.rpc("create_siege_room", { p_room_id: roomId, p_username: username });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function joinRoom(roomId: string, username: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { ok: false, error: "Supabase не сконфигурирован" };
  const { error } = await supabase.rpc("join_siege_room", { p_room_id: roomId, p_username: username });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchRoom(roomId: string): Promise<SiegeRoom | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("siege_rooms").select("*").eq("id", roomId).maybeSingle();
  return (data as SiegeRoom | null) ?? null;
}

export interface PushUpdateInput {
  current_fen?: string;
  pgn?: string;
  turn?: "white" | "black";
  player1_cards?: number;
  player2_cards?: number;
  shielded_square?: string | null;
  shielded_until_ply?: number | null;
  status?: "waiting" | "active" | "finished";
  result?: SiegeRoom["result"];
  end_method?: SiegeRoom["end_method"];
  last_card_event?: SiegeRoom["last_card_event"];
}

export async function pushRoomUpdate(roomId: string, patch: PushUpdateInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { ok: false, error: "no_supabase" };
  const { error } = await supabase.from("siege_rooms").update(patch).eq("id", roomId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function buySiegeCards(roomId: string, packSize: 5 | 10): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { ok: false, error: "no_supabase" };
  const { error } = await supabase.rpc("buy_siege_cards", { p_room_id: roomId, p_pack_size: packSize });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
