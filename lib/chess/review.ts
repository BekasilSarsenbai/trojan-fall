import { Chess, Move } from "chess.js";
import { getControlZones, getTerritoryControl } from "./zones";

export type WarIncidentType =
  | "early_queen"
  | "king_exposed"
  | "hanging_piece"
  | "no_development"
  | "pawn_weakness"
  | "material_loss"
  | "blunder"
  | "missed_capture";

export interface WarIncident {
  type: WarIncidentType;
  move: number;
  severity: "critical" | "major" | "minor";
  title: string;
  description: string;
  advice: string;
  icon: string;
}

export interface WarReport {
  accuracy: number;
  territory: { white: number; black: number; contested: number };
  headline: string;
  narrative: string;
  incidents: WarIncident[];
  strengths: string[];
  rating_delta: number;
  xp_earned: number;
  ducats_earned?: number;
  moveCount: number;
  result: "win" | "loss" | "draw";
  playerColor: "white" | "black";
  keyMoments: KeyMoment[];
}

export interface KeyMoment {
  ply: number;
  moveNumber: number;
  san: string;
  kind: "good" | "bad" | "neutral";
  note: string;
}

export function generateWarReport(
  pgn: string,
  playerColor: "white" | "black",
  result: "win" | "loss" | "draw",
): WarReport {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    // partial PGN — fallback
  }

  const moves = game.history();
  const verbose = game.history({ verbose: true }) as Move[];
  const incidents: WarIncident[] = [];
  const playerIsWhite = playerColor === "white";

  const playerMoves: Move[] = verbose.filter((_, i) =>
    playerIsWhite ? i % 2 === 0 : i % 2 === 1,
  );

  // ─── 1. Ранний выход ферзём ─────────────────────────
  const earlyQueenMoves = playerMoves
    .slice(0, 8)
    .filter(
      (m) =>
        m.piece === "q" &&
        m.from !== (playerIsWhite ? "d1" : "d8") === false &&
        m.from === (playerIsWhite ? "d1" : "d8"),
    );

  if (earlyQueenMoves.length >= 2 || (earlyQueenMoves.length >= 1 && playerMoves.length > 4 && playerMoves.indexOf(earlyQueenMoves[0]) < 3)) {
    const idx = verbose.indexOf(earlyQueenMoves[0]);
    incidents.push({
      type: "early_queen",
      move: Math.floor(idx / 2) + 1,
      severity: "major",
      title: "Преждевременная атака главнокомандующего",
      description:
        "Ферзь — ваш главнокомандующий. Бросать его в бой без поддержки армии означает обнажить штаб. " +
        "Противник получил темп для развития, пока вы гоняли ферзя.",
      advice:
        "Сначала выведите коней и слонов на активные позиции. Сделайте рокировку. " +
        "Только потом начинайте операции ферзём — он уязвим без прикрытия.",
      icon: "sword",
    });
  }

  // ─── 2. Отсутствие рокировки ─────────────────────────
  const hasCastled = playerMoves.some((m) => m.san === "O-O" || m.san === "O-O-O");
  if (!hasCastled && moves.length > 20) {
    incidents.push({
      type: "king_exposed",
      move: 0,
      severity: "critical",
      title: "Незащищённый штаб",
      description:
        "Ваш король оставался в центре доски. Центр — это линия фронта. " +
        "Держать командира в зоне боёв критически опасно при открытых линиях.",
      advice:
        "Рокировка — это эвакуация командира за линию обороны. Старайтесь рокировать до 10-го хода.",
      icon: "shield",
    });
  }

  // ─── 3. Развитие фигур ────────────────────────────────
  const firstTen = playerMoves.slice(0, 10);
  const developed = new Set(
    firstTen.filter((m) => m.piece === "n" || m.piece === "b").map((m) => m.piece + m.from),
  );
  if (developed.size < 2 && moves.length > 14) {
    incidents.push({
      type: "no_development",
      move: 0,
      severity: "major",
      title: "Армия не развёрнута",
      description:
        "В первые ходы ваши кони и слоны почти не участвовали в игре — это всё равно что идти в бой без пехоты. " +
        "Противник занял ключевые позиции пока ваша армия стояла в казармах.",
      advice:
        "Три правила дебюта: вывод коней (Кf3/Кc3), затем слоны на активные диагонали, затем рокировка. " +
        "Не двигайте одну фигуру дважды без причины.",
      icon: "users",
    });
  }

  // ─── 4. Повторные ходы одной фигурой ─────────────────
  const moveCounts: Record<string, number> = {};
  firstTen.forEach((m) => {
    const key = m.piece + (m.from ?? "");
    moveCounts[key] = (moveCounts[key] ?? 0) + 1;
  });
  const repeated = Object.entries(moveCounts).filter(([, c]) => c >= 3);
  if (repeated.length > 0 && developed.size < 3) {
    incidents.push({
      type: "no_development",
      move: 0,
      severity: "minor",
      title: "Один боец тянет всю атаку",
      description:
        "Одна фигура сделала 3+ ходов в дебюте, пока остальные стояли. " +
        "Концентрация на одном бойце — частая ошибка новичков.",
      advice:
        "Задействуйте все фигуры. Каждая лёгкая фигура должна сделать хотя бы один ход в первые 10 ходов.",
      icon: "alert",
    });
  }

  // ─── 5. Висячие фигуры ────────────────────────────────
  const hanging = detectHangingMoves(verbose, playerColor);
  if (hanging.length > 0) {
    const worst = hanging[0];
    incidents.push({
      type: "hanging_piece",
      move: Math.floor(worst.ply / 2) + 1,
      severity: worst.value >= 500 ? "critical" : worst.value >= 300 ? "major" : "minor",
      title: "Висячий боец на поле",
      description:
        `На ходу ${Math.floor(worst.ply / 2) + 1} ваш(а) ${pieceNameAcc(worst.piece)} оказал(а)ся под ударом без защиты. ` +
        "Каждая фигура должна быть либо атакована другом, либо вне зоны поражения.",
      advice:
        "Перед каждым ходом задавайте вопрос: «Что происходит, если соперник возьмёт мою фигуру?» " +
        "Считайте обмены как баланс: цена твоей фигуры vs цена соперника.",
      icon: "target",
    });
  }

  // ─── Accuracy ────────────────────────────────────────
  const baseAccuracy = 88;
  const penaltyCritical = incidents.filter((i) => i.severity === "critical").length * 18;
  const penaltyMajor = incidents.filter((i) => i.severity === "major").length * 11;
  const penaltyMinor = incidents.filter((i) => i.severity === "minor").length * 5;
  const accuracy = Math.max(
    30,
    Math.min(
      98,
      baseAccuracy -
        penaltyCritical -
        penaltyMajor -
        penaltyMinor +
        (result === "win" ? 6 : result === "draw" ? 2 : 0),
    ),
  );

  // ─── Территориальный контроль (финальная позиция) ────
  const finalZones = getControlZones(game);
  const territory = getTerritoryControl(finalZones);

  // ─── Нарратив ────────────────────────────────────────
  const { headline, narrative } = buildNarrative(incidents, result, territory, playerColor);

  // ─── Сильные стороны ─────────────────────────────────
  const strengths = buildStrengths(incidents, result, playerMoves, hasCastled, developed.size);

  // ─── XP и рейтинг ────────────────────────────────────
  const xp_earned = calculateXP(result, accuracy);
  const rating_delta = calculateRatingDelta(result, accuracy);

  // ─── Key Moments ─────────────────────────────────────
  const keyMoments = buildKeyMoments(verbose, hanging, hasCastled, playerColor);

  return {
    accuracy,
    territory,
    headline,
    narrative,
    incidents: incidents.slice(0, 4),
    strengths,
    rating_delta,
    xp_earned,
    moveCount: moves.length,
    result,
    playerColor,
    keyMoments,
  };
}

