import type { KeyMoment } from "@/lib/chess/review";

export function MomentsTimeline({
  moments,
  totalMoves,
}: {
  moments: KeyMoment[];
  totalMoves: number;
}) {
  if (moments.length === 0) return null;
  const total = Math.max(totalMoves, 1);

  return (
    <div className="panel p-4">
      <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-3">
        Хронология битвы
      </div>
      <div className="relative h-12 mb-2">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-war-border" />
        {moments.map((m, i) => {
          const left = `${Math.min(98, (m.ply / total) * 100)}%`;
          const colorClass =
            m.kind === "good" ? "bg-war-green border-emerald-300" : m.kind === "bad" ? "bg-war-red border-red-300" : "bg-war-cyan border-blue-300";
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group"
              style={{ left }}
            >
              <div
                className={`w-3 h-3 rounded-full border-2 ${colorClass} shadow-lg transition-transform group-hover:scale-150`}
              />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-war-panel border border-war-border rounded px-2 py-1 text-[10px] text-war-text font-mono z-10">
                {m.moveNumber}. {m.san} — {m.note}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-war-dim">
        <span>1</span>
        <span>{Math.ceil(total / 2)}</span>
      </div>
    </div>
  );
}
