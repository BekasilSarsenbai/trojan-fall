"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfileStore } from "@/stores/profileStore";
import { useWallet } from "@/hooks/useWallet";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  Loader2,
  Swords,
  AlertTriangle,
  LogIn,
  Coins,
  Trophy,
  Crown,
  Skull,
} from "lucide-react";

const STAKES = [0, 50, 100, 500, 1000];

export default function NewMatchPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const username = useProfileStore((s) => s.username);
  const { balance } = useWallet();
  const [stake, setStake] = useState(50);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createMatch() {
    setError(null);
    if (!user) return;
    if (balance !== null && balance < stake) {
      setError(`Недостаточно дукатов (баланс ${balance}, нужно ${stake})`);
      return;
    }
    setCreating(true);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase не сконфигурирован");
      setCreating(false);
      return;
    }

    const { data, error } = await supabase.rpc("create_match_with_stake", {
      p_username: username || user.email?.split("@")[0] || "Командир",
      p_stake: stake,
    });

    if (error) {
      setError(translateRpcError(error.message));
      setCreating(false);
    } else if (data) {
      router.replace(`/match/${data}`);
    }
  }

  if (authLoading) {
    return (
      <Center>
        <Loader2 className="w-6 h-6 text-war-gold animate-spin" />
      </Center>
    );
  }

  if (!user) {
    return (
      <Center>
        <AlertTriangle className="w-8 h-8 text-war-gold mb-2" />
        <div className="text-war-text font-bold mb-1">Нужен аккаунт</div>
        <p className="text-war-muted text-sm mb-4 text-center max-w-xs">
          Чтобы создать матч с дуэлью, командир должен войти в систему.
        </p>
        <Link href="/auth/login" className="btn-primary text-sm">
          <LogIn className="w-4 h-4" /> Войти
        </Link>
      </Center>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Coins className="w-5 h-5 text-war-gold" />
          <span className="text-[10px] tracking-[0.3em] text-war-gold font-mono">
            СТАВКА КОМАНДИРА
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-1">
          Создать матч с другом
        </h1>
        <p className="text-war-muted text-sm">
          Выбери дуэль — оба игрока кладут её в общий пот.
          Победитель забирает всё, ничья возвращает деньги.
        </p>
      </div>

      <div className="panel p-5 sm:p-6 space-y-5">
        {/* Balance */}
        <div className="flex items-center justify-between bg-war-surface/50 border border-war-border rounded-xl px-4 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-war-muted">
              Твой баланс
            </div>
            <div className="text-2xl font-black text-war-gold flex items-center gap-1">
              {balance ?? "—"} <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-war-muted">
              Командир
            </div>
            <div className="text-sm text-war-text font-bold">{username}</div>
          </div>
        </div>

        {/* Stake selector */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-2">
            Дуэль
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {STAKES.map((s) => {
              const tooMuch = balance !== null && s > balance;
              const isActive = stake === s;
              return (
                <button
                  key={s}
                  disabled={tooMuch}
                  onClick={() => setStake(s)}
                  className={`
                    py-3 rounded-lg border font-bold transition-all text-sm
                    ${isActive
                      ? "border-war-gold bg-war-gold text-black shadow-war-glow"
                      : "border-war-border bg-war-surface text-war-text hover:border-war-gold/50"}
                    ${tooMuch ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {s === 0 ? "Free" : `${s} Δ`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pot preview */}
        {stake > 0 && (
          <div className="bg-war-gold/5 border border-war-gold/30 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-war-muted">Твоя дуэль</span>
              <span className="text-war-text font-bold">−{stake} Δ</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-war-muted">Дуэль соперника</span>
              <span className="text-war-text font-bold">−{stake} Δ</span>
            </div>
            <div className="flex items-center justify-between border-t border-war-border/60 pt-2 mt-2">
              <span className="text-war-gold font-bold flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Пот победителю
              </span>
              <span className="text-war-gold text-xl font-black">{stake * 2} Δ</span>
            </div>
            <div className="text-[10px] text-war-dim mt-2 leading-relaxed">
              При ничьей оба получают свои дукаты обратно. Сдача = противник забирает пот.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-war-red/40 text-red-200 text-sm rounded-lg px-3 py-2 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={createMatch}
          disabled={creating || (balance !== null && balance < stake)}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
          {stake === 0 ? "Создать матч (без дуэль)" : `Поставить ${stake} Δ и создать матч`}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 text-center">
        <Reward icon={<Trophy className="w-4 h-4" />} label="Победа" amount={`+${stake * 2} Δ`} accent="text-emerald-400" />
        <Reward icon={<Crown className="w-4 h-4" />} label="Ничья" amount={`+${stake} Δ`} accent="text-war-muted" />
        <Reward icon={<Skull className="w-4 h-4" />} label="Поражение" amount={`−${stake} Δ`} accent="text-war-red" />
      </div>
    </div>
  );
}

function Reward({
  icon,
  label,
  amount,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  accent: string;
}) {
  return (
    <div className="panel p-3">
      <div className={`flex items-center justify-center gap-1 text-[11px] uppercase tracking-widest ${accent}`}>
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-bold ${accent}`}>{amount}</div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      {children}
    </div>
  );
}

function translateRpcError(msg: string): string {
  if (msg.includes("insufficient_ducats")) return "Недостаточно дукатов на счёте.";
  if (msg.includes("not_authenticated")) return "Сначала войди в систему.";
  if (msg.includes("invalid_stake")) return "Некорректная дуэль.";
  return msg;
}