function pieceNameAcc(p: string): string {
  return (
    {
      p: "пешка",
      n: "конь",
      b: "слон",
      r: "ладья",
      q: "ферзь",
      k: "король",
    } as Record<string, string>
  )[p] ?? "фигура";
}

interface HangingMove {
  ply: number;
  piece: string;
  value: number;
  square: string;
}

function detectHangingMoves(verbose: Move[], playerColor: "white" | "black"): HangingMove[] {
  const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const hanging: HangingMove[] = [];

  const game = new Chess();
  for (let i = 0; i < verbose.length; i++) {
    const move = verbose[i];
    game.move(move);
    const isPlayerMove = (playerColor === "white") === (i % 2 === 0);
    if (!isPlayerMove) continue;

    // Check the move that the opponent just made — but we want to detect when the player's
    // current move LEFT a piece hanging. Look one ply forward: if the opponent could capture
    // a player's piece for free, that's a hang.
    const opponentMoves = game.moves({ verbose: true });
    for (const om of opponentMoves) {
      if (om.captured && PIECE_VALUES[om.captured] >= 300) {
        // Check if defended: temp move, see if recapture restores
        const test = new Chess(game.fen());
        test.move(om);
        const recaptures = test.moves({ verbose: true }).filter((r) => r.to === om.to);
        const lostValue = PIECE_VALUES[om.captured];
        const gainedValue = recaptures.length
          ? PIECE_VALUES[om.piece] ?? 0
          : 0;
        if (lostValue - gainedValue >= 200) {
          hanging.push({ ply: i, piece: om.captured, value: lostValue, square: om.to });
          break;
        }
      }
    }
  }

  hanging.sort((a, b) => b.value - a.value);
  return hanging;
}

