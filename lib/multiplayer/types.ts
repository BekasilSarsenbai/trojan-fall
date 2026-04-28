export type MatchStatus = "waiting" | "active" | "finished" | "abandoned";
export type MatchResult = "win_white" | "win_black" | "draw" | "resigned" | null;
export type MatchEndMethod = "checkmate" | "stalemate" | "resignation" | "draw" | null;

export interface Match {
  id: string;
  white_user_id: string | null;
  black_user_id: string | null;
  white_username: string | null;
  black_username: string | null;
  pgn: string;
  current_fen: string;
  turn: "white" | "black";
  status: MatchStatus;
  result: MatchResult;
  end_method: MatchEndMethod;
  invite_code: string;
  stake: number;
  created_at: string;
  updated_at: string;
}
