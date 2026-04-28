import { Chess, Move } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const KNIGHT_BONUS = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   0,   0,   0, -20, -40,
  -30,   0,  10,  15,  15,  10,   0, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,   0,  15,  20,  20,  15,   0, -30,
  -30,   5,  10,  15,  15,  10,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const PAWN_BONUS = [
   0,   0,   0,   0,   0,   0,   0,   0,
  50,  50,  50,  50,  50,  50,  50,  50,
  10,  10,  20,  30,  30,  20,  10,  10,
   5,   5,  10,  25,  25,  10,   5,   5,
   0,   0,   0,  20,  20,   0,   0,   0,
   5,  -5, -10,   0,   0, -10,  -5,   5,
   5,  10,  10, -20, -20,  10,  10,   5,
   0,   0,   0,   0,   0,   0,   0,   0,
];

const BISHOP_BONUS = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   5,  10,  10,   5,   0, -10,
  -10,   5,   5,  10,  10,   5,   5, -10,
  -10,   0,  10,  10,  10,  10,   0, -10,
  -10,  10,  10,  10,  10,  10,  10, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_BONUS = [
   0,   0,   0,   0,   0,   0,   0,   0,
   5,  10,  10,  10,  10,  10,  10,   5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
   0,   0,   0,   5,   5,   0,   0,   0,
];

const KING_BONUS = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
   20,  20,   0,   0,   0,   0,  20,  20,
   20,  30,  10,   0,   0,  10,  30,  20,
];

function squareToIndex(square: string, color: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  if (color === "w") return (7 - rank) * 8 + file;
  return rank * 8 + file;
}

function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -100000 : 100000;
  }
  if (game.isDraw() || game.isStalemate()) return 0;

  const board = game.board();
  let score = 0;

  board.forEach((row, r) => {
    row.forEach((sq, f) => {
      if (!sq) return;
      const pieceVal = PIECE_VALUES[sq.type] ?? 0;
      const squareName = "abcdefgh"[f] + (8 - r);
      const idx = squareToIndex(squareName, sq.color);

      let bonus = 0;
      if (sq.type === "n") bonus = KNIGHT_BONUS[idx] ?? 0;
      else if (sq.type === "p") bonus = PAWN_BONUS[idx] ?? 0;
      else if (sq.type === "b") bonus = BISHOP_BONUS[idx] ?? 0;
      else if (sq.type === "r") bonus = ROOK_BONUS[idx] ?? 0;
      else if (sq.type === "k") bonus = KING_BONUS[idx] ?? 0;

      if (sq.color === "b") score -= pieceVal + bonus;
      else score += pieceVal + bonus;
    });
  });

  return score;
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximising: boolean,
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves({ verbose: true });

  if (isMaximising) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export type AIDifficulty = "easy" | "normal" | "hard";

export function makeSmartMove(game: Chess, difficulty: AIDifficulty = "normal"): Move | null {
  if (game.isGameOver()) return null;

  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  if (difficulty === "easy") {
    return makeTacticalMove(game);
  }

  const moveCount = game.history().length;
  const baseDepth = difficulty === "hard" ? 3 : 2;
  const depth = moveCount < 6 ? baseDepth - 1 : baseDepth;

  const aiIsBlack = game.turn() === "b";
  let bestMove: Move | null = null;
  let bestScore = aiIsBlack ? Infinity : -Infinity;

  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffled) {
    game.move(move);
    const score = minimax(game, depth - 1, -Infinity, Infinity, !aiIsBlack);
    game.undo();

    if (aiIsBlack) {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove ?? moves[0];
}

export function makeTacticalMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  const scored = moves.map((m) => {
    let score = 0;
    if (m.san.includes("#")) score = 100000;
    else if (m.san.includes("+")) score = 1000;
    else if (m.captured) score = (PIECE_VALUES[m.captured] ?? 0) - (PIECE_VALUES[m.piece] ?? 0) / 10;
    else score = Math.random() * 5;
    return { move: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  return top[Math.floor(Math.random() * top.length)].move;
}
