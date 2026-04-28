import { Move } from "chess.js";

export const PIECE_NAMES_RU: Record<string, string> = {
  p: "пешка",
  n: "конь",
  b: "слон",
  r: "ладья",
  q: "ферзь",
  k: "король",
};

export const PIECE_NAMES_RU_ACC: Record<string, string> = {
  p: "пешку",
  n: "коня",
  b: "слона",
  r: "ладью",
  q: "ферзя",
  k: "короля",
};

const CAPTURE_PHRASES = [
  (piece: string, square: string) => `Захвачен(а) ${PIECE_NAMES_RU_ACC[piece]} на ${square}`,
  (piece: string, square: string) => `Уничтожен(а) ${PIECE_NAMES_RU_ACC[piece]} противника (${square})`,
  (piece: string, square: string) => `Падение бойца — ${PIECE_NAMES_RU[piece]} на ${square} пал(а)`,
];

const CHECK_PHRASES = [
  "Атака на штаб противника! Король под огнём.",
  "Командир врага в опасности — шах объявлен.",
  "Прорыв линии обороны: шах!",
];

const CASTLE_PHRASES = {
  short: "Эвакуация командира на королевский фланг — рокировка завершена.",
  long: "Перемещение штаба на ферзевый фланг — длинная рокировка.",
};

const PROMOTION_PHRASES = (piece: string) =>
  `Пешка прорвалась в тыл — повышена до ${PIECE_NAMES_RU[piece]}.`;

export interface BattleEvent {
  type: "move" | "capture" | "check" | "castle" | "promotion" | "checkmate";
  ply: number;
  side: "white" | "black";
  text: string;
  san: string;
}

export function describeMove(move: Move, ply: number): BattleEvent {
  const side = move.color === "w" ? "white" : "black";
  const square = move.to;

  if (move.san.includes("#")) {
    return {
      type: "checkmate",
      ply,
      side,
      san: move.san,
      text: `MAT! Захват штаба завершён на ${square}.`,
    };
  }

  if (move.san === "O-O") {
    return { type: "castle", ply, side, san: move.san, text: CASTLE_PHRASES.short };
  }
  if (move.san === "O-O-O") {
    return { type: "castle", ply, side, san: move.san, text: CASTLE_PHRASES.long };
  }

  if (move.promotion) {
    return {
      type: "promotion",
      ply,
      side,
      san: move.san,
      text: PROMOTION_PHRASES(move.promotion),
    };
  }

  if (move.captured) {
    const phrase = CAPTURE_PHRASES[ply % CAPTURE_PHRASES.length];
    return {
      type: "capture",
      ply,
      side,
      san: move.san,
      text: phrase(move.captured, square),
    };
  }

  if (move.san.includes("+")) {
    return {
      type: "check",
      ply,
      side,
      san: move.san,
      text: CHECK_PHRASES[ply % CHECK_PHRASES.length],
    };
  }

  // обычный ход
  const piece = PIECE_NAMES_RU[move.piece];
  const verb =
    move.piece === "n" ? "выдвинут на"
      : move.piece === "p" ? "продвинута на"
      : "переброшен(а) на";
  return {
    type: "move",
    ply,
    side,
    san: move.san,
    text: `${piece[0].toUpperCase() + piece.slice(1)} ${verb} ${square}`,
  };
}
