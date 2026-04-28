import { Rank, getRankByXP } from "@/lib/chess/xp";

interface Props {
  rank?: Rank | string;
  xp?: number;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, xp, size = "md" }: Props) {
  const r: Rank =
    typeof rank === "string"
      ? { title: rank, threshold: 0, letter: rank[0] ?? "?", color: "#F5C542", badgeBg: "rgba(245,197,66,0.15)" }
      : rank ?? getRankByXP(xp ?? 0);

  const sizeCls =
    size === "sm" ? "text-[10px] px-1.5 py-0.5" : size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";

  return (
    <span
      className={`${sizeCls} inline-flex items-center gap-1 rounded font-mono uppercase tracking-widest font-bold border`}
      style={{ color: r.color, background: r.badgeBg, borderColor: r.color + "55" }}
      title={r.title}
    >
      <span>{r.letter}</span>
      <span className="hidden sm:inline">{r.title}</span>
    </span>
  );
}
