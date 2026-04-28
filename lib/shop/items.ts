export type ShopCategory = "consumable" | "skin" | "avatar" | "boost";

export interface ShopItem {
  key: string;
  title: string;
  description: string;
  price: number;
  category: ShopCategory;
  icon: string; // lucide icon name
  consumable?: boolean;
  preview?: { dark: string; light: string }; // for board skins
}

export const SHOP_ITEMS: ShopItem[] = [
  // Consumables
  {
    key: "hint_token",
    title: "Подсказка командира",
    description: "Один токен = одна подсказка лучшего хода в одиночной партии. Расходуется при использовании.",
    price: 50,
    category: "consumable",
    icon: "Lightbulb",
    consumable: true,
  },
  {
    key: "insurance",
    title: "Страховка матча",
    description: "При поражении в матче с дуэлью возвращает 50% дукатов. Расходуется на одну партию.",
    price: 100,
    category: "consumable",
    icon: "Shield",
    consumable: true,
  },

  // Boosts
  {
    key: "xp_boost",
    title: "XP Buster",
    description: "×1.5 к XP в следующих 5 партиях. Помогает быстрее перейти на новое звание.",
    price: 200,
    category: "boost",
    icon: "Zap",
    consumable: true,
  },

  // Skins
  {
    key: "skin_classic",
    title: "Classic",
    description: "Стандартный синий стиль доски. Включён по умолчанию.",
    price: 0,
    category: "skin",
    icon: "Square",
    preview: { dark: "#28324A", light: "#3B4A6E" },
  },
  {
    key: "skin_neon",
    title: "Neon Strike",
    description: "Тёмная палитра с неоновым отливом — для ночных кампаний.",
    price: 250,
    category: "skin",
    icon: "Square",
    preview: { dark: "#1A0F2E", light: "#2D1B4E" },
  },
  {
    key: "skin_royal",
    title: "Royal Gold",
    description: "Бордово-золотая доска для генералов с амбициями.",
    price: 500,
    category: "skin",
    icon: "Crown",
    preview: { dark: "#4A1F1F", light: "#7A3A2E" },
  },
  {
    key: "skin_obsidian",
    title: "Obsidian",
    description: "Глубокий обсидиан — клетки почти сливаются. Только для опытных.",
    price: 750,
    category: "skin",
    icon: "Square",
    preview: { dark: "#0E0E12", light: "#1F1F26" },
  },

  // Avatar
  {
    key: "avatar_general",
    title: "Генерал",
    description: "Эксклюзивный аватар с золотой каймой для кошелька профиля.",
    price: 300,
    category: "avatar",
    icon: "Crown",
  },

  // Siege rare card unlocks
  {
    key: "card_shield_unlock",
    title: "🛡 Карта Щит",
    description: "Разблокирует редкую карту Щит в Siege Mode. Защищает выбранную фигуру от взятия на 1 ход.",
    price: 150,
    category: "boost",
    icon: "Shield",
  },
  {
    key: "card_coronation_unlock",
    title: "👑 Карта Коронация",
    description: "Разблокирует редкую карту Коронация в Siege Mode. Превращает любую твою пешку в ферзя мгновенно.",
    price: 150,
    category: "boost",
    icon: "Crown",
  },
];

export function getItem(key: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.key === key);
}
