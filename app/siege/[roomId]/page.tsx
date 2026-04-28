"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Chess, Square } from "chess.js";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfileStore } from "@/stores/profileStore";
import { useWallet } from "@/hooks/useWallet";
import { useInventory } from "@/hooks/useInventory";
import { useSiegeRoom } from "@/hooks/useSiegeRoom";
import { joinRoom, pushRoomUpdate, buySiegeCards } from "@/lib/siege/room";
import { CARDS, type CardKey, type CardActionMode } from "@/lib/siege/cards";
import { CardBar } from "@/components/siege/CardBar";
import { OutOfCardsModal, UnlockCardModal } from "@/components/siege/CardModal";
import { RoomLobby } from "@/components/siege/RoomLobby";
import { PlayerCard } from "@/components/ui/PlayerCard";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  Loader2,
  Flag,
  AlertTriangle,
  LogIn,
  Trophy,
  Skull,
  Equal,
} from "lucide-react";

const SiegeBoard = dynamic(
  () => import("@/components/siege/SiegeBoard").then((m) => m.SiegeBoard),
  { ssr: false, loading: () => <BoardSkeleton /> },
);

export default function SiegePage() {
  const params = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const profile = useProfileStore();
  const { balance } = useWallet();
  const { activeSkin, refresh: refreshInventory } = useInventory();
  const { room, loading, error } = useSiegeRoom(params.roomId);

  const [cardMode, setCardMode] = useState<CardActionMode>(null);
  const [activeCard, setActiveCard] = useState<CardKey | null>(null);
  const [berserkPending, setBerserkPending] = useState(false);
  // Track berserk locally — if room.last_card_event matches my id+phase=first, we know we owe a 2nd move

  const [outOfCardsOpen, setOutOfCardsOpen] = useState(false);
  const [unlockModal, setUnlockModal] = useState<CardKey | null>(null);
  const [confirmingResign, setConfirmingResign] = useState(false);

  // ESC cancels card mode
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && cardMode) {
        setCardMode(null);
        setActiveCard(null);
        // berserk_extra cannot be cancelled mid-flow once first move played
        if (!berserkPending) setBerserkPending(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cardMode, berserkPending]);

  // Auto-join as player2 if applicable
  useEffect(() => {
    if (!room || !user) return;
    if (room.status !== "waiting") return;
    if (room.player1_id === user.id) return;
    if (room.player2_id) return;
    joinRoom(room.id, profile.username || user.email?.split("@")[0] || "Противник");
  }, [room, user, profile.username]);

  const myColor: "white" | "black" | null = useMemo(() => {
    if (!room || !user) return null;
    if (room.player1_id === user.id) return "white";
    if (room.player2_id === user.id) return "black";
    return null;
  }, [room, user]);

  const isMyTurn = !!(room && myColor && room.status === "active" && room.turn === myColor);
  const myCardCount = myColor === "white" ? room?.player1_cards ?? 0 : room?.player2_cards ?? 0;
  const enemyCardCount = myColor === "white" ? room?.player2_cards ?? 0 : room?.player1_cards ?? 0;
  const myUnlocks = (myColor === "white" ? room?.player1_unlocks : room?.player2_unlocks) ?? [];

  // Auto-open out-of-cards modal when reaching 0
  useEffect(() => {
    if (myCardCount === 0 && room?.status === "active" && myColor) {
      // Don't spam-open: only open once when transition happens
      // Tracked via separate state if needed, here keep simple
    }
  }, [myCardCount, room?.status, myColor]);

  function activateCard(key: CardKey) {
    if (!room || !myColor || !isMyTurn) return;
    if (myCardCount <= 0) {
      setOutOfCardsOpen(true);
      return;
    }
    setActiveCard(key);
    if (key === "berserk") setCardMode("berserk_extra");
    else if (key === "lightning") setCardMode("lightning_target");
    else if (key === "shield") setCardMode("shield_select");
    else if (key === "coronation") setCardMode("coronation_select");
  }

  function clearCard() {
    setActiveCard(null);
    setCardMode(null);
  }

  // Helper: set FEN turn manually
  function setFenTurn(fen: string, color: "white" | "black"): string {
    const parts = fen.split(" ");
    parts[1] = color[0];
    return parts.join(" ");
  }

  // ─── Card effects ────────────────────────────────
  async function executeLightning(targetSquare: string) {
    if (!room || !myColor) return;
    const g = new Chess();
    // Load from FEN (PGN may already be cleared from a prior card)
    try { g.load(room.current_fen); } catch { return; }
    const piece = g.get(targetSquare as Square);
    if (!piece || piece.color === myColor[0] || piece.type === "k") return;

    g.remove(targetSquare as Square);
    const opp = myColor === "white" ? "black" : "white";
    const newFen = setFenTurn(g.fen(), opp);

    const newCards = decrementMyCards();
    clearCard();
    await pushRoomUpdate(room.id, {
      pgn: "",                      // clear PGN — FEN is now source of truth
      current_fen: newFen,
      turn: opp,
      ...newCards,
      last_card_event: { card: "lightning", ply: 0, by: myColor, meta: { square: targetSquare } },
    });
  }

  async function executeShield(square: string) {
    if (!room || !myColor) return;
    const newCards = decrementMyCards();
    const ply = computePly(room.pgn);
    clearCard();
    await pushRoomUpdate(room.id, {
      shielded_square: square,
      shielded_until_ply: ply + 1,
      ...newCards,
      last_card_event: { card: "shield", ply, by: myColor, meta: { square } },
    });
    // Shield is a buff; player still has to make a regular move next.
    // Turn stays with me.
  }

  async function executeCoronation(square: string) {
    if (!room || !myColor) return;
    const g = new Chess();
    try { g.load(room.current_fen); } catch { return; }
    const piece = g.get(square as Square);
    if (!piece || piece.type !== "p" || piece.color !== myColor[0]) return;

    g.remove(square as Square);
    g.put({ type: "q", color: myColor[0] as "w" | "b" }, square as Square);
    const opp = myColor === "white" ? "black" : "white";
    const newFen = setFenTurn(g.fen(), opp);

    const newCards = decrementMyCards();
    clearCard();
    await pushRoomUpdate(room.id, {
      pgn: "",
      current_fen: newFen,
      turn: opp,
      ...newCards,
      last_card_event: { card: "coronation", ply: 0, by: myColor, meta: { square } },
    });
  }

  function decrementMyCards(): Partial<{ player1_cards: number; player2_cards: number }> {
    if (!room) return {};
    if (myColor === "white") {
      return { player1_cards: Math.max(0, room.player1_cards - 1) };
    } else if (myColor === "black") {
      return { player2_cards: Math.max(0, room.player2_cards - 1) };
    }
    return {};
  }

  function computePly(pgn: string): number {
    const g = new Chess();
    if (pgn) try { g.loadPgn(pgn); } catch { /* */ }
    return g.history().length;
  }

  // ─── Normal move handler ─────────────────────────
  async function handleMove(newPgn: string, newFen: string) {
    if (!room || !myColor) return;

    // Берсерк: первый ход — оставить ход за собой, ждать второй
    if (activeCard === "berserk" && cardMode === "berserk_extra" && !berserkPending) {
      // chess.js перевернул FEN-turn на оппонента. Возвращаем мне.
      const fenForMe = setFenTurn(newFen, myColor);
      const cards = decrementMyCards();
      setBerserkPending(true);
      // setCardMode остаётся berserk_extra чтобы баннер отображался
      await pushRoomUpdate(room.id, {
        pgn: "",                  // PGN сбрасываем — играем по FEN
        current_fen: fenForMe,
        turn: myColor,            // ход остаётся за мной
        ...cards,
        last_card_event: { card: "berserk", ply: 0, by: myColor, meta: { phase: "first" } },
      });
      return;
    }

    // Берсерк: второй ход — нормально передать ход оппоненту
    if (berserkPending && activeCard === "berserk") {
      setBerserkPending(false);
      clearCard();
      const opp = myColor === "white" ? "black" : "white";
      // Run end-of-game checks
      const g2 = new Chess();
      try { g2.load(newFen); } catch {}
      let result: "win_white" | "win_black" | "draw" | null = null;
      let endMethod: "checkmate" | "stalemate" | "draw" | null = null;
      let status: "active" | "finished" = "active";
      if (g2.isCheckmate()) {
        result = myColor === "white" ? "win_white" : "win_black";
        endMethod = "checkmate";
        status = "finished";
      } else if (g2.isStalemate()) {
        result = "draw"; endMethod = "stalemate"; status = "finished";
      }
      await pushRoomUpdate(room.id, {
        pgn: "",                  // продолжаем без PGN после Берсерка
        current_fen: newFen,
        turn: opp,
        status,
        result,
        end_method: endMethod,
        last_card_event: { card: "berserk", ply: 0, by: myColor, meta: { phase: "second" } },
      });
      return;
    }

    // Обычный ход
    const g = new Chess();
    if (newPgn) try { g.loadPgn(newPgn); } catch { /* */ }
    const verbose = g.history({ verbose: true });

    let shieldedClear: { shielded_square?: string | null; shielded_until_ply?: number | null } = {};
    if (room.shielded_until_ply !== null && verbose.length >= (room.shielded_until_ply ?? 0)) {
      shieldedClear = { shielded_square: null, shielded_until_ply: null };
    }

    const opp = myColor === "white" ? "black" : "white";

    let result: "win_white" | "win_black" | "draw" | null = null;
    let endMethod: "checkmate" | "stalemate" | "draw" | null = null;
    let status: "active" | "finished" = "active";
    const checkGame = newPgn ? g : new Chess();
    if (!newPgn) try { checkGame.load(newFen); } catch {}
    if (checkGame.isCheckmate()) {
      result = myColor === "white" ? "win_white" : "win_black";
      endMethod = "checkmate";
      status = "finished";
    } else if (checkGame.isStalemate()) {
      result = "draw"; endMethod = "stalemate"; status = "finished";
    } else if (checkGame.isDraw()) {
      result = "draw"; endMethod = "draw"; status = "finished";
    }

    await pushRoomUpdate(room.id, {
      pgn: newPgn,
      current_fen: newFen,
      turn: opp,
      ...shieldedClear,
      status,
      result,
      end_method: endMethod,
      last_card_event: null,
    });
  }

  async function handleResign() {
    if (!room || !myColor) return;
    const result = myColor === "white" ? "win_black" : "win_white";
    await pushRoomUpdate(room.id, { status: "finished", result, end_method: "resignation" });
  }

  async function unlockCard(key: CardKey) {
    const def = CARDS[key];
    if (!def.unlockKey || !def.unlockPrice) return { ok: false, error: "not_unlockable" };
    const supabase = getBrowserSupabase();
    if (!supabase) return { ok: false, error: "no_supabase" };
    const { error } = await supabase.rpc("buy_item", {
      p_item_key: def.unlockKey,
      p_price: def.unlockPrice,
      p_quantity: 1,
    });
    if (error) return { ok: false, error: error.message };
    await refreshInventory();
    return { ok: true };
  }

  // ─── Render ──────────────────────────────────────
  if (authLoading) {
    return <Center><Loader2 className="w-6 h-6 text-war-gold animate-spin" /></Center>;
  }

  if (!user) {
    return (
      <Center>
        <div className="font-display text-3xl mb-2">⚔️</div>
        <div className="font-display font-bold text-war-text mb-1">Дуэль</div>
        <p className="text-war-muted text-sm mb-4 text-center max-w-md">
          Войди в систему, чтобы вступить в комнату. Без аккаунта не определим, кто ты.
        </p>
        <Link href={`/auth/login?next=/siege/${params.roomId}`} className="btn-primary">
          <LogIn className="w-4 h-4" /> Войти и сыграть
        </Link>
      </Center>
    );
  }

  if (loading) return <Center><Loader2 className="w-6 h-6 text-war-gold animate-spin" /></Center>;

  if (error || !room) {
    return (
      <Center>
        <AlertTriangle className="w-8 h-8 text-war-red mb-2" />
        <div className="text-war-red font-bold mb-1">Комната не найдена</div>
        <p className="text-war-muted text-sm mb-4">{error ?? "Room ID не существует"}</p>
        <Link href="/play" className="btn-secondary text-sm">К игре</Link>
      </Center>
    );
  }

  if (room.status === "waiting") {
    const isCreator = room.player1_id === user.id;
    return <RoomLobby room={room} isCreator={isCreator} />;
  }

  // Game in progress / finished
  const opponentColor = myColor === "white" ? "black" : "white";
  const opponentName =
    opponentColor === "white" ? room.player1_name ?? "Соперник" : room.player2_name ?? "Соперник";

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4">
      {/* Top HUD */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 mb-3 items-stretch">
        <PlayerCard
          name={opponentName}
          side="red"
          isAI={false}
          isActive={!isMyTurn && room.status === "active"}
          rating={undefined}
        />
        <div className="hidden md:flex flex-col items-center justify-center px-4">
          <div className="label-gold text-[9px]">SIEGE</div>
          <div className="font-display font-black text-2xl text-war-gold">
            {room.status === "finished" ? "FIN" : Math.ceil((room.pgn.split(" ").length - 1) / 3) || 1}
          </div>
        </div>
        <PlayerCard
          name={profile.username}
          side="blue"
          isActive={isMyTurn}
          rating={undefined}
          reverse
        />
      </div>

      {/* Result banner */}
      {room.status === "finished" && <ResultBanner room={room} myColor={myColor} />}

      {/* Card mode hint */}
      {cardMode && (
        <div className="panel border-l-4 border-war-gold p-3 mb-3 flex items-center gap-3">
          <div className="text-2xl">{activeCard ? CARDS[activeCard].emoji : "⚔️"}</div>
          <div className="flex-1">
            <div className="font-display font-bold text-war-gold">
              {activeCard && CARDS[activeCard].title}
            </div>
            <div className="text-war-muted text-xs">
              {cardMode === "lightning_target" && "Кликни на любую вражескую фигуру (кроме короля)"}
              {cardMode === "shield_select" && "Кликни на свою фигуру чтобы защитить её на 1 ход"}
              {cardMode === "coronation_select" && "Кликни на свою пешку — она станет ферзём"}
              {cardMode === "berserk_extra" && (berserkPending ? "⚡ Берсерк! Сделай второй ход" : "Сделай первый ход — после получишь ещё один")}
            </div>
          </div>
          {!berserkPending && (
            <button onClick={clearCard} className="text-xs uppercase tracking-widest text-war-muted hover:text-war-red">
              Отмена · ESC
            </button>
          )}
        </div>
      )}

      {/* Board */}
      <div className="max-w-[680px] mx-auto">
        <SiegeBoard
          fen={room.current_fen}
          pgn={room.pgn}
          myColor={myColor}
          isMyTurn={isMyTurn}
          cardMode={cardMode}
          shieldedSquare={room.shielded_square}
          skinKey={activeSkin}
          onMove={handleMove}
          onLightning={executeLightning}
          onShield={executeShield}
          onCoronation={executeCoronation}
        />
      </div>

      {/* Card bar */}
      <div className="max-w-[760px] mx-auto mt-4">
        {myColor && room.status === "active" && (
          <CardBar
            cardsLeft={myCardCount}
            active={activeCard}
            unlocks={myUnlocks}
            enemyCards={enemyCardCount}
            onActivate={activateCard}
            onUnlockClick={(k) => setUnlockModal(k)}
            onBuyMore={() => setOutOfCardsOpen(true)}
          />
        )}

        {myColor && room.status === "active" && (
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => setConfirmingResign(true)}
              className="chip text-xs px-3 py-2 border-war-red/40 text-war-red bg-red-950/30 hover:bg-red-900/40"
            >
              <Flag className="w-3.5 h-3.5" />
              Сдаться
            </button>
          </div>
        )}
      </div>

      <OutOfCardsModal
        open={outOfCardsOpen}
        balance={balance ?? 0}
        onClose={() => setOutOfCardsOpen(false)}
        onBuy={(size) => buySiegeCards(room.id, size)}
      />

      {unlockModal && (
        <UnlockCardModal
          open
          cardKey={unlockModal}
          emoji={CARDS[unlockModal].emoji}
          title={CARDS[unlockModal].title}
          description={CARDS[unlockModal].description}
          price={CARDS[unlockModal].unlockPrice ?? 150}
          balance={balance ?? 0}
          onUnlock={async () => unlockCard(unlockModal)}
          onClose={() => setUnlockModal(null)}
        />
      )}

      {confirmingResign && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setConfirmingResign(false)}
        >
          <div className="panel p-6 max-w-sm w-full neon-frame-red" onClick={(e) => e.stopPropagation()}>
            <Flag className="w-8 h-8 text-war-red mb-2" />
            <div className="font-display font-bold text-lg mb-1 text-war-text">Сдаться?</div>
            <div className="text-war-muted text-sm mb-5">
              Победа будет засчитана сопернику.
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
                  handleResign();
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

