export interface Rank {
  title: string;
  threshold: number;
  letter: string;
  color: string;
  badgeBg: string;
}

export const RANKS: Rank[] = [
  { title: "Рекрут",                       threshold:     0, letter: "Р", color: "#94A3B8", badgeBg: "rgba(148, 163, 184, 0.15)" },
  { title: "Пехотинец",                    threshold:   200, letter: "П", color: "#10B981", badgeBg: "rgba(16, 185, 129, 0.15)" },
  { title: "Сержант",                      threshold:   500, letter: "С", color: "#2F80ED", badgeBg: "rgba(47, 128, 237, 0.15)" },
  { title: "Капитан",                      threshold:  1200, letter: "К", color: "#7C3AED", badgeBg: "rgba(124, 58, 237, 0.15)" },
  { title: "Майор",                        threshold:  2500, letter: "М", color: "#F5C542", badgeBg: "rgba(245, 197, 66, 0.15)" },
  { title: "Полковник",                    threshold:  5000, letter: "ПК", color: "#FB923C", badgeBg: "rgba(251, 146, 60, 0.15)" },
  { title: "Генерал",                      threshold: 10000, letter: "Г", color: "#EF4444", badgeBg: "rgba(239, 68, 68, 0.18)" },
  { title: "Верховный Главнокомандующий", threshold: 25000, letter: "ВГ", color: "#F472B6", badgeBg: "rgba(244, 114, 182, 0.20)" },
];

export function getRankByXP(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.threshold) current = rank;
    else break;
  }
  return current;
}

export function getNextRank(xp: number): Rank | null {
  const idx = RANKS.findIndex((r) => xp < r.threshold);
  return idx === -1 ? null : RANKS[idx];
}

export function getProgressToNextRank(xp: number): {
  current: Rank;
  next: Rank | null;
  progress: number;
  needed: number;
} {
  const current = getRankByXP(xp);
  const next = getNextRank(xp);
  if (!next) return { current, next: null, progress: 1, needed: 0 };

  const span = next.threshold - current.threshold;
  const earned = xp - current.threshold;
  return {
    current,
    next,
    progress: Math.max(0, Math.min(1, earned / span)),
    needed: next.threshold - xp,
  };
}

export function calculateXPGain(
  result: "win" | "loss" | "draw",
  accuracy: number,
  vsHuman: boolean = false,
): number {
  let xp = 0;
  if (result === "win") xp = vsHuman ? 50 : 25;
  else if (result === "draw") xp = 10;
  else xp = 5;

  if (accuracy > 80) xp += 15;
  else if (accuracy > 65) xp += 8;

  return xp;
}
