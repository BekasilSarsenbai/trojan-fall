"use client";
import { useEffect, useRef } from "react";
import type { BattleEvent } from "@/lib/chess/narrative";
import { Swords, Crown, Shield, AlertTriangle, Flag } from "lucide-react";

const ICONS = {
  capture: Swords,
  check: AlertTriangle,
  castle: Shield,
  promotion: Crown,
  checkmate: Flag,
  move: Swords,
};

const COLORS = {
  capture: "text-war-red",
  check: "text-orange-400",
  castle: "text-war-cyan",
  promotion: "text-war-gold",
  checkmate: "text-war-gold",
  move: "text-war-muted",
};

export function BattleLog({ events }: { events: BattleEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  const filtered = events.filter((e) => e.type !== "move").slice(-30);

  if (filtered.length === 0) {
    return (
      <div className="p-3 text-xs text-war-dim text-center">
        События появятся в ходе битвы
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="max-h-[260px] overflow-y-auto scrollbar-thin px-2 py-1 space-y-1.5"
    >
      {filtered.map((e, i) => {
        const Icon = ICONS[e.type];
        const sideColor = e.side === "white" ? "text-war-text" : "text-war-muted";
        return (
          <div
            key={i}
            className="text-xs flex items-start gap-2 p-1.5 rounded hover:bg-war-surface/40 animate-fade-in"
          >
            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${COLORS[e.type]}`} />
            <div className="min-w-0">
              <div className={`leading-tight ${sideColor}`}>{e.text}</div>
              <div className="text-[10px] font-mono text-war-dim mt-0.5">
                {Math.floor(e.ply / 2) + 1}.{e.side === "white" ? "" : ".."} {e.san}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
