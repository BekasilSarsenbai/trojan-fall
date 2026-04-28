export type CardKey = "berserk" | "lightning" | "shield" | "coronation";
export type CardRarity = "base" | "rare";

export interface CardDef {
  key: CardKey;
  rarity: CardRarity;
  emoji: string;
  title: string;
  short: string;
  description: string;
  unlockKey?: "card_shield_unlock" | "card_coronation_unlock";
  unlockPrice?: number;
}

export const CARDS: Record<CardKey, CardDef> = {
  berserk: {
    key: "berserk",
    rarity: "base",
    emoji: "⚡",
    title: "Берсерк",
    short: "+1 ход",
    description:
      "Сделай ход. После него получи ещё один ход другой фигурой. Затем ход переходит сопернику.",
  },
  lightning: {
    key: "lightning",
    rarity: "base",
    emoji: "💥",
    title: "Молния",
    short: "Удар",
    description:
      "Целься в любую фигуру противника (кроме короля) — она исчезает с доски. Это твой ход.",
  },
  shield: {
    key: "shield",
    rarity: "rare",
    emoji: "🛡",
    title: "Щит",
    short: "Защита",
    description:
      "Выбери свою фигуру — на следующий ход она неуязвима. Соперник не может её взять.",
    unlockKey: "card_shield_unlock",
    unlockPrice: 150,
  },
  coronation: {
    key: "coronation",
    rarity: "rare",
    emoji: "👑",
    title: "Коронация",
    short: "Превр.",
    description:
      "Выбери свою пешку — она мгновенно превращается в ферзя на текущем поле. Это твой ход.",
    unlockKey: "card_coronation_unlock",
    unlockPrice: 150,
  },
};

export const CARD_LIST: CardDef[] = ["berserk", "lightning", "shield", "coronation"].map(
  (k) => CARDS[k as CardKey],
);

export type CardActionMode = null | "lightning_target" | "shield_select" | "coronation_select" | "berserk_extra";

export interface ActiveCardState {
  active: CardKey | null;
  mode: CardActionMode;
}

export const INITIAL_CARD_STATE: ActiveCardState = { active: null, mode: null };
