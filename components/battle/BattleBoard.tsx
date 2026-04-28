"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { makeSmartMove, AIDifficulty } from "@/lib/chess/ai";
import { getControlZones, ControlZones } from "@/lib/chess/zones";
import { describeMove, BattleEvent } from "@/lib/chess/narrative";
import { getSkin } from "@/lib/shop/skins";

export type GameResult = {
  winner: "white" | "black" | "draw";
  method: "checkmate" | "stalemate" | "resignation" | "draw" | "insufficient";
  moves: string[];
  pgn: string;
  playerColor: "white" | "black";
};

interface Props {
  onGameOver: (result: GameResult) => void;
  onMove?: (game: Chess, history: string[], events: BattleEvent[]) => void;
  onCaptureUpdate?: (white: string[], black: string[]) => void;
  playerColor?: "white" | "black";
  showWarMap?: boolean;
  difficulty?: AIDifficulty;
  resign?: boolean;
  skinKey?: string;
}

const FILES = "abcdefgh";

function getAllSquares(): string[] {
  const out: string[] = [];
  for (const f of FILES) for (const r of "12345678") out.push(f + r);
  return out;
}

export function BattleBoard({
  onGameOver,
  onMove,
  onCaptureUpdate,
  playerColor = "white",
  showWarMap = false,
  difficulty = "normal",
  resign = false,
  skinKey,
}: Props) {
  const skin = getSkin(skinKey);
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, object>>({});
  const [zones, setZones] = useState<ControlZones | null>(null);
  const [thinking, setThinking] = useState(false);
  const [captureFlash, setCaptureFlash] = useState<string | null>(null);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: string; to: string } | null>(null);
  const [, setEvents] = useState<BattleEvent[]>([]);
  const capturedRef = useRef<{ white: string[]; black: string[] }>({ white: [], black: [] });
  const gameOverFiredRef = useRef(false);

  // ── pre-compute zones whenever toggled
  useEffect(() => {
    if (showWarMap) setZones(getControlZones(game));
    else setZones(null);
  }, [game, showWarMap]);

  // ── resignation
  useEffect(() => {
    if (!resign || gameOverFiredRef.current) return;
    gameOverFiredRef.current = true;
    const winner: "white" | "black" = playerColor === "white" ? "black" : "white";
    onGameOver({
      winner,
      method: "resignation",
      moves: game.history(),
      pgn: game.pgn(),
      playerColor,
    });
  }, [resign, playerColor, game, onGameOver]);

  // ── AI auto-opens if player is black
  useEffect(() => {
    if (playerColor === "black" && game.history().length === 0) {
      setThinking(true);
      const t = setTimeout(() => makeAIMove(game), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customSquareStyles = useCallback((): Record<string, object> => {
    const styles: Record<string, object> = {};

    if (zones) {
      const all = getAllSquares();
      all.forEach((sq) => {
        const w = zones.white.has(sq);
        const b = zones.black.has(sq);
        if (w && b) {
          styles[sq] = { background: "rgba(124, 58, 237, 0.22)" };
        } else if (w) {
          const c = zones.whiteCount[sq] ?? 1;
          styles[sq] = { background: `rgba(61, 168, 255, ${Math.min(0.18 + c * 0.06, 0.4)})` };
        } else if (b) {
          const c = zones.blackCount[sq] ?? 1;
          styles[sq] = { background: `rgba(255, 61, 90, ${Math.min(0.18 + c * 0.06, 0.4)})` };
        }
      });
    }

    if (lastMoveSquares) {
      styles[lastMoveSquares.from] = {
        ...(styles[lastMoveSquares.from] ?? {}),
        background: "rgba(245, 197, 66, 0.25)",
      };
      styles[lastMoveSquares.to] = {
        ...(styles[lastMoveSquares.to] ?? {}),
        background: "rgba(245, 197, 66, 0.35)",
        boxShadow: "inset 0 0 0 2px rgba(245, 197, 66, 0.6)",
      };
    }

    Object.assign(styles, optionSquares);

    if (captureFlash) {
      styles[captureFlash] = {
        background: "rgba(255, 61, 90, 0.55)",
        transition: "background 0.1s ease",
      };
    }

    if (game.inCheck()) {
      const turn = game.turn();
      const board = game.board();
      board.forEach((row, r) => {
        row.forEach((sq, f) => {
          if (sq && sq.type === "k" && sq.color === turn) {
            const sqName = FILES[f] + (8 - r);
            styles[sqName] = {
              ...(styles[sqName] ?? {}),
              boxShadow: "inset 0 0 0 3px rgba(255, 61, 90, 0.85)",
              animation: "pulse-red 1.4s ease-in-out infinite",
            };
          }
        });
      });
    }

    return styles;
  }, [zones, optionSquares, captureFlash, lastMoveSquares, game]);

  function showLegalMoves(square: string) {
    const moves = game.moves({ square: square as Square, verbose: true });
    if (!moves.length) {
      setOptionSquares({});
      return;
    }
    const next: Record<string, object> = {};
    moves.forEach((m) => {
      const target = game.get(m.to as Square);
      next[m.to] = {
        background: target
          ? "radial-gradient(circle, rgba(255,61,90,0.35) 70%, transparent 75%)"
          : "radial-gradient(circle, rgba(61,168,255,0.45) 22%, transparent 28%)",
        borderRadius: "50%",
      };
    });
    next[square] = { background: "rgba(245, 197, 66, 0.30)" };
    setOptionSquares(next);
  }

  function isPlayerTurn(g: Chess) {
    return g.turn() === playerColor[0];
  }

  function onSquareClick(square: string) {
    if (!isPlayerTurn(game) || thinking) return;

    if (!moveFrom) {
      const piece = game.get(square as Square);
      if (piece && piece.color === playerColor[0]) {
        setMoveFrom(square);
        showLegalMoves(square);
      }
      return;
    }

    const moved = makeMove(moveFrom, square);
    if (!moved) {
      const piece = game.get(square as Square);
      if (piece && piece.color === playerColor[0]) {
        setMoveFrom(square);
        showLegalMoves(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (!isPlayerTurn(game) || thinking) return false;
    return makeMove(sourceSquare, targetSquare);
  }

  function makeMove(from: string, to: string): boolean {
    const trial = new Chess();
    trial.loadPgn(game.pgn());
    let moveResult: Move | null = null;
    try {
      moveResult = trial.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }
    if (!moveResult) return false;

    if (moveResult.captured) {
      capturedRef.current[playerColor].push(moveResult.captured);
      onCaptureUpdate?.(capturedRef.current.white, capturedRef.current.black);
      setCaptureFlash(to);
      setTimeout(() => setCaptureFlash(null), 150);
    }
    setLastMoveSquares({ from, to });

    const ply = game.history().length;
    const newEvent = describeMove(moveResult, ply);

    setGame(trial);
    setMoveFrom(null);
    setOptionSquares({});
    setEvents((prev) => {
      const next = [...prev, newEvent];
      onMove?.(trial, trial.history(), next);
      return next;
    });

    if (checkGameOver(trial)) return true;

    setThinking(true);
    setTimeout(() => makeAIMove(trial), 300);
    return true;
  }

  function makeAIMove(currentGame: Chess) {
    const aiMove = makeSmartMove(currentGame, difficulty);
    if (!aiMove) {
      setThinking(false);
      checkGameOver(currentGame);
      return;
    }

    const copy = new Chess();
    copy.loadPgn(currentGame.pgn());
    const result = copy.move(aiMove);
    if (!result) {
      setThinking(false);
      return;
    }

    const aiColor: "white" | "black" = playerColor === "white" ? "black" : "white";
    if (result.captured) {
      capturedRef.current[aiColor].push(result.captured);
      onCaptureUpdate?.(capturedRef.current.white, capturedRef.current.black);
      setCaptureFlash(result.to);
      setTimeout(() => setCaptureFlash(null), 150);
    }
    setLastMoveSquares({ from: result.from, to: result.to });

    const ply = currentGame.history().length;
    const event = describeMove(result, ply);

    setGame(copy);
    setThinking(false);
    setEvents((prev) => {
      const next = [...prev, event];
      onMove?.(copy, copy.history(), next);
      return next;
    });
    checkGameOver(copy);
  }

  function checkGameOver(g: Chess): boolean {
    if (gameOverFiredRef.current) return true;
    if (!g.isGameOver()) return false;
    gameOverFiredRef.current = true;

    let winner: "white" | "black" | "draw" = "draw";
    let method: GameResult["method"] = "draw";

    if (g.isCheckmate()) {
      winner = g.turn() === "w" ? "black" : "white";
      method = "checkmate";
    } else if (g.isStalemate()) {
      method = "stalemate";
    } else if (g.isInsufficientMaterial()) {
      method = "insufficient";
    }

    const result: GameResult = {
      winner,
      method,
      moves: g.history(),
      pgn: g.pgn(),
      playerColor,
    };

    setTimeout(() => onGameOver(result), 300);
    return true;
  }

  return (
    <div className="relative">
      <Chessboard
        position={game.fen()}
        onSquareClick={onSquareClick}
        onPieceDrop={onDrop}
        boardOrientation={playerColor}
        customSquareStyles={customSquareStyles()}
        customDarkSquareStyle={{
          backgroundColor: skin.dark,
          boxShadow: "inset 0 0 22px rgba(0, 0, 0, 0.5)",
        }}
        customLightSquareStyle={{
          backgroundColor: skin.light,
          boxShadow: "inset 0 0 14px rgba(255, 255, 255, 0.05)",
        }}
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 0 2px ${skin.glowBlue}, 0 0 60px ${skin.glowBlue}, 0 0 0 4px ${skin.glowRed}`,
        }}
        animationDuration={200}
      />
    </div>
  );
}
