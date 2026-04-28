"use client";
import { RankBadge } from "@/components/ui/RankBadge";
import { Crown, Shield, Swords, Skull } from "lucide-react";

interface HUDProps {
  name: string;
  rankTitle: string;
  isActive: boolean;
  isInCheck?: boolean;
  capturedPieces?: string[];
  side?: "top" | "bottom";
  isAI?: boolean;
  thinking?: boolean;
  rating?: number;
}

const PIECE_GLYPHS: Record<string, string> = {
  p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔",
};

export function BattleHUD({
  name,
  rankTitle,
  isActive,
  isInCheck,
  capturedPieces = [],
  isAI,
  thinking,
  rating,
}: HUDProps) {
  const Icon = isAI ? Skull : Crown;

  return (
    <div
      className={`
        flex items-center justify-between px-3 sm:px-4 py-2.5
        bg-war-panel/80 backdrop-blur border border-war-border rounded-xl
        ${isInCheck ? "animate-pulse-red border-war-red/60 bg-red-950/30" : ""}
        ${isActive ? "ring-1 ring-war-gold/40" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
            border-2 transition-colors
            ${isActive
              ? "border-war-gold text-war-gold bg-war-gold/10 shadow-war-glow"
              : "border-war-border text-war-muted bg-war-surface"}
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-war-text font-semibold text-sm truncate max-w-[160px]">
              {name}
            </span>
            <RankBadge rank={rankTitle} size="sm" />
            {rating !== undefined && (
              <span className="chip border-war-border text-war-muted">
                {rating}
              </span>
            )}
          </div>
          <div className="flex gap-0.5 mt-0.5 min-h-[14px]">
            {capturedPieces.length === 0 && (
              <span className="text-[11px] text-war-dim">
                {isAI ? "AI Commander" : "Командир"}
              </span>
            )}
            {capturedPieces.map((p, i) => (
              <span
                key={i}
                className="text-base leading-none text-war-muted"
                title="захвачено"
              >
                {PIECE_GLYPHS[p]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isInCheck && (
          <span className="chip border-war-red/40 text-war-red bg-red-900/40 animate-pulse">
            <Swords className="w-3 h-3" /> ШАХ
          </span>
        )}
        {thinking && (
          <span className="chip border-war-gold/40 text-war-gold bg-war-gold/10">
            <span className="w-1.5 h-1.5 rounded-full bg-war-gold animate-pulse" />
            думает
          </span>
        )}
        {isActive && !isInCheck && !thinking && (
          <span className="chip border-war-gold/40 text-war-gold bg-war-gold/10">
            <Shield className="w-3 h-3" /> ХОД
          </span>
        )}
      </div>
    </div>
  );
}
