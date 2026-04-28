"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getControlZones, ControlZones } from "@/lib/chess/zones";
import { getSkin } from "@/lib/shop/skins";

interface Props {
  pgn: string;
  myColor: "white" | "black" | null;
  isMyTurn: boolean;
  showWarMap?: boolean;
  onMove?: (newPgn: string, newFen: string, nextTurn: "white" | "black", move: Move) => void;
  onTerminal?: (result: "win_white" | "win_black" | "draw", method: "checkmate" | "stalemate" | "draw") => void;
  skinKey?: string;
}

const FILES = "abcdefgh";

function getAllSquares(): string[] {
  const out: string[] = [];
  for (const f of FILES) for (const r of "12345678") out.push(f + r);
  return out;
}

export function MultiplayerBoard({
  pgn,
  myColor,
  isMyTurn,
  showWarMap = false,
  onMove,
  onTerminal,
  skinKey,
}: Props) {
  const skin = getSkin(skinKey);
  const game = useMemo(() => {
    const g = new Chess();
    if (pgn) {
      try {
        g.loadPgn(pgn);
      } catch {
        // ignore — empty/invalid pgn
      }
    }
    return g;
  }, [pgn]);

  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, object>>({});
  const [zones, setZones] = useState<ControlZones | null>(null);
  const [captureFlash, setCaptureFlash] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Track the most recent move from PGN so we can render highlight
  useEffect(() => {
    const verbose = game.history({ verbose: true }) as Move[];
    const last = verbose[verbose.length - 1];
    if (last) setLastMove({ from: last.from, to: last.to });
    else setLastMove(null);
  }, [game]);

  useEffect(() => {
    if (showWarMap) setZones(getControlZones(game));
    else setZones(null);
  }, [game, showWarMap]);

  const customSquareStyles = useCallback((): Record<string, object> => {
    const styles: Record<string, object> = {};

    if (zones) {
      getAllSquares().forEach((sq) => {
        const w = zones.white.has(sq);
        const b = zones.black.has(sq);
        if (w && b) styles[sq] = { background: "rgba(124, 58, 237, 0.22)" };
        else if (w) {
          const c = zones.whiteCount[sq] ?? 1;
          styles[sq] = { background: `rgba(61, 168, 255, ${Math.min(0.18 + c * 0.06, 0.4)})` };
        } else if (b) {
          const c = zones.blackCount[sq] ?? 1;
          styles[sq] = { background: `rgba(255, 61, 90, ${Math.min(0.18 + c * 0.06, 0.4)})` };
        }
      });
    }

    if (lastMove) {
      styles[lastMove.from] = { ...(styles[lastMove.from] ?? {}), background: "rgba(245, 197, 66, 0.25)" };
      styles[lastMove.to] = {
        ...(styles[lastMove.to] ?? {}),
        background: "rgba(245, 197, 66, 0.35)",
        boxShadow: "inset 0 0 0 2px rgba(245, 197, 66, 0.6)",
      };
    }

    Object.assign(styles, optionSquares);

    if (captureFlash) {
      styles[captureFlash] = { background: "rgba(255, 61, 90, 0.55)" };
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
  }, [zones, optionSquares, captureFlash, lastMove, game]);

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

  function attemptMove(from: string, to: string): boolean {
    if (!isMyTurn || !myColor) return false;

    const trial = new Chess();
    if (game.pgn()) {
      try { trial.loadPgn(game.pgn()); } catch { /* ignore */ }
    }
    let result: Move | null = null;
    try {
      result = trial.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }
    if (!result) return false;

    const newPgn = trial.pgn();
    const newFen = trial.fen();
    const nextTurn: "white" | "black" = trial.turn() === "w" ? "white" : "black";

    if (result.captured) {
      setCaptureFlash(to);
      setTimeout(() => setCaptureFlash(null), 150);
    }

    onMove?.(newPgn, newFen, nextTurn, result);

    if (trial.isGameOver()) {
      if (trial.isCheckmate()) {
        const winnerColor = trial.turn() === "w" ? "black" : "white";
        onTerminal?.(winnerColor === "white" ? "win_white" : "win_black", "checkmate");
      } else if (trial.isStalemate()) {
        onTerminal?.("draw", "stalemate");
      } else {
        onTerminal?.("draw", "draw");
      }
    }

    setMoveFrom(null);
    setOptionSquares({});
    return true;
  }

  function onSquareClick(square: string) {
    if (!isMyTurn || !myColor) return;
    if (!moveFrom) {
      const piece = game.get(square as Square);
      if (piece && piece.color === myColor[0]) {
        setMoveFrom(square);
        showLegalMoves(square);
      }
      return;
    }
    const moved = attemptMove(moveFrom, square);
    if (!moved) {
      const piece = game.get(square as Square);
      if (piece && piece.color === myColor[0]) {
        setMoveFrom(square);
        showLegalMoves(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  }

  function onDrop(source: string, target: string): boolean {
    return attemptMove(source, target);
  }

  return (
    <div className="relative">
      <Chessboard
        position={game.fen()}
        onSquareClick={onSquareClick}
        onPieceDrop={onDrop}
        boardOrientation={myColor === "black" ? "black" : "white"}
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
        arePiecesDraggable={isMyTurn && !!myColor}
      />
    </div>
  );
}
