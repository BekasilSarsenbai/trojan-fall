import { Chess, Square } from "chess.js";

export interface ControlZones {
  white: Set<string>;
  black: Set<string>;
  whiteCount: Record<string, number>;
  blackCount: Record<string, number>;
}

export function getControlZones(game: Chess): ControlZones {
  const white = new Set<string>();
  const black = new Set<string>();
  const whiteCount: Record<string, number> = {};
  const blackCount: Record<string, number> = {};

  const board = game.board();
  const files = "abcdefgh";

  board.forEach((row, rankIdx) => {
    row.forEach((sq, fileIdx) => {
      if (!sq) return;
      const squareName = files[fileIdx] + (8 - rankIdx);
      const attacked = getAttackedSquares(game, squareName, sq.color, sq.type);

      attacked.forEach((target) => {
        if (sq.color === "w") {
          white.add(target);
          whiteCount[target] = (whiteCount[target] ?? 0) + 1;
        } else {
          black.add(target);
          blackCount[target] = (blackCount[target] ?? 0) + 1;
        }
      });
    });
  });

  return { white, black, whiteCount, blackCount };
}

function getAttackedSquares(
  game: Chess,
  square: string,
  color: string,
  type: string,
): string[] {
  const attacked: string[] = [];

  if (type === "p") {
    const rankNum = parseInt(square[1]);
    const fileChar = square[0];
    const fileIdx = "abcdefgh".indexOf(fileChar);
    const nextRank = color === "w" ? rankNum + 1 : rankNum - 1;
    if (nextRank >= 1 && nextRank <= 8) {
      if (fileIdx > 0) attacked.push("abcdefgh"[fileIdx - 1] + nextRank);
      if (fileIdx < 7) attacked.push("abcdefgh"[fileIdx + 1] + nextRank);
    }
    return attacked;
  }

  if (type === "n") {
    const rankNum = parseInt(square[1]);
    const fileIdx = "abcdefgh".indexOf(square[0]);
    const offsets = [
      [1, 2], [2, 1], [-1, 2], [-2, 1],
      [1, -2], [2, -1], [-1, -2], [-2, -1],
    ];
    for (const [df, dr] of offsets) {
      const f = fileIdx + df;
      const r = rankNum + dr;
      if (f >= 0 && f <= 7 && r >= 1 && r <= 8) {
        attacked.push("abcdefgh"[f] + r);
      }
    }
    return attacked;
  }

  if (type === "k") {
    const rankNum = parseInt(square[1]);
    const fileIdx = "abcdefgh".indexOf(square[0]);
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        const f = fileIdx + df;
        const r = rankNum + dr;
        if (f >= 0 && f <= 7 && r >= 1 && r <= 8) {
          attacked.push("abcdefgh"[f] + r);
        }
      }
    }
    return attacked;
  }

  // Sliding pieces — bishop, rook, queen
  const directions: Array<[number, number]> = [];
  if (type === "b" || type === "q") {
    directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  }
  if (type === "r" || type === "q") {
    directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  }

  const rankNum = parseInt(square[1]);
  const fileIdx = "abcdefgh".indexOf(square[0]);

  for (const [df, dr] of directions) {
    let f = fileIdx + df;
    let r = rankNum + dr;
    while (f >= 0 && f <= 7 && r >= 1 && r <= 8) {
      const target = "abcdefgh"[f] + r;
      attacked.push(target);
      const piece = game.get(target as Square);
      if (piece) break; // блокируется любой фигурой
      f += df;
      r += dr;
    }
  }

  return attacked;
}

export function getTerritoryControl(zones: ControlZones): {
  white: number;
  black: number;
  contested: number;
} {
  const total = 64;
  const whiteOnly = [...zones.white].filter((s) => !zones.black.has(s)).length;
  const blackOnly = [...zones.black].filter((s) => !zones.white.has(s)).length;
  const contested = [...zones.white].filter((s) => zones.black.has(s)).length;

  return {
    white: Math.round((whiteOnly / total) * 100),
    black: Math.round((blackOnly / total) * 100),
    contested: Math.round((contested / total) * 100),
  };
}
