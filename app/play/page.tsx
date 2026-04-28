"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Chess } from "chess.js";
import { PlayerCard } from "@/components/ui/PlayerCard";
import { MoveHistoryTable } from "@/components/ui/MoveHistoryTable";
import { AccuracyGauge } from "@/components/ui/AccuracyGauge";
import { StabilityBar } from "@/components/ui/StabilityBar";
import { TerritoryHexMap } from "@/components/ui/TerritoryHexMap";
import { ActionButton } from "@/components/ui/ActionButton";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { ProModal } from "@/components/ui/ProModal";
import { generateWarReport } from "@/lib/chess/review";
import { getControlZones, getTerritoryControl } from "@/lib/chess/zones";
import { getPositionStats } from "@/lib/chess/stats";
import { useProfileStore } from "@/stores/profileStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useInventory } from "@/hooks/useInventory";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  Map,
  Flag,
  Loader2,
  Bot,
  Users,
  Lightbulb,
  Undo2,
  Brain,
  ChevronRight,
  Settings,
  Coins,
  Flame,
  Sparkles,
} from "lucide-react";
import { generateRoomId, createRoom } from "@/lib/siege/room";
import type { BattleEvent } from "@/lib/chess/narrative";
import type { GameResult } from "@/components/battle/BattleBoard";

const BattleBoard = dynamic(
  () => import("@/components/battle/BattleBoard").then((m) => m.BattleBoard),
  { ssr: false, loading: () => <BoardSkeleton /> },
);

type Difficulty = "easy" | "normal" | "hard";

