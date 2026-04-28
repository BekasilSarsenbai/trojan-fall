"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Chess, Move } from "chess.js";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfileStore } from "@/stores/profileStore";
import { useMatch } from "@/hooks/useMatch";
import { useInventory } from "@/hooks/useInventory";
import { BattleHUD } from "@/components/battle/BattleHUD";
import { MoveHistory } from "@/components/battle/MoveHistory";
import { BattleLog } from "@/components/battle/BattleLog";
import { describeMove, BattleEvent } from "@/lib/chess/narrative";
import { getRankByXP } from "@/lib/chess/xp";
import {
  Map,
  Flag,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  LogIn,
  Swords,
  Users,
  Crown,
  Trophy,
  Skull,
  Equal,
  Coins,
} from "lucide-react";

const MultiplayerBoard = dynamic(
  () => import("@/components/battle/MultiplayerBoard").then((m) => m.MultiplayerBoard),
  { ssr: false, loading: () => <BoardSkeleton /> },
);

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const username = useProfileStore((s) => s.username);
  const xp = useProfileStore((s) => s.xp);
  const { activeSkin } = useInventory();

  const {
    match,
    loading,
    matchError,
    joinError,
    myColor,
    isMyTurn,
    joinAsBlack,
    pushMove,
    finish,
    resign,
    cancelMatch,
    clearJoinError,
  } = useMatch(params.id, user?.id ?? null);

  const [showWarMap, setShowWarMap] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmingResign, setConfirmingResign] = useState(false);
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [captured, setCaptured] = useState<{ white: string[]; black: string[] }>({
    white: [],
    black: [],
  });

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !match) return "";
    return `${window.location.origin}/match/${match.id}`;
  }, [match]);

  // Re-derive events/history/captured from PGN whenever match.pgn changes
  useEffect(() => {
    if (!match?.pgn) {
      setEvents([]);
      setHistory([]);
      setCaptured({ white: [], black: [] });
      return;
    }
    const g = new Chess();
    try { g.loadPgn(match.pgn); } catch { return; }
    const verbose = g.history({ verbose: true }) as Move[];
    const evs: BattleEvent[] = verbose.map((m, i) => describeMove(m, i));
    setEvents(evs);
    setHistory(g.history());
    const cap: { white: string[]; black: string[] } = { white: [], black: [] };
    verbose.forEach((m) => {
      if (m.captured) {
        if (m.color === "w") cap.white.push(m.captured);
        else cap.black.push(m.captured);
      }
    });
    setCaptured(cap);
  }, [match?.pgn]);

  // Auto-join as black if there's no black yet and you're not creator
  useEffect(() => {
    if (!match || !user) return;
    if (match.status !== "waiting") return;
    if (match.white_user_id === user.id) return;
    if (match.black_user_id) return;
    joinAsBlack(user.id, username || user.email?.split("@")[0] || "Противник");
  }, [match, user, username, joinAsBlack]);

  function copyInvite() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleMove(newPgn: string, newFen: string, nextTurn: "white" | "black") {
    pushMove(newPgn, newFen, nextTurn);
  }

  function handleTerminal(
    result: "win_white" | "win_black" | "draw",
    method: "checkmate" | "stalemate" | "draw",
  ) {
    finish(result, method);
  }

  if (authLoading) {
    return <Center><Loader2 className="w-6 h-6 text-war-gold animate-spin" /></Center>;
  }

  if (!user) {
    return (
      <Center>
        <Users className="w-10 h-10 text-war-gold mb-2" />
        <div className="text-war-text font-bold mb-1">Это многопользовательский матч</div>
        <p className="text-war-muted text-sm mb-4 max-w-md text-center">
          Войди в аккаунт, чтобы присоединиться к битве. Без аккаунта Supabase не определит,
          кто играет белыми, а кто чёрными.
        </p>
        <Link href={`/auth/login?next=/match/${params.id}`} className="btn-primary">
          <LogIn className="w-4 h-4" /> Войти и сыграть
        </Link>
      </Center>
    );
  }

  if (loading) {
    return <Center><Loader2 className="w-6 h-6 text-war-gold animate-spin" /></Center>;
  }

  if (matchError || !match) {
    return (
      <Center>
        <AlertTriangle className="w-8 h-8 text-war-red mb-2" />
        <div className="text-war-red font-bold mb-1">Не удалось загрузить матч</div>
        <p className="text-war-muted text-sm mb-4">{matchError ?? "Match не найден"}</p>
        <Link href="/match/new" className="btn-secondary text-sm">Создать новый матч</Link>
      </Center>
    );
  }

  const opponentColor: "white" | "black" = myColor === "white" ? "black" : "white";
  const playerRankTitle = getRankByXP(xp).title;
  const opponentName =
    opponentColor === "white"
      ? match.white_username ?? "Противник"
      : match.black_username ?? "Противник";

  const showInvite = match.status === "waiting" && match.white_user_id === user.id;
  const game = new Chess();
  if (match.pgn) {
    try { game.loadPgn(match.pgn); } catch { /* ignore */ }
  }
  const inCheck = game.inCheck();
  const currentTurn = match.turn;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          {/* Join error banner — shows on top, doesn't block UI */}
          {joinError && (
            <div className="panel p-4 border-l-4 border-war-red flex items-start gap-3 flex-wrap">
              <AlertTriangle className="w-5 h-5 text-war-red shrink-0 mt-0.5" />
              <div className="flex-1 min-w-[200px]">
                <div className="text-war-red font-bold">Не удалось присоединиться</div>
                <div className="text-war-muted text-xs mt-0.5">{joinError}</div>
                {joinError.includes("дукатов") && (
                  <div className="text-war-muted text-xs mt-1">
                    Сыграй пару партий с AI — получишь дукаты для входа в матч.
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {joinError.includes("дукатов") ? (
                  <Link href="/play" className="btn-secondary text-xs py-1.5 px-3">
                    Заработать
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      clearJoinError();
                      if (user) joinAsBlack(user.id, username || user.email?.split("@")[0] || "Противник");
                    }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Повторить
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Status bar */}
          {match.status === "waiting" && (
            <div className="panel p-4 border-l-4 border-war-gold flex items-center gap-3 flex-wrap">
              <Loader2 className="w-5 h-5 text-war-gold animate-spin" />
              <div className="flex-1 min-w-[200px]">
                <div className="text-war-text font-bold flex items-center gap-2">
                  Ожидание противника
                  {match.stake > 0 && (
                    <span className="chip border-war-gold/40 text-war-gold bg-war-gold/10">
                      <Coins className="w-3 h-3" /> {match.stake} Δ
                    </span>
                  )}
                </div>
                <div className="text-war-muted text-xs">
                  {showInvite
                    ? `Скопируй ссылку и пришли другу — он поставит ${match.stake > 0 ? `${match.stake} дукатов и` : ""} начнёт бой.`
                    : "Подключаемся к матчу..."}
                </div>
              </div>
              {showInvite && (
                <div className="flex gap-2">
                  <button onClick={copyInvite} className="btn-secondary text-sm py-2 px-3">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                  <button
                    onClick={async () => {
                      const r = await cancelMatch();
                      if (r.ok) router.push("/match/new");
                    }}
                    className="text-sm py-2 px-3 rounded border border-war-red/40 text-war-red hover:bg-war-red/10 uppercase tracking-widest font-bold"
                  >
                    Отменить
                  </button>
                </div>
              )}
            </div>
          )}

          {match.status === "finished" && (
            <FinishedBanner match={match} myColor={myColor} />
          )}

          {/* Top HUD = opponent */}
          <BattleHUD
            name={opponentName}
            rankTitle={opponentColor === myColor ? "" : "Командир"}
            isActive={match.status === "active" && currentTurn === opponentColor}
            isInCheck={inCheck && currentTurn === opponentColor}
            capturedPieces={captured[opponentColor]}
          />

          <div className="relative">
            <MultiplayerBoard
              pgn={match.pgn}
              myColor={myColor}
              isMyTurn={isMyTurn}
              showWarMap={showWarMap}
              onMove={handleMove}
              onTerminal={handleTerminal}
              skinKey={activeSkin}
            />
          </div>

          {/* Bottom HUD = me */}
          <BattleHUD
            name={username || user.email || "Командир"}
            rankTitle={playerRankTitle}
            isActive={match.status === "active" && currentTurn === myColor}
            isInCheck={inCheck && currentTurn === myColor}
            capturedPieces={myColor ? captured[myColor] : []}
          />

          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWarMap((s) => !s)}
              className={`chip text-xs px-3 py-2 ${
                showWarMap
                  ? "border-war-gold/50 text-war-gold bg-war-gold/10"
                  : "border-war-border text-war-muted bg-war-surface"
              } hover:bg-war-gold/15 transition-all`}
            >
              <Map className="w-3.5 h-3.5" />
              {showWarMap ? "WAR MAP — ON" : "WAR MAP — OFF"}
            </button>
            {match.status === "active" && myColor && (
              <button
                onClick={() => setConfirmingResign(true)}
                className="chip text-xs px-3 py-2 border-war-red/40 text-war-red bg-red-950/30 hover:bg-red-900/40 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                Resign
              </button>
            )}
            {match.status === "finished" && (
              <button
                onClick={() => router.push("/match/new")}
                className="chip text-xs px-3 py-2 border-war-gold/40 text-war-gold bg-war-gold/10 hover:bg-war-gold/20 ml-auto"
              >
                <Swords className="w-3.5 h-3.5" /> Новый матч
              </button>
            )}
            {showInvite && (
              <button onClick={copyInvite} className="chip text-xs px-3 py-2 border-war-gold/40 text-war-gold bg-war-gold/10 ml-auto">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Скопировано" : "Пригласить"}
              </button>
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="space-y-3">
          {match.stake > 0 && (
            <div className="panel p-3 border-l-4 border-war-gold">
              <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-1 flex items-center gap-1">
                <Coins className="w-3 h-3" /> Пот битвы
              </div>
              <div className="text-2xl font-black text-war-gold">
                {match.stake * (match.black_user_id ? 2 : 1)} Δ
              </div>
              <div className="text-[11px] text-war-muted mt-0.5">
                {match.black_user_id
                  ? "Победитель забирает всё, ничья — возврат"
                  : `Жду дуэль соперника (+${match.stake} Δ)`}
              </div>
            </div>
          )}

          <div className="panel p-3">
            <div className="text-[10px] uppercase tracking-widest text-war-muted font-bold mb-2">
              Состав армий
            </div>
            <SideRow
              label="Белые"
              dot="bg-white/80"
              name={match.white_username || "Ожидание..."}
              isMe={match.white_user_id === user.id}
            />
            <SideRow
              label="Чёрные"
              dot="bg-zinc-800 border border-war-muted"
              name={match.black_username || "Ожидание..."}
              isMe={match.black_user_id === user.id}
            />
            {myColor && (
              <div className="mt-2 text-[11px] text-war-gold font-mono">
                ТЫ ИГРАЕШЬ {myColor === "white" ? "белыми" : "чёрными"}
              </div>
            )}
            {!myColor && match.status === "active" && (
              <div className="mt-2 text-[11px] text-war-muted">
                Ты наблюдатель — оба места заняты
              </div>
            )}
          </div>

          <Tabs
            tabs={[
              {
                key: "moves",
                label: `Ходы (${Math.ceil(history.length / 2)})`,
                content: <MoveHistory history={history} />,
              },
              {
                key: "log",
                label: "Battle Log",
                content: <BattleLog events={events} />,
              },
            ]}
          />

          <div className="panel p-3 text-[11px] text-war-dim leading-relaxed">
            <div className="text-war-muted font-bold uppercase tracking-widest text-[10px] mb-1.5">
              Realtime · Supabase
            </div>
            <div>
              Ходы летают через WebSocket-канал
              <code className="mx-1 px-1 bg-war-surface rounded text-war-gold">
                match:{match.id.slice(0, 8)}
              </code>
              — задержка обычно &lt; 200ms.
            </div>
          </div>
        </aside>
      </div>

      {confirmingResign && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setConfirmingResign(false)}>
          <div className="panel p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <Flag className="w-8 h-8 text-war-red mb-2" />
            <div className="text-war-text font-bold text-lg mb-1">Покинуть поле боя?</div>
            <div className="text-war-muted text-sm mb-5">
              Противник получит победу. Это действие нельзя отменить.
            </div>
            <div className="flex gap-2">
              <button className="flex-1 btn-secondary text-sm py-2" onClick={() => setConfirmingResign(false)}>
                Остаться
              </button>
              <button
                className="flex-1 bg-war-red text-white font-bold py-2 rounded-xl hover:bg-war-redDim"
                onClick={async () => {
                  setConfirmingResign(false);
                  await resign();
                }}
              >
                Сдаться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FinishedBanner({
  match,
  myColor,
}: {
  match: { result: string | null; end_method: string | null; stake: number; black_user_id: string | null };
  myColor: "white" | "black" | null;
}) {
  let label = "Матч завершён";
  let Icon = Equal;
  let color = "text-war-muted";
  let bg = "bg-war-panel";
  let border = "border-war-border";
  const won =
    (match.result === "win_white" && myColor === "white") ||
    (match.result === "win_black" && myColor === "black");
  const lost =
    (match.result === "win_white" && myColor === "black") ||
    (match.result === "win_black" && myColor === "white");

  if (match.result === "draw") {
    label = "Ничья";
    Icon = Equal;
  } else if (won) {
    label = "ПОБЕДА";
    Icon = Trophy;
    color = "text-emerald-300";
    bg = "bg-emerald-950/40";
    border = "border-emerald-700/40";
  } else if (lost) {
    label = "ПОРАЖЕНИЕ";
    Icon = Skull;
    color = "text-red-300";
    bg = "bg-red-950/40";
    border = "border-red-700/40";
  } else {
    label =
      match.result === "win_white"
        ? "Победили белые"
        : match.result === "win_black"
        ? "Победили чёрные"
        : "Матч завершён";
    Icon = Crown;
  }

  const pot = match.stake * (match.black_user_id ? 2 : 1);
  let ducatsLine: string | null = null;
  if (match.stake > 0) {
    if (won) ducatsLine = `+${pot} Δ зачислено`;
    else if (lost) ducatsLine = `−${match.stake} Δ списано`;
    else if (match.result === "draw") ducatsLine = `${match.stake} Δ возвращены`;
  }

  return (
    <div className={`${bg} ${border} border rounded-xl p-4 flex items-center gap-3`}>
      <Icon className={`w-6 h-6 ${color}`} />
      <div className="flex-1">
        <div className={`font-bold text-lg ${color}`}>{label}</div>
        <div className="text-war-muted text-xs">
          {match.end_method === "checkmate"
            ? "Мат — захват штаба"
            : match.end_method === "stalemate"
            ? "Пат — ход невозможен"
            : match.end_method === "resignation"
            ? "Сдача"
            : "Ничья"}
        </div>
      </div>
      {ducatsLine && (
        <div className={`chip text-xs px-3 py-1.5 border-war-gold/30 ${won ? "text-emerald-300 bg-emerald-950/40" : lost ? "text-red-300 bg-red-950/30" : "text-war-gold bg-war-gold/10"}`}>
          <Coins className="w-3 h-3" /> {ducatsLine}
        </div>
      )}
    </div>
  );
}

function SideRow({
  label,
  dot,
  name,
  isMe,
}: {
  label: string;
  dot: string;
  name: string;
  isMe?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className={`w-3 h-3 rounded ${dot}`} />
      <span className="text-[10px] uppercase tracking-widest text-war-muted w-12">{label}</span>
      <span className="text-war-text text-sm truncate flex-1">{name}</span>
      {isMe && (
        <span className="chip border-war-gold/40 text-war-gold bg-war-gold/10 text-[9px] py-0">
          ТЫ
        </span>
      )}
    </div>
  );
}

function Tabs({ tabs }: { tabs: { key: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active);
  return (
    <div className="panel">
      <div className="flex border-b border-war-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex-1 text-xs py-2.5 font-bold uppercase tracking-widest transition-colors ${
              active === t.key
                ? "text-war-gold border-b-2 border-war-gold -mb-px"
                : "text-war-muted hover:text-war-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="aspect-square w-full max-w-[600px] mx-auto rounded-xl bg-war-panel border border-war-border flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-war-gold animate-spin" />
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
