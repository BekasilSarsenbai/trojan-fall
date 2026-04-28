import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

const STARTING_TOTAL = 8 * 1 + 2 * 3 + 2 * 3 + 2 * 5 + 1 * 9; // 39

export interface PositionStats {
  whiteMaterial: number;     // raw points 0-39
  blackMaterial: number;
  whiteForce: number;        // % of starting (0-100)
  blackForce: number;
  whiteCastled: boolean;
  blackCastled: boolean;
  whiteStability: number;    // 0-100
  blackStability: number;
  pieceCount: { w: number; b: number };
  fullmove: number;
}

export function getPositionStats(game: Chess): PositionStats {
  const board = game.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whiteCount = 0;
  let blackCount = 0;

  board.forEach((row) => {
    row.forEach((sq) => {
      if (!sq) return;
      const v = PIECE_VALUES[sq.type] ?? 0;
      if (sq.color === "w") {
        whiteMaterial += v;
        whiteCount++;
      } else {
        blackMaterial += v;
        blackCount++;
      }
    });
  });

  const verbose = game.history({ verbose: true });
  const whiteCastled = verbose.some(
    (m) => (m.san === "O-O" || m.san === "O-O-O") && m.color === "w",
  );
  const blackCastled = verbose.some(
    (m) => (m.san === "O-O" || m.san === "O-O-O") && m.color === "b",
  );

  const inCheck = game.inCheck();
  const turn = game.turn();
  const moveCount = verbose.length;

  // Stability: castled + not in check + early game = stable
  // Penalty for being in check (if it's your turn), reward for castling
  const stabilityFor = (color: "w" | "b", castled: boolean) => {
    let s = castled ? 88 : 60;
    if (inCheck && turn === color) s -= 30;
    // Material disadvantage hurts stability
    const mine = color === "w" ? whiteMaterial : blackMaterial;
    const theirs = color === "w" ? blackMaterial : whiteMaterial;
    if (mine < theirs) s -= Math.min(20, (theirs - mine) * 2);
    // Late game without castling — opening-like risk wears off
    if (!castled && moveCount > 30) s += 8;
    return Math.max(0, Math.min(100, s));
  };

  return {
    whiteMaterial,
    blackMaterial,
    whiteForce: Math.round((whiteMaterial / STARTING_TOTAL) * 100),
    blackForce: Math.round((blackMaterial / STARTING_TOTAL) * 100),
    whiteCastled,
    blackCastled,
    whiteStability: stabilityFor("w", whiteCastled),
    blackStability: stabilityFor("b", blackCastled),
    pieceCount: { w: whiteCount, b: blackCount },
    fullmove: Math.ceil(moveCount / 2),
  };
}
