"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getSkin } from "@/lib/shop/skins";
import type { CardActionMode } from "@/lib/siege/cards";

interface Props {
  fen: string;
  pgn: string;
  myColor: "white" | "black" | null;
  isMyTurn: boolean;
  cardMode: CardActionMode;
  shieldedSquare: string | null;
  skinKey?: string;
  onMove: (newPgn: string, newFen: string, capturedSquare?: string) => void;
  onLightning: (square: string) => void;
  onShield: (square: string) => void;
  onCoronation: (square: string) => void;
}

const FILES = "abcdefgh";

export function SiegeBoard({
  fen,
  pgn,
  myColor,
  isMyTurn,
  cardMode,
  shieldedSquare,
  skinKey,
  onMove,
  onLightning,
  onShield,
  onCoronation,
}: Props) {
  const skin = getSkin(skinKey);
  const game = useMemo(() => {
    const g = new Chess();
    if (pgn) {
      try { g.loadPgn(pgn); } catch { /* ignore */ }
    } else if (fen) {
      try { g.load(fen); } catch { /* ignore */ }
    }
    return g;
  }, [pgn, fen]);

  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, object>>({});
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    const verbose = game.history({ verbose: true }) as Move[];
    const last = verbose[verbose.length - 1];
    if (last) setLastMove({ from: last.from, to: last.to });
    else setLastMove(null);
  }, [game]);

  const customSquareStyles = useCallback((): Record<string, object> => {
    const styles: Record<string, object> = {};

    // Card-mode highlights
    if (cardMode === "lightning_target" && isMyTurn && myColor) {
      const board = game.board();
      board.forEach((row, r) => {
        row.forEach((sq, f) => {
          if (sq && sq.color !== myColor[0] && sq.type !== "k") {
            const name = FILES[f] + (8 - r);
            styles[name] = {
              background: "rgba(239, 68, 68, 0.45)",
              cursor: "crosshair",
              boxShadow: "inset 0 0 0 2px rgba(239, 68, 68, 0.85)",
              animation: "checkPulse 1s ease-in-out infinite",
            };
          }
        });
      });
    } else if (cardMode === "shield_select" && isMyTurn && myColor) {
      const board = game.board();
      board.forEach((row, r) => {
        row.forEach((sq, f) => {
          if (sq && sq.color === myColor[0] && sq.type !== "k") {
            const name = FILES[f] + (8 - r);
            styles[name] = {
              background: "rgba(245, 197, 66, 0.35)",
              cursor: "pointer",
              boxShadow: "inset 0 0 0 2px rgba(245, 197, 66, 0.85)",
              animation: "rankGlow 1.5s ease-in-out infinite",
            };
          }
        });
      });
    } else if (cardMode === "coronation_select" && isMyTurn && myColor) {
      const board = game.board();
      board.forEach((row, r) => {
        row.forEach((sq, f) => {
          if (sq && sq.color === myColor[0] && sq.type === "p") {
            const name = FILES[f] + (8 - r);
            styles[name] = {
              background: "rgba(157, 77, 255, 0.45)",
              cursor: "pointer",
              boxShadow: "inset 0 0 0 2px rgba(157, 77, 255, 0.9)",
              animation: "rankGlow 1.5s ease-in-out infinite",
            };
          }
        });
      });
    }

    if (lastMove) {
      styles[lastMove.from] = {
        ...(styles[lastMove.from] ?? {}),
        background: "rgba(245, 197, 66, 0.22)",
      };
      styles[lastMove.to] = {
        ...(styles[lastMove.to] ?? {}),
        background: "rgba(245, 197, 66, 0.32)",
      };
    }

    if (shieldedSquare) {
      styles[shieldedSquare] = {
        ...(styles[shieldedSquare] ?? {}),
        boxShadow: "inset 0 0 0 3px rgba(245, 197, 66, 0.95), 0 0 16px rgba(245, 197, 66, 0.65)",
        animation: "rankGlow 2s ease-in-out infinite",
      };
    }

    Object.assign(styles, optionSquares);

    if (game.inCheck()) {
      const turn = game.turn();
      const board = game.board();
      board.forEach((row, r) => {
        row.forEach((sq, f) => {
          if (sq && sq.type === "k" && sq.color === turn) {
            const name = FILES[f] + (8 - r);
            styles[name] = {
              ...(styles[name] ?? {}),
              boxShadow: "inset 0 0 0 3px rgba(239, 68, 68, 0.85)",
              animation: "checkPulse 1s ease-in-out infinite",
            };
          }
        });
      });
    }

    return styles;
  }, [cardMode, isMyTurn, myColor, lastMove, optionSquares, game, shieldedSquare]);

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
          ? "radial-gradient(circle, rgba(239,68,68,0.40) 70%, transparent 75%)"
          : "radial-gradient(circle, rgba(103,232,249,0.50) 22%, transparent 28%)",
        borderRadius: "50%",
      };
    });
    next[square] = { background: "rgba(245, 197, 66, 0.30)" };
    setOptionSquares(next);
  }

  function onSquareClick(square: string) {
    if (!isMyTurn || !myColor) return;

    // Card targeting modes
    if (cardMode === "lightning_target") {
      const piece = game.get(square as Square);
      if (piece && piece.color !== myColor[0] && piece.type !== "k") {
        onLightning(square);
      }
      return;
    }
    if (cardMode === "shield_select") {
      const piece = game.get(square as Square);
      if (piece && piece.color === myColor[0] && piece.type !== "k") {
        onShield(square);
      }
      return;
    }
    if (cardMode === "coronation_select") {
      const piece = game.get(square as Square);
      if (piece && piece.color === myColor[0] && piece.type === "p") {
        onCoronation(square);
      }
      return;
    }

    // Normal move flow
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

  function attemptMove(from: string, to: string): boolean {
    if (!isMyTurn || !myColor) return false;
    if (cardMode) return false;

    // Shield protection: cannot capture shielded square
    if (shieldedSquare === to) {
      // Block the capture — reset selection
      setMoveFrom(null);
      setOptionSquares({});
      return false;
    }

    const trial = new Chess();
    if (game.pgn()) {
      try { trial.loadPgn(game.pgn()); } catch { /* ignore */ }
    } else {
      try { trial.load(game.fen()); } catch { /* ignore */ }
    }

    let result: Move | null = null;
    try {
      result = trial.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }
    if (!result) return false;

    onMove(trial.pgn(), trial.fen(), result.captured ? to : undefined);
    setMoveFrom(null);
    setOptionSquares({});
    return true;
  }

  function onDrop(source: string, target: string): boolean {
    if (cardMode) return false;
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
        arePiecesDraggable={isMyTurn && !!myColor && !cardMode}
      />
    </div>
  );
}