function buildNarrative(
  incidents: WarIncident[],
  result: string,
  territory: { white: number; black: number; contested: number },
  playerColor: string,
): { headline: string; narrative: string } {
  const playerTerr = playerColor === "white" ? territory.white : territory.black;

  if (result === "win") {
    return {
      headline: "Победа! Ваши войска захватили поле.",
      narrative:
        `Вы контролировали ${playerTerr}% территории к финалу. ` +
        (incidents.length > 0
          ? `Несмотря на ${incidents.length} тактических просчёт(ов), итог — за вами. `
          : "Партия сыграна уверенно, без серьёзных ошибок. ") +
        "Закрепите успех — следующая битва будет ещё чище.",
    };
  }

  const main = incidents[0];
  if (result === "loss" && main) {
    return {
      headline: `${main.title} — ключевой эпизод поражения.`,
      narrative:
        main.description +
        ` К концу битвы вы удерживали лишь ${playerTerr}% территории. ` +
        "Исправьте этот эпизод — и следующая партия пойдёт иначе.",
    };
  }

  if (result === "loss") {
    return {
      headline: "Поражение в равной борьбе.",
      narrative:
        `Вы контролировали ${playerTerr}% поля. Очевидных провалов не было — ` +
        "противник просто оказался точнее в обмене. Добавьте к точности агрессии.",
    };
  }

  return {
    headline: "Достойная битва. Силы оказались равны.",
    narrative:
      `Вы удерживали ${playerTerr}% территории. ` +
      "Ничья — это не победа, но и не поражение: позиция не дала шанса прорваться.",
  };
}

function buildStrengths(
  incidents: WarIncident[],
  result: string,
  playerMoves: Move[],
  hasCastled: boolean,
  developedCount: number,
): string[] {
  const strengths: string[] = [];

  if (hasCastled && !incidents.find((i) => i.type === "king_exposed")) {
    strengths.push("Грамотная защита короля — рокировка выполнена вовремя");
  }
  if (!incidents.find((i) => i.type === "early_queen")) {
    strengths.push("Дисциплина в дебюте — ферзь не выходил преждевременно");
  }
  if (developedCount >= 3) {
    strengths.push("Полное развёртывание армии в дебюте");
  }
  if (result === "win") {
    strengths.push("Финальная комбинация — вы нашли решающий манёвр");
  }
  if (playerMoves.some((m) => m.san?.includes("#"))) {
    strengths.push("Точный финиш — мат найден без лишних ходов");
  }
  if (playerMoves.some((m) => m.captured === "q")) {
    strengths.push("Вражеский ферзь сбит — серьёзный материальный успех");
  }

  return strengths.slice(0, 3);
}

function calculateXP(result: string, accuracy: number): number {
  const base = result === "win" ? 30 : result === "draw" ? 10 : 5;
  const accuracyBonus = accuracy > 80 ? 15 : accuracy > 65 ? 8 : 0;
  return base + accuracyBonus;
}

function calculateRatingDelta(result: string, accuracy: number): number {
  if (result === "win") return Math.round(15 + (accuracy - 70) * 0.3);
  if (result === "loss") return Math.round(-12 - (70 - accuracy) * 0.2);
  return 0;
}

function buildKeyMoments(
  verbose: Move[],
  hanging: HangingMove[],
  hasCastled: boolean,
  playerColor: "white" | "black",
): KeyMoment[] {
  const moments: KeyMoment[] = [];
  const isPlayerPly = (i: number) => (playerColor === "white" ? i % 2 === 0 : i % 2 === 1);

  verbose.forEach((m, i) => {
    if (!isPlayerPly(i)) return;
    if (m.san === "O-O" || m.san === "O-O-O") {
      moments.push({
        ply: i,
        moveNumber: Math.floor(i / 2) + 1,
        san: m.san,
        kind: "good",
        note: "Рокировка — командир в безопасности",
      });
    }
    if (m.captured && (m.captured === "q" || m.captured === "r")) {
      moments.push({
        ply: i,
        moveNumber: Math.floor(i / 2) + 1,
        san: m.san,
        kind: "good",
        note: `Захвачен(а) ${pieceNameAcc(m.captured)} соперника`,
      });
    }
    if (m.san.includes("#")) {
      moments.push({
        ply: i,
        moveNumber: Math.floor(i / 2) + 1,
        san: m.san,
        kind: "good",
        note: "Мат — захват штаба",
      });
    }
  });

  hanging.forEach((h) => {
    moments.push({
      ply: h.ply,
      moveNumber: Math.floor(h.ply / 2) + 1,
      san: verbose[h.ply]?.san ?? "?",
      kind: "bad",
      note: `Висячий боец: ${pieceNameAcc(h.piece)}`,
    });
  });

  moments.sort((a, b) => a.ply - b.ply);
  return moments.slice(0, 8);
}
