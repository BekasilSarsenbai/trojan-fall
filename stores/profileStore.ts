"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocalGame {
  id: string;
  pgn: string;
  result: "win" | "loss" | "draw";
  playerColor: "white" | "black";
  accuracy: number;
  xp_earned: number;
  rating_delta: number;
  ducats_earned?: number;
  headline: string;
  narrative: string;
  incidents: unknown[];
  strengths: string[];
  territory: { white: number; black: number; contested: number };
  keyMoments: unknown[];
  moveCount: number;
  created_at: string;
}

interface ProfileState {
  username: string;
  city: string;
  rating: number;
  xp: number;
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  bestStreak: number;
  dayStreak: number;
  lastPlayedDate: string | null;
  games: LocalGame[];
  setUsername: (u: string) => void;
  setCity: (c: string) => void;
  recordGame: (g: LocalGame) => void;
  getGameById: (id: string) => LocalGame | undefined;
  reset: () => void;
}

const initial = {
  username: "Командир",
  city: "Алматы",
  rating: 800,
  xp: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  winStreak: 0,
  bestStreak: 0,
  dayStreak: 0,
  lastPlayedDate: null as string | null,
  games: [] as LocalGame[],
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initial,
      setUsername: (username) => set({ username }),
      setCity: (city) => set({ city }),
      recordGame: (g) =>
        set((state) => {
          const today = new Date().toISOString().slice(0, 10);
          const isWin = g.result === "win";
          const newWinStreak = isWin ? state.winStreak + 1 : 0;
          let newDayStreak = state.dayStreak;
          if (state.lastPlayedDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            newDayStreak = state.lastPlayedDate === yesterday ? state.dayStreak + 1 : 1;
          }
          return {
            xp: state.xp + Math.max(0, g.xp_earned),
            rating: Math.max(100, state.rating + g.rating_delta),
            gamesPlayed: state.gamesPlayed + 1,
            gamesWon: state.gamesWon + (isWin ? 1 : 0),
            winStreak: newWinStreak,
            bestStreak: Math.max(state.bestStreak, newWinStreak),
            dayStreak: newDayStreak,
            lastPlayedDate: today,
            games: [g, ...state.games].slice(0, 50),
          };
        }),
      getGameById: (id) => get().games.find((g) => g.id === id),
      reset: () => set(initial),
    }),
    { name: "trojan-fall-profile" },
  ),
);
