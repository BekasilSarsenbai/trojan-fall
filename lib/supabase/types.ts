export interface DBProfile {
  id: string;
  username: string;
  display_name: string | null;
  city: string;
  country: string;
  rating: number;
  xp: number;
  rank_title: string;
  games_played: number;
  games_won: number;
  win_streak: number;
  best_streak: number;
  last_active: string | null;
  avatar_style: string | null;
  created_at: string;
}

export interface DBGame {
  id: string;
  user_id: string;
  pgn: string;
  result: "win" | "loss" | "draw";
  player_color: "white" | "black";
  accuracy: number | null;
  territory: number | null;
  incidents: unknown;
  strengths: unknown;
  headline: string | null;
  narrative: string | null;
  xp_earned: number;
  rating_delta: number;
  move_count: number | null;
  duration_secs: number | null;
  created_at: string;
}

export interface DBLeaderboardRow {
  id: string;
  username: string;
  display_name: string | null;
  city: string;
  rating: number;
  xp: number;
  rank_title: string;
  games_played: number;
  games_won: number;
  win_streak: number;
  avatar_style: string | null;
  city_rank: number;
}
