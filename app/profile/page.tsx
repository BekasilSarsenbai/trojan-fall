"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfileStore } from "@/stores/profileStore";
import { RankBadge } from "@/components/ui/RankBadge";
import { XPBar } from "@/components/ui/XPBar";
import { ProModal } from "@/components/ui/ProModal";
import { getRankByXP } from "@/lib/chess/xp";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useWallet, REASON_LABELS, type WalletEvent } from "@/hooks/useWallet";
import {
  Trophy,
  Flame,
  Target,
  Swords,
  Crown,
  Pencil,
  Calendar,
  CheckCircle2,
  LogIn,
  LogOut,
  Mail,
  Coins,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const DAILY_MISSIONS = [
  {
    title: "Захвати центр",
    desc: "Займи 4 центральные клетки в одной партии",
    xp: 20,
  },
  {
    title: "Выживи без рокировки",
    desc: "Выиграй партию без рокировки",
    xp: 30,
  },
  {
    title: "Рекордная точность",
    desc: "Достигни accuracy > 85% в любой партии",
    xp: 25,
  },
];

export default function ProfilePage() {
  const profile = useProfileStore();
  const { user, configured, signOut } = useAuth();
  const { balance, events: walletEvents } = useWallet();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.username);
  const [draftCity, setDraftCity] = useState(profile.city);
  const [proOpen, setProOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setDraftName(profile.username);
    setDraftCity(profile.city);
  }, [profile.username, profile.city]);

  if (!hydrated) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-war-muted">Загружаю профиль…</div>;
  }

  const rank = getRankByXP(profile.xp);
  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
      : 0;

  async function saveProfile() {
    const newName = draftName.trim() || "Командир";
    const newCity = draftCity.trim() || "Алматы";
    profile.setUsername(newName);
    profile.setCity(newCity);

    if (user) {
      const supabase = getBrowserSupabase();
      if (supabase) {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              username: newName,
              display_name: newName,
              city: newCity,
            },
            { onConflict: "id" },
          );
      }
    }
    setEditing(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-16 h-16 rounded-xl bg-war-surface border-2 flex items-center justify-center text-2xl font-black"
              style={{ borderColor: rank.color, color: rank.color }}
            >
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-black truncate">{profile.username}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-war-muted hover:text-war-gold"
                  aria-label="edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-war-muted mt-0.5">
                <RankBadge rank={rank} size="md" />
                <span>· {profile.city}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <button
              onClick={() => setProOpen(true)}
              className="btn-secondary text-xs"
            >
              <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
            </button>
            {configured ? (
              user ? (
                <div className="flex items-center gap-2 text-[11px] text-war-muted">
                  <Mail className="w-3 h-3" />
                  <span className="truncate max-w-[160px]">{user.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-war-red hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" /> Выйти
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-[11px] text-war-gold hover:underline flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" /> Войти / Зарегистрироваться
                </Link>
              )
            ) : (
              <span className="text-[11px] text-war-dim">
                Локальный профиль (Supabase не подключен)
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          <XPBar xp={profile.xp} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<Trophy className="w-4 h-4" />} label="Рейтинг" value={profile.rating} />
        <Stat icon={<Swords className="w-4 h-4" />} label="Партий" value={profile.gamesPlayed} />
        <Stat icon={<Target className="w-4 h-4" />} label="Win rate" value={`${winRate}%`} />
        <Stat icon={<Flame className="w-4 h-4" />} label="Серия" value={`${profile.winStreak} (max ${profile.bestStreak})`} accent="text-orange-400" />
      </div>

      {/* Wallet section */}
      {user && balance !== null && (
        <div className="panel p-5 border-l-4 border-war-gold">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold flex items-center gap-1">
                <Coins className="w-3 h-3" /> Кошелёк
              </div>
              <div className="text-4xl sm:text-5xl font-black text-war-gold mt-1 flex items-baseline gap-1">
                {balance}
                <span className="text-lg">Δ</span>
              </div>
              <div className="text-xs text-war-muted">Дукаты — внутренняя военная валюта</div>
            </div>
            <Link href="/match/new" className="btn-secondary text-xs">
              <Coins className="w-3.5 h-3.5" /> Сделать дуэль
            </Link>
          </div>

          {walletEvents.length === 0 ? (
            <div className="text-xs text-war-dim border-t border-war-border/60 pt-3">
              Транзакций пока нет. Создай матч с дуэлью или сыграй с AI — это пополнит счёт.
            </div>
          ) : (
            <div className="border-t border-war-border/60 pt-3">
              <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-2">
                Последние транзакции
              </div>
              <div className="divide-y divide-war-border/40 max-h-[260px] overflow-y-auto scrollbar-thin">
                {walletEvents.slice(0, 12).map((e) => (
                  <WalletRow key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily streak */}
      <div className="panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-war-gold" />
          <div>
            <div className="text-war-text font-bold">Daily Streak</div>
            <div className="text-war-muted text-xs">
              {profile.dayStreak} дней подряд · потеряешь стрик при паузе &gt; 1 дня
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-orange-400 text-2xl font-black">
          <Flame className="w-6 h-6" />
          {profile.dayStreak}
        </div>
      </div>

      {/* Daily missions */}
      <div>
        <h3 className="text-war-muted text-[10px] uppercase tracking-widest font-bold mb-2">
          Ежедневные миссии
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DAILY_MISSIONS.map((m) => (
            <div key={m.title} className="panel p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-war-text font-bold text-sm">{m.title}</div>
                <span className="chip border-war-gold/30 text-war-gold bg-war-gold/10">
                  +{m.xp} XP
                </span>
              </div>
              <div className="text-war-muted text-xs leading-relaxed">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent games */}
      <div>
        <h3 className="text-war-muted text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center justify-between">
          Последние битвы
          <Link href="/play" className="text-war-gold text-[10px] normal-case tracking-normal">
            Сыграть ещё →
          </Link>
        </h3>
        {profile.games.length === 0 ? (
          <div className="panel p-6 text-center text-war-muted text-sm">
            Партий ещё нет. <Link href="/play" className="text-war-gold underline">Начать первую битву</Link>.
          </div>
        ) : (
          <div className="panel divide-y divide-war-border/60">
            {profile.games.slice(0, 8).map((g) => (
              <Link
                key={g.id}
                href={`/review/${g.id}`}
                className="flex items-center justify-between p-3 hover:bg-war-surface/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ResultDot result={g.result} />
                  <div className="min-w-0">
                    <div className="text-war-text text-sm truncate">
                      {g.headline}
                    </div>
                    <div className="text-war-dim text-[11px] font-mono">
                      {g.moveCount} ходов · accuracy {g.accuracy}% · {new Date(g.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      g.rating_delta >= 0 ? "text-emerald-400" : "text-war-red"
                    }`}
                  >
                    {g.rating_delta >= 0 ? "+" : ""}
                    {g.rating_delta}
                  </div>
                  <div className="text-war-gold text-[11px]">+{g.xp_earned} XP</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setEditing(false)}
        >
          <div
            className="panel p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-war-text font-bold text-lg mb-4">Редактировать профиль</div>
            <label className="block text-war-muted text-xs mb-1">Имя командира</label>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full bg-war-surface border border-war-border rounded-lg px-3 py-2 text-war-text mb-3"
              maxLength={24}
            />
            <label className="block text-war-muted text-xs mb-1">Город</label>
            <select
              value={draftCity}
              onChange={(e) => setDraftCity(e.target.value)}
              className="w-full bg-war-surface border border-war-border rounded-lg px-3 py-2 text-war-text mb-4"
            >
              {["Алматы", "Астана", "Шымкент", "Караганда", "Атырау", "Тараз"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 btn-secondary text-sm py-2">
                Отмена
              </button>
              <button onClick={saveProfile} className="flex-1 btn-primary text-sm py-2">
                <CheckCircle2 className="w-4 h-4" /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <ProModal open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent = "text-war-gold",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 text-war-muted text-[11px] uppercase tracking-widest">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-xl font-black ${accent}`}>{value}</div>
    </div>
  );
}

function WalletRow({ event }: { event: WalletEvent }) {
  const positive = event.amount > 0;
  const label = REASON_LABELS[event.reason] ?? event.reason;
  const date = new Date(event.created_at).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-2 py-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-war-red"
        }`}
      >
        {positive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-war-text text-sm truncate">{label}</div>
        <div className="text-[11px] text-war-dim font-mono">{date}</div>
      </div>
      <div
        className={`text-sm font-bold font-mono ${
          positive ? "text-emerald-400" : "text-war-red"
        }`}
      >
        {positive ? "+" : ""}
        {event.amount} Δ
      </div>
    </div>
  );
}

function ResultDot({ result }: { result: "win" | "loss" | "draw" }) {
  const c =
    result === "win"
      ? "bg-emerald-500"
      : result === "loss"
      ? "bg-war-red"
      : "bg-war-muted";
  const label = result === "win" ? "В" : result === "loss" ? "П" : "Н";
  return (
    <div className={`w-7 h-7 rounded-full ${c}/80 flex items-center justify-center font-bold text-xs text-white shrink-0`}>
      {label}
    </div>
  );
}
