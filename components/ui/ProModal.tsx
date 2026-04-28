"use client";
import { Crown, Check, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FEATURES_FREE = [
  "Игра против AI",
  "3 War Report в день",
  "Лидерборд города",
];

const FEATURES_PRO = [
  "Безлимитный War Report",
  "XP буст ×1.5",
  "Эксклюзивные скины досок",
  "Battle Pass — сезонные награды",
  "Расширенная аналитика партий",
  "Приоритетный matchmaking",
];

export function ProModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="panel max-w-lg w-full p-6 sm:p-8 relative shadow-war-glow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-war-muted hover:text-war-text"
          onClick={onClose}
          aria-label="close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-war-gold/15 border border-war-gold/40 p-2 rounded-lg">
            <Crown className="w-6 h-6 text-war-gold" />
          </div>
          <div>
            <div className="text-war-gold font-bold text-xl">Trojan Fall PRO</div>
            <div className="text-war-muted text-xs">Открой все возможности командира</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="border border-war-border rounded-xl p-4">
            <div className="text-war-text font-bold mb-1">Free</div>
            <div className="text-2xl font-bold mb-3">$0</div>
            <ul className="text-war-muted text-xs space-y-1.5">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-3.5 h-3.5 text-war-muted shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-war-gold/60 rounded-xl p-4 bg-war-gold/5 relative">
            <div className="absolute -top-3 left-3 bg-war-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
              Топ выбор
            </div>
            <div className="text-war-gold font-bold mb-1">Pro</div>
            <div className="text-2xl font-bold mb-3">
              $4.99
              <span className="text-sm font-normal text-war-muted">/мес</span>
            </div>
            <ul className="text-war-text text-xs space-y-1.5">
              {FEATURES_PRO.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-3.5 h-3.5 text-war-gold shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button className="btn-primary w-full mt-6">
          Стать командиром Pro
        </button>
        <div className="text-center text-[11px] text-war-dim mt-3">
          Pro+ ($9.99) и Academy ($49) — для серьёзных игроков и тренеров
        </div>
      </div>
    </div>
  );
}
