"use client";
import { Lock, Plus } from "lucide-react";
import { CARD_LIST, type CardKey } from "@/lib/siege/cards";

interface Props {
  cardsLeft: number;
  active: CardKey | null;
  unlocks: string[]; // contains 'card_shield_unlock', 'card_coronation_unlock' if owned
  enemyCards: number;
  onActivate: (key: CardKey) => void;
  onUnlockClick: (key: CardKey) => void;
  onBuyMore: () => void;
}

export function CardBar({
  cardsLeft,
  active,
  unlocks,
  enemyCards,
  onActivate,
  onUnlockClick,
  onBuyMore,
}: Props) {
  return (
    <div className="space-y-2.5">
      {/* Enemy cards row */}
      <div className="flex items-center justify-end gap-1.5 px-1">
        <span className="label text-[9px] mr-1">Карты противника:</span>
        {Array.from({ length: Math.min(enemyCards, 8) }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-7 rounded-sm border border-war-red/40 bg-war-red/10 flex items-center justify-center text-[10px] font-mono text-war-red/60"
          >
            ?
          </div>
        ))}
        {enemyCards > 8 && (
          <span className="text-[10px] text-war-red font-mono">+{enemyCards - 8}</span>
        )}
        {enemyCards === 0 && <span className="text-[10px] text-war-dim">—</span>}
      </div>

      {/* Player card bar */}
      <div className="panel liquid-glass p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 pr-3 border-r border-war-border">
          <span className="font-display text-war-gold font-black text-2xl">{cardsLeft}</span>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-widest text-war-muted font-bold">
              Карт
            </span>
            <span className="text-[9px] uppercase tracking-widest text-war-muted font-bold">
              осталось
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 justify-center">
          {CARD_LIST.map((card) => {
            const locked =
              card.rarity === "rare" &&
              !unlocks.includes(card.unlockKey ?? "");
            const isActive = active === card.key;
            const noCards = cardsLeft <= 0;

            const baseCls =
              "flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 rounded border-2 transition-all min-w-[80px] uppercase tracking-widest font-bold";

            let stateCls = "";
            if (isActive) {
              stateCls = "bg-war-gold text-black border-war-gold animate-rankGlow scale-105";
            } else if (locked) {
              stateCls =
                "border-dashed border-war-border text-war-muted opacity-60 hover:opacity-90 hover:border-war-gold/50";
            } else if (noCards) {
              stateCls = "border-war-border text-war-dim opacity-40 cursor-not-allowed line-through";
            } else {
              stateCls =
                "border-war-gold/40 text-war-text hover:border-war-gold hover:scale-105 hover:bg-war-gold/5";
            }

            return (
              <button
                key={card.key}
                disabled={!locked && noCards}
                onClick={() => {
                  if (locked) onUnlockClick(card.key);
                  else if (!noCards) onActivate(card.key);
                }}
                className={`${baseCls} ${stateCls}`}
                title={card.description}
              >
                <span className="text-base leading-none">
                  {locked ? <Lock className="w-3.5 h-3.5" /> : card.emoji}
                </span>
                <span className="text-[9px] leading-none">{card.short}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onBuyMore}
          className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-bold uppercase tracking-widest border-2 transition-all ${
            cardsLeft <= 0
              ? "border-war-gold bg-war-gold/15 text-war-gold animate-rankGlow"
              : "border-war-border text-war-muted hover:border-war-gold/50 hover:text-war-gold"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          50🪙
        </button>
      </div>
    </div>
  );
}