function ResultBanner({
  room,
  myColor,
}: {
  room: { result: string | null; end_method: string | null };
  myColor: "white" | "black" | null;
}) {
  const won =
    (room.result === "win_white" && myColor === "white") ||
    (room.result === "win_black" && myColor === "black");
  const lost =
    (room.result === "win_white" && myColor === "black") ||
    (room.result === "win_black" && myColor === "white");

  let label = "Матч завершён";
  let Icon = Equal;
  let cls = "border-war-border text-war-muted bg-war-panel";

  if (room.result === "draw") {
    label = "Ничья";
    Icon = Equal;
  } else if (won) {
    label = "ПОБЕДА";
    Icon = Trophy;
    cls = "border-emerald-700/40 text-emerald-300 bg-emerald-950/40";
  } else if (lost) {
    label = "ПОРАЖЕНИЕ";
    Icon = Skull;
    cls = "border-red-700/40 text-red-300 bg-red-950/40";
  }

  return (
    <div className={`${cls} border rounded-xl p-4 mb-3 flex items-center gap-3 animate-victoryPop`}>
      <Icon className="w-6 h-6" />
      <div className="flex-1">
        <div className="font-display font-bold text-lg">{label}</div>
        <div className="text-war-muted text-xs">
          {room.end_method === "checkmate" ? "Мат" : room.end_method === "stalemate" ? "Пат" : room.end_method === "resignation" ? "Сдача" : "Ничья"}
        </div>
      </div>
      <Link href="/play" className="btn-secondary text-xs py-2 px-3">
        К игре
      </Link>
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

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      {children}
    </div>
  );
}
