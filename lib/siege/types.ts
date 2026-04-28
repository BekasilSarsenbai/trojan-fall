export interface SiegeRoom {
  id: string;
  player1_id: string | null;
  player2_id: string | null;
  player1_name: string | null;
  player2_name: string | null;
  player1_cards: number;
  player2_cards: number;
  player1_unlocks: string[];
  player2_unlocks: string[];
  current_fen: string;
  pgn: string;
  turn: "white" | "black";
  shielded_square: string | null;
  shielded_until_ply: number | null;
  status: "waiting" | "active" | "finished";
  result: "win_white" | "win_black" | "draw" | null;
  end_method: "checkmate" | "stalemate" | "draw" | "resignation" | null;
  last_card_event: { card: string; ply: number; by: "white" | "black"; meta?: unknown } | null;
  created_at: string;
  updated_at: string;
}

export type SeatColor = "white" | "black";
