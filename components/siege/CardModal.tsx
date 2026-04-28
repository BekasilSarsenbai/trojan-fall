"use client";
import { useState } from "react";
import Link from "next/link";
import { Coins, X, Loader2, ExternalLink, AlertTriangle } from "lucide-react";

interface OutOfCardsProps {
  open: boolean;
  balance: number;
  onClose: () => void;
  onBuy: (size: 5 | 10) => Promise<{ ok: boolean; error?: string }>;
}

export function OutOfCardsModal({ open, balance, onClose, onBuy }: OutOfCardsProps) {
  const [busy, setBusy] = useState<5 | 10 | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function buy(size: 5 | 10) {
    setError(null);
    setBusy(size);
    const r = await onBuy(size);
    setBusy(null);
    if (r.ok) onClose();
    else setError(translate(r.error ?? "Ошибка"));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="panel liquid-glass p-6 max-w-md w-full neon-frame-gold" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-war-muted hover:text-war-text" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        <div className="font-display text-3xl mb-1">⚔️</div>
        <h2 className="font-display text-2xl font-black text-war-gold mb-1">
          Карты закончились!
        </h2>
        <p className="text-war-muted text-sm mb-4">Продолжи бой — пополни арсенал.</p>

        <div className="flex items-center justify-between bg-war-surface/50 border border-war-border rounded-xl px-4 py-3 mb-5">
          <span className="text-[10px] uppercase tracking-widest text-war-muted font-bold">
            Твой баланс
          </span>
          <div className="flex items-center gap-1.5 text-war-gold font-display font-black text-xl">
            <Coins className="w-4 h-4" /> {balance}
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          <Pack
            label="Взять 5 карт"
            size={5}
            cost={50}
            balance={balance}
            busy={busy}
            onBuy={buy}
          />
          <Pack
            label="Взять 10 карт"
            size={10}
            cost={90}
            balance={balance}
            busy={busy}
            onBuy={buy}
            best
          />
        </div>

        {error && (
          <div className="text-war-red text-xs flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3" /> {error}
          </div>
        )}

        <Link
          href="/shop"
          target="_blank"
          className="w-full inline-flex items-center justify-center gap-1 py-2 rounded border border-war-cyan/40 text-war-cyan text-xs font-bold uppercase tracking-widest hover:bg-war-cyan/10"
        >
          Пополнить дукаты <ExternalLink className="w-3 h-3" />
        </Link>

        <button
          onClick={onClose}
          className="w-full mt-3 text-[11px] text-war-muted hover:text-war-text underline"
        >
          Продолжить без карт
        </button>
      </div>
    </div>
  );
}

function Pack({
  label,
  size,
  cost,
  balance,
  busy,
  onBuy,
  best,
}: {
  label: string;
  size: 5 | 10;
  cost: number;
  balance: number;
  busy: 5 | 10 | null;
  onBuy: (s: 5 | 10) => void;
  best?: boolean;
}) {
  const can = balance >= cost && busy === null;
  return (
    <button
      disabled={!can}
      onClick={() => onBuy(size)}
      className={`w-full flex items-center justify-between gap-3 py-3 px-4 rounded border-2 transition-all ${
        best
          ? "border-war-gold bg-war-gold/10 hover:bg-war-gold/20 text-war-gold"
          : "border-war-border text-war-text hover:border-war-gold/50 hover:bg-war-gold/5"
      } disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase tracking-widest`}
    >
      <span className="flex items-center gap-2">
        {busy === size ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{label}</span>}
        {best && (
          <span className="chip border-war-gold/40 bg-war-gold/15 text-war-gold text-[9px] py-0 normal-case tracking-wider">
            ★ Лучшая цена
          </span>
        )}
      </span>
      <span className="flex items-center gap-1 font-mono">
        <Coins className="w-3.5 h-3.5" /> {cost}
      </span>
    </button>
  );
}

function translate(msg: string): string {
  if (msg.includes("insufficient_ducats")) return "Недостаточно дукатов";
  if (msg.includes("invalid_pack_size")) return "Неверный размер пачки";
  return msg;
}

interface UnlockProps {
  open: boolean;
  cardKey: string;
  emoji: string;
  title: string;
  description: string;
  price: number;
  balance: number;
  onUnlock: () => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export function UnlockCardModal({
  open,
  emoji,
  title,
  description,
  price,
  balance,
  onUnlock,
  onClose,
}: UnlockProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;
  async function unlock() {
    setError(null);
    setBusy(true);
    const r = await onUnlock();
    setBusy(false);
    if (r.ok) onClose();
    else setError(translate(r.error ?? ""));
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="panel liquid-glass p-6 max-w-sm w-full neon-frame-gold" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-3 text-center">{emoji}</div>
        <div className="label-gold text-center mb-1">РЕДКАЯ КАРТА</div>
        <h2 className="font-display text-xl font-black text-war-text text-center mb-2">{title}</h2>
        <p className="text-war-muted text-sm text-center mb-5">{description}</p>

        <div className="flex items-center justify-between bg-war-surface/50 border border-war-border rounded-lg px-3 py-2 mb-4">
          <span className="text-[10px] uppercase tracking-widest text-war-muted">Цена</span>
          <div className="flex items-center gap-1 text-war-gold font-bold">
            <Coins className="w-4 h-4" /> {price}
          </div>
        </div>

        {error && (
          <div className="text-war-red text-xs mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-xs uppercase tracking-widest font-bold border border-war-border text-war-muted hover:text-war-text rounded">
            Отмена
          </button>
          <button
            onClick={unlock}
            disabled={busy || balance < price}
            className="flex-1 py-2 text-xs uppercase tracking-widest font-bold bg-war-gold text-black hover:bg-war-goldDark rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 inline animate-spin" /> : "Разблокировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
