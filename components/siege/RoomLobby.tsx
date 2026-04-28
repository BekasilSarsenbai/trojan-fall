"use client";
import { useEffect, useState } from "react";
import { Loader2, Copy, Check, Users, Crown, Skull } from "lucide-react";
import type { SiegeRoom } from "@/lib/siege/types";

interface Props {
  room: SiegeRoom;
  isCreator: boolean;
}

export function RoomLobby({ room, isCreator }: Props) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (room.status === "active" && countdown === null) {
      setCountdown(3);
    }
  }, [room.status, countdown]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function copy() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(`${window.location.origin}/siege/${room.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (room.status === "active" && countdown !== null && countdown > 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="font-display text-[10px] tracking-[0.4em] text-war-cyan mb-4">
          ПРОТИВНИК · ПОДКЛЮЧЁН
        </div>
        <div className="font-display text-[120px] font-black text-war-gold gold-text-glow leading-none animate-victoryPop">
          {countdown}
        </div>
        <div className="text-war-muted text-sm mt-4 uppercase tracking-widest">
          Битва начнётся через {countdown}…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="panel liquid-glass p-8 max-w-lg w-full text-center neon-frame-cyan">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-war-cyan/15 border-2 border-war-cyan/40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-war-cyan animate-spin" />
          </div>
        </div>

        <div className="label-cyan mb-2">ДУЭЛЬ · ROOM</div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-war-text mb-2">
          {isCreator ? "Ожидание противника…" : "Подключение…"}
        </h2>
        <p className="text-war-muted text-sm mb-6">
          {isCreator
            ? "Скопируй ссылку и пришли другу. Как только он откроет — бой начнётся."
            : "Ждём пока второй командир закрепится в штабе."}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <SeatCard
            occupied={!!room.player1_id}
            name={room.player1_name ?? "Ожидание"}
            label="Белые"
            color="cyan"
            isMe={isCreator}
          />
          <SeatCard
            occupied={!!room.player2_id}
            name={room.player2_name ?? "Ожидание"}
            label="Чёрные"
            color="red"
            isMe={!isCreator && !!room.player2_id}
          />
        </div>

        {isCreator && (
          <button
            onClick={copy}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded
                       border-2 border-war-gold/50 text-war-gold hover:bg-war-gold/10
                       uppercase tracking-widest font-bold text-sm transition-all
                       hover:shadow-gold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Скопировано
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Скопировать ссылку
              </>
            )}
          </button>
        )}

        <div className="mt-6 pt-5 border-t border-war-border">
          <div className="label text-[10px] mb-2 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Room ID
          </div>
          <div className="font-mono text-war-cyan text-base tracking-widest">{room.id}</div>
        </div>
      </div>
    </div>
  );
}

function SeatCard({
  occupied,
  name,
  label,
  color,
  isMe,
}: {
  occupied: boolean;
  name: string;
  label: string;
  color: "cyan" | "red";
  isMe?: boolean;
}) {
  const cls = color === "cyan" ? "border-war-cyan/40 text-war-cyan" : "border-war-red/40 text-war-red";
  const Icon = color === "cyan" ? Crown : Skull;
  return (
    <div
      className={`panel p-3 flex flex-col items-center gap-2 ${
        occupied ? cls : "border-war-border text-war-muted opacity-60"
      } border-2`}
    >
      <Icon className="w-6 h-6" />
      <div className="text-[10px] uppercase tracking-widest font-bold">{label}</div>
      <div className="text-war-text font-display font-bold text-sm truncate w-full text-center">
        {occupied ? name : "—"}
      </div>
      {isMe && (
        <div className="chip border-war-gold/40 text-war-gold bg-war-gold/10 text-[9px] py-0">ТЫ</div>
      )}
    </div>
  );
}
