export interface BoardSkin {
  key: string;
  light: string;
  dark: string;
  glowBlue: string;
  glowRed: string;
}

export const BOARD_SKINS: Record<string, BoardSkin> = {
  skin_classic: {
    key: "skin_classic",
    light: "#3B4A6E",
    dark: "#28324A",
    glowBlue: "rgba(61, 168, 255, 0.25)",
    glowRed: "rgba(255, 61, 90, 0.12)",
  },
  skin_neon: {
    key: "skin_neon",
    light: "#2D1B4E",
    dark: "#1A0F2E",
    glowBlue: "rgba(157, 77, 255, 0.32)",
    glowRed: "rgba(255, 61, 90, 0.18)",
  },
  skin_royal: {
    key: "skin_royal",
    light: "#7A3A2E",
    dark: "#4A1F1F",
    glowBlue: "rgba(245, 197, 66, 0.28)",
    glowRed: "rgba(255, 61, 90, 0.18)",
  },
  skin_obsidian: {
    key: "skin_obsidian",
    light: "#1F1F26",
    dark: "#0E0E12",
    glowBlue: "rgba(255, 255, 255, 0.18)",
    glowRed: "rgba(255, 61, 90, 0.10)",
  },
};

export function getSkin(key?: string): BoardSkin {
  return BOARD_SKINS[key ?? "skin_classic"] ?? BOARD_SKINS.skin_classic;
}