export default function PlayPage() {
  const router = useRouter();
  const profile = useProfileStore();
  const { user } = useAuth();
  const { activeSkin } = useInventory();

  const [showWarMap, setShowWarMap] = useState(true);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [resign, setResign] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  const [history, setHistory] = useState<string[]>([]);
  const [, setEvents] = useState<BattleEvent[]>([]);
  const [captured, setCaptured] = useState<{ white: string[]; black: string[] }>({
    white: [],
    black: [],
  });
  const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");
  const [inCheck, setInCheck] = useState(false);
  const [aiThinking, setAIThinking] = useState(false);
  const [confirmingResign, setConfirmingResign] = useState(false);
  const [territory, setTerritory] = useState({ white: 0, black: 0 });

  const opponentColor: "white" | "black" = playerColor === "white" ? "black" : "white";

  const aiName = difficulty === "easy" ? "AI Trooper" : difficulty === "hard" ? "AI General" : "AI Captain";
  const aiRating = difficulty === "easy" ? 600 : difficulty === "hard" ? 1500 : 1000;
  const aiLevel = difficulty === "easy" ? 8 : difficulty === "hard" ? 32 : 18;
  const playerLevel = useMemo(() => {
    return Math.max(1, Math.floor(profile.xp / 200) + 1);
  }, [profile.xp]);

  // Compute live position stats (real material + king stability)
  const liveStats = useMemo(() => {
    const g = new Chess();
    try {
      history.forEach((s) => g.move(s));
    } catch {
      // ignore
    }
    return getPositionStats(g);
  }, [history]);

  function handleMove(g: Chess, hist: string[], evs: BattleEvent[]) {
    setHistory(hist);
    setEvents(evs);
    setCurrentTurn(g.turn());
    setInCheck(g.inCheck());
    setAIThinking(g.turn() !== playerColor[0]);
    if (showWarMap) {
      const t = getTerritoryControl(getControlZones(g));
      setTerritory({ white: t.white, black: t.black });
    }
  }

  function handleGameOver(result: GameResult) {
    setAIThinking(false);
    const myResult: "win" | "loss" | "draw" =
      result.winner === "draw"
        ? "draw"
        : result.winner === playerColor
        ? "win"
        : "loss";

    const report = generateWarReport(result.pgn, playerColor, myResult);

    // Compute ducats earned (used both for local UX and Supabase RPC)
    let ducatsDelta = 0;
    let ducatsReason: "ai_win" | "ai_draw" | "ai_loss" | "accuracy_bonus" | "" = "";
    if (myResult === "win") {
      ducatsDelta = 25;
      ducatsReason = "ai_win";
    } else if (myResult === "draw") {
      ducatsDelta = 5;
      ducatsReason = "ai_draw";
    } else {
      // Even loss rewards 5 ducats — encourages playing
      ducatsDelta = 5;
      ducatsReason = "ai_loss";
    }
    if (report.accuracy > 80 && myResult === "win") {
      ducatsDelta += 15;
      ducatsReason = "accuracy_bonus";
    }
    report.ducats_earned = ducatsDelta;

    const id = `g-${Date.now()}`;
    profile.recordGame({
      id,
      pgn: result.pgn,
      result: myResult,
      playerColor,
      accuracy: report.accuracy,
      xp_earned: report.xp_earned,
      rating_delta: report.rating_delta,
      ducats_earned: ducatsDelta,
      headline: report.headline,
      narrative: report.narrative,
      incidents: report.incidents,
      strengths: report.strengths,
      territory: report.territory,
      keyMoments: report.keyMoments,
      moveCount: report.moveCount,
      created_at: new Date().toISOString(),
    });

    if (user) {
      const supabase = getBrowserSupabase();
      const playerTerritory =
        playerColor === "white" ? report.territory.white : report.territory.black;

      supabase
        ?.from("games")
        .insert({
          user_id: user.id,
          pgn: result.pgn,
          result: myResult,
          player_color: playerColor,
          accuracy: report.accuracy,
          territory: playerTerritory,
          incidents: report.incidents,
          strengths: report.strengths,
          headline: report.headline,
          narrative: report.narrative,
          xp_earned: report.xp_earned,
          rating_delta: report.rating_delta,
          move_count: report.moveCount,
        })
        .then(async () => {
          if (!supabase) return;
          if (ducatsDelta > 0) {
            await supabase.rpc("award_ducats", { p_amount: ducatsDelta, p_reason: ducatsReason });
          }
          // First game of day bonus (+10) — once per day, RPC self-deduplicates
          await supabase.rpc("award_ducats", { p_amount: 10, p_reason: "first_game_of_day" });
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              username: profile.username,
              display_name: profile.username,
              city: profile.city,
              xp: profile.xp + report.xp_earned,
              rating: Math.max(100, profile.rating + report.rating_delta),
              games_played: profile.gamesPlayed + 1,
              games_won: profile.gamesWon + (myResult === "win" ? 1 : 0),
              last_active: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
        });
    }

    router.push(`/review/${id}`);
  }

  function newGame(side: "white" | "black" = playerColor) {
    setHistory([]);
    setEvents([]);
    setCaptured({ white: [], black: [] });
    setCurrentTurn(side === "white" ? "w" : "b");
    setInCheck(false);
    setResign(false);
    setConfirmingResign(false);
    setPlayerColor(side);
    setBoardKey((k) => k + 1);
  }

  useEffect(() => {
    setAIThinking(playerColor === "black" && history.length === 0);
  }, [playerColor, history.length]);

  // Map blue/red to white/black colors based on player perspective
  const myForce = playerColor === "white" ? liveStats.whiteForce : liveStats.blackForce;
  const oppForce = playerColor === "white" ? liveStats.blackForce : liveStats.whiteForce;
  const myMaterial = playerColor === "white" ? liveStats.whiteMaterial : liveStats.blackMaterial;
  const oppMaterial = playerColor === "white" ? liveStats.blackMaterial : liveStats.whiteMaterial;
  const myStability = playerColor === "white" ? liveStats.whiteStability : liveStats.blackStability;
  const oppStability = playerColor === "white" ? liveStats.blackStability : liveStats.whiteStability;
  const myTerritory = playerColor === "white" ? territory.white : territory.black;
  const oppTerritory = playerColor === "white" ? territory.black : territory.white;

  const isMyTurn = currentTurn === playerColor[0];

  async function startSiege() {
    if (!user) {
      router.push(`/auth/login?next=/play`);
      return;
    }
    const id = generateRoomId();
    const r = await createRoom(id, profile.username || user.email?.split("@")[0] || "Командир");
    if (r.ok) router.push(`/siege/${id}`);
  }

  return (
    <div className="max-w-[1480px] mx-auto px-3 sm:px-4 py-4">
      {/* Mode select */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="panel p-4 border-2 border-war-cyan/50 neon-frame-cyan">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-9 h-9 rounded bg-war-cyan/15 border border-war-cyan/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-war-cyan" />
            </div>
            <div>
              <div className="font-display font-bold text-war-text text-sm">Classic — vs AI</div>
              <div className="text-[10px] text-war-muted uppercase tracking-widest">Активен</div>
            </div>
          </div>
          <div className="text-[11px] text-war-muted">
            Стандартные шахматы. Зоны контроля, War Report, дукаты за победу.
          </div>
        </div>

        <button
          onClick={startSiege}
          className="panel p-4 border-2 border-war-gold/40 hover:neon-frame-gold hover:border-war-gold transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-9 h-9 rounded bg-war-gold/15 border border-war-gold/40 flex items-center justify-center">
              <Flame className="w-5 h-5 text-war-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-war-gold text-sm flex items-center gap-1">
                ⚔️ Дуэль с другом
                <Sparkles className="w-3 h-3 text-war-gold animate-cyanPulse" />
              </div>
              <div className="text-[10px] text-war-muted uppercase tracking-widest">Карты ⚡💥🛡👑</div>
            </div>
            <ChevronRight className="w-4 h-4 text-war-gold group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-[11px] text-war-muted">
            Классические шахматы + боевые способности. Создай комнату → пришли другу.
          </div>
        </button>
      </div>

      {/* Top HUD with both players + status */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 mb-4 items-stretch">
        <PlayerCard
          name={aiName}
          rating={aiRating}
          level={aiLevel}
          side="red"
          isAI
          isActive={!isMyTurn}
          isInCheck={inCheck && currentTurn === opponentColor[0]}
          capturedPieces={captured[opponentColor]}
        />

        <div className="hidden md:flex flex-col items-center justify-center px-6">
          <div className="label-gold text-[9px]">
            {aiThinking ? "Командир думает" : isMyTurn ? "Ваш ход" : "Ход противника"}
          </div>
          <div className="font-display font-black text-2xl text-war-gold gold-text-glow mt-0.5">
            {aiThinking ? <Loader2 className="w-6 h-6 animate-spin" /> : `${Math.ceil(history.length / 2) || 0}`}
          </div>
          <div className="label text-[9px] mt-0.5">Move</div>
        </div>

        <PlayerCard
          name={profile.username}
          rating={profile.rating}
          level={playerLevel}
          side="blue"
          isActive={isMyTurn}
          isInCheck={inCheck && currentTurn === playerColor[0]}
          capturedPieces={captured[playerColor]}
          reverse
        />
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-3">
        {/* LEFT SIDEBAR */}
        <aside className="space-y-3">
          <div className="panel">
            <PanelHeader title="Move History" />
            <MoveHistoryTable history={history} />
          </div>

          <div className="panel">
            <PanelHeader title="Force Strength" />
            <div className="flex items-center justify-around p-4">
              <AccuracyGauge
                value={myForce}
                side="blue"
                label="You"
                rawValue={`${myMaterial}/39`}
              />
              <AccuracyGauge
                value={oppForce}
                side="red"
                label="Enemy"
                rawValue={`${oppMaterial}/39`}
              />
            </div>
          </div>

          <div className="panel">
            <PanelHeader title="King Stability" />
            <div className="p-3 space-y-2.5">
              <StabilityBar value={myStability} side="blue" />
              <StabilityBar value={oppStability} side="red" />
            </div>
          </div>
        </aside>

        {/* CENTER — board */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[680px]">
            <BattleBoard
              key={boardKey}
              onGameOver={handleGameOver}
              onMove={handleMove}
              onCaptureUpdate={(white, black) => setCaptured({ white, black })}
              playerColor={playerColor}
              showWarMap={showWarMap}
              difficulty={difficulty}
              resign={resign}
              skinKey={activeSkin}
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full max-w-[680px]">
            <ActionButton
              icon={<Map className="w-4 h-4" />}
              label={showWarMap ? "WAR MAP ON" : "WAR MAP OFF"}
              variant={showWarMap ? "blue" : "neutral"}
              onClick={() => setShowWarMap((s) => !s)}
              size="sm"
            />
            <ActionButton
              icon={<Lightbulb className="w-4 h-4" />}
              label="Hint"
              variant="gold"
              size="sm"
              disabled
            />
            <ActionButton
              icon={<Undo2 className="w-4 h-4" />}
              label="Undo"
              variant="neutral"
              size="sm"
              disabled
            />
            <ActionButton
              icon={<Flag className="w-4 h-4" />}
              label="Resign"
              variant="red"
              onClick={() => setConfirmingResign(true)}
              size="sm"
            />
            <ActionButton
              icon={<Users className="w-4 h-4" />}
              label="Coop"
              variant="purple"
              href="/match/new"
              size="sm"
              className="ml-auto"
            />
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-3">
          <div className="panel">
            <PanelHeader title="Game Mode" right={<Bot className="w-3.5 h-3.5 text-war-muted" />} />
            <div className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded bg-war-purple/15 border border-war-purple/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-war-purple" />
                </div>
                <div>
                  <div className="font-display font-bold text-war-text">AI Battle</div>
                  <div className="text-[10px] text-war-muted">vs {aiName}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="label text-[9px] mb-1.5">Difficulty</div>
                <div className="flex gap-1">
                  {(["easy", "normal", "hard"] as Difficulty[]).map((d) => {
                    const isActive = difficulty === d;
                    const colorMap = {
                      easy:   { active: "bg-war-green/20 border-war-green text-war-green", label: "Trooper" },
                      normal: { active: "bg-war-cyan/20 border-war-cyan text-war-cyan",    label: "Captain" },
                      hard:   { active: "bg-war-red/20 border-war-red text-war-red",       label: "General" },
                    }[d];
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider border rounded ${
                          isActive
                            ? colorMap.active
                            : "border-war-border text-war-muted hover:text-war-text"
                        }`}
                      >
                        {colorMap.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <div className="label text-[9px] mb-1.5">Side</div>
                <div className="flex gap-1">
                  {(["white", "black"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => newGame(c)}
                      className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider border rounded ${
                        playerColor === c
                          ? "bg-war-gold/15 border-war-gold text-war-gold"
                          : "border-war-border text-war-muted hover:text-war-text"
                      }`}
                    >
                      {c === "white" ? "Белые ♙" : "Чёрные ♟"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => newGame(playerColor)}
                className="w-full text-[11px] uppercase tracking-widest font-bold py-2 mt-3 rounded bg-war-gold text-black hover:bg-war-goldDark transition-colors"
              >
                Новая партия
              </button>
            </div>
          </div>

          <div className="panel">
            <PanelHeader title="Territory Control" />
            <div className="p-3">
              <TerritoryHexMap white={myTerritory} black={oppTerritory} />
              <div className="flex justify-between mt-2 text-[10px] font-mono">
                <span className="text-war-cyan">{myTerritory}%</span>
                <span className="text-war-muted">vs</span>
                <span className="text-war-red">{oppTerritory}%</span>
              </div>
            </div>
          </div>

          <Link
            href="/match/new"
            className="panel block p-4 hover:border-war-purple/60 transition-colors group"
          >
            <PanelHeader
              title="AI Coach"
              accent="purple"
              icon={<Brain className="w-3.5 h-3.5 text-war-purple" />}
              right={<ChevronRight className="w-3.5 h-3.5 text-war-muted group-hover:text-war-purple transition-colors" />}
            />
            <div className="px-3 py-2.5 flex items-center gap-2">
              <div className="w-9 h-9 rounded bg-war-purple/15 border border-war-purple/40 flex items-center justify-center">
                <Brain className="w-5 h-5 text-war-purple" />
              </div>
              <div className="text-[11px] text-war-muted leading-tight">
                Сыграй и получи разбор партии военным языком
              </div>
            </div>
          </Link>

          <button
            onClick={() => setProOpen(true)}
            className="panel block w-full p-3 text-left hover:border-war-gold/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-war-gold" />
              <div className="flex-1">
                <div className="text-war-gold font-display font-bold text-sm">
                  Trojan Pro
                </div>
                <div className="text-[10px] text-war-muted">
                  Безлимит War Report + скины
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-war-muted" />
            </div>
          </button>
        </aside>
      </div>

      {/* Confirm resign dialog */}
      {confirmingResign && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmingResign(false)}
        >
          <div
            className="panel p-6 max-w-sm w-full neon-frame-red"
            onClick={(e) => e.stopPropagation()}
          >
            <Flag className="w-8 h-8 text-war-red mb-2" />
            <div className="font-display font-bold text-lg mb-1 text-war-text">
              Покинуть поле боя?
            </div>
            <div className="text-war-muted text-sm mb-5">
              Поражение будет засчитано. Это повлияет на ваш рейтинг и серию побед.
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 btn-secondary text-xs py-2"
                onClick={() => setConfirmingResign(false)}
              >
                Остаться
              </button>
              <button
                className="flex-1 bg-war-red text-white font-bold py-2 rounded uppercase tracking-widest hover:bg-war-redDim"
                onClick={() => {
                  setConfirmingResign(false);
                  setResign(true);
                }}
              >
                Сдаться
              </button>
            </div>
          </div>
        </div>
      )}

      <ProModal open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="aspect-square w-full max-w-[680px] mx-auto rounded bg-war-panel border border-war-border flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-war-gold animate-spin" />
    </div>
  );
}
