import { Crown, Skull, Trophy } from "lucide-react";

interface Props {
  name: string;
  rating?: number;
  level?: number;
  side: "blue" | "red";
  isAI?: boolean;
  isActive?: boolean;
  isInCheck?: boolean;
  capturedPieces?: string[];
  reverse?: boolean;
}

const PIECE_GLYPHS: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
};

export function PlayerCard({
  name,
  rating,
  level,
  side,
  isAI,
  isActive,
  isInCheck,
  capturedPieces = [],
  reverse,
}: Props) {
  const cMap = {
    blue: {
      ring: "ring-war-cyan/60",
      glow: "shadow-cyan",
      activeRing: "ring-war-cyan animate-cyanPulse",
      bg: "from-war-cyan/15 to-transparent",
      text: "text-war-cyan",
      border: "border-war-cyan/40",
    },
    red: {
      ring: "ring-war-red/60",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
      activeRing: "ring-war-red animate-checkPulse",
      bg: "from-war-red/15 to-transparent",
      text: "text-war-red",
      border: "border-war-red/40",
    },
  }[side];

  const Avatar = (
    <div className="relative shrink-0">
      <div
        className={`w-14 h-14 rounded-full bg-gradient-to-br ${cMap.bg} border-2 ${cMap.border} ${
          isActive ? `ring-2 ring-offset-2 ring-offset-war-bg ${cMap.activeRing}` : ""
        } ${isInCheck ? "animate-pulse-red" : ""} flex items-center justify-center font-display font-black text-xl ${cMap.text}`}
      >
        {isAI ? <Skull className="w-7 h-7" /> : <Crown className="w-7 h-7" />}
      </div>
      {level !== undefined && (
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-war-bg border ${cMap.border} text-[10px] font-display font-bold ${cMap.text}`}
        >
          {level}
        </div>
      )}
    </div>
  );

  const Body = (
    <div className={`flex-1 min-w-0 ${reverse ? "text-right" : ""}`}>
      <div
        className={`flex items-center gap-2 ${reverse ? "justify-end flex-row-reverse" : ""}`}
      >
        <span className="font-display font-bold text-base sm:text-lg text-war-text truncate">
          {name}
        </span>
        {isInCheck && (
          <span className="chip border-war-red/50 text-war-red bg-war-red/10 animate-pulse">
            CHECK
          </span>
        )}
      </div>
      <div
        className={`flex items-center gap-2 mt-1 text-[11px] font-mono ${
          reverse ? "justify-end" : ""
        }`}
      >
        {rating !== undefined && (
          <span className={`flex items-center gap-1 ${cMap.text}`}>
            ◇ {rating}
          </span>
        )}
        {rating !== undefined && (
          <span className="text-war-muted flex items-center gap-1">
            <Trophy className="w-3 h-3" />
          </span>
        )}
      </div>
      <div
        className={`flex gap-0.5 mt-1.5 ${reverse ? "justify-end" : ""} min-h-[14px]`}
      >
        {capturedPieces.length === 0 ? (
          <span className="text-[10px] text-war-dim font-mono uppercase tracking-widest">
            {isAI ? "AI Commander" : "Командир"}
          </span>
        ) : (
          capturedPieces.map((p, i) => (
            <span
              key={i}
              className={`text-base leading-none ${cMap.text} opacity-70`}
              title="захвачено"
            >
              {PIECE_GLYPHS[p]}
            </span>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex items-center gap-3 panel p-3 ${
        isActive ? cMap.glow : ""
      } ${reverse ? "flex-row-reverse" : ""}`}
    >
      {Avatar}
      {Body}
    </div>
  );
}
