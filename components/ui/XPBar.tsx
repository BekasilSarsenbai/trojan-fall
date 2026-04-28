"use client";
import { getProgressToNextRank } from "@/lib/chess/xp";

export function XPBar({ xp, compact }: { xp: number; compact?: boolean }) {
  const { current, next, progress, needed } = getProgressToNextRank(xp);

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-[160px]">
        <div className="flex-1 h-1.5 bg-war-surface rounded-full overflow-hidden border border-war-border">
          <div
            className="h-full transition-[width] duration-500"
            style={{ width: `${progress * 100}%`, background: current.color }}
          />
        </div>
        <span className="text-[10px] text-war-muted font-mono">{xp}xp</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between text-xs">
        <span className="text-war-muted">
          <span className="font-bold" style={{ color: current.color }}>
            {current.title}
          </span>
        </span>
        <span className="text-war-muted">
          {next ? (
            <>
              <span className="text-war-text font-bold">{xp}</span>
              <span className="text-war-dim"> / {next.threshold} XP</span>
            </>
          ) : (
            <span className="text-war-gold">МАКС. ЗВАНИЕ</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-war-surface rounded-full overflow-hidden border border-war-border">
        <div
          className="h-full transition-[width] duration-700 rounded-full"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${current.color}, ${next?.color ?? "#F5C542"})`,
            boxShadow: `0 0 12px ${current.color}66`,
          }}
        />
      </div>
      {next && (
        <div className="text-[11px] text-war-dim">
          До звания «{next.title}» — {needed} XP
        </div>
      )}
    </div>
  );
}
