/**
 * Design tokens for ask Elon — "alabaster & obsidian" palette.
 *
 * Source of truth: the visual specification (askElon.ais.181127.v6).
 * Two themes are supported: Light (default) and Dark. Every screen reads colours
 * through the `colors` proxy and builds its StyleSheet with `createThemedStyles`,
 * so switching the theme repaints the whole app without a reload.
 */

import { StyleSheet } from "react-native";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export type ThemeMode = "light" | "dark" | "system";

export type Palette = {
  /* Surfaces */
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  surfaceInverse: string;
  onSurface: string;
  onSurfaceSecondary: string;
  onSurfaceTertiary: string;
  onSurfaceInverse: string;

  /* Brand */
  brand: string;
  onBrand: string;
  brandPrimary: string;
  brandSecondary: string;
  brandTertiary: string;
  brandSoft: string;
  onBrandSoft: string;

  /* Accent (warm apricot / soft amber) */
  accent: string;
  accentText: string;
  onAccent: string;
  accentSoft: string;

  /* Chat bubbles */
  bubbleUser: string;
  onBubbleUser: string;
  bubbleBot: string;
  onBubbleBot: string;
  watermark: string;

  /* Status */
  success: string;
  successSoft: string;
  onSuccessSoft: string;
  warning: string;
  warningSoft: string;
  onWarningSoft: string;
  error: string;
  errorSoft: string;
  onErrorSoft: string;

  /* Lines & text */
  border: string;
  borderStrong: string;
  divider: string;
  muted: string;
  placeholder: string;

  /* Chrome */
  glass: string;
  overlay: string;
  logoBadge: string;
  logoBadgeBorder: string;
  paper: string;
  shadow: string;
  statusBar: "light" | "dark";
};

export const lightColors: Palette = {
  surface: "#F8FAFC",
  surfaceSecondary: "#FFFFFF",
  surfaceTertiary: "#EEF5F2",
  surfaceInverse: "#141B23",
  onSurface: "#1E293B",
  onSurfaceSecondary: "#1E293B",
  onSurfaceTertiary: "#2E6F57",
  onSurfaceInverse: "#F1F5F9",

  brand: "#2E6F57",
  onBrand: "#FFFFFF",
  brandPrimary: "#2E6F57",
  brandSecondary: "#162C28",
  brandTertiary: "#F59E42",
  brandSoft: "#DCECE6",
  onBrandSoft: "#1F4E3D",

  accent: "#F59E42",
  accentText: "#A85E12",
  onAccent: "#141B23",
  accentSoft: "#FDE6CE",

  bubbleUser: "#DCECE6",
  onBubbleUser: "#1F4E3D",
  bubbleBot: "#FFFFFF",
  onBubbleBot: "#1E293B",
  watermark: "#2E6F57",

  success: "#2E6F57",
  successSoft: "#E3F2EC",
  onSuccessSoft: "#1F4E3D",
  warning: "#C2761C",
  warningSoft: "#FDF1E3",
  onWarningSoft: "#9A4D06",
  error: "#B4453A",
  errorSoft: "#FBE9E6",
  onErrorSoft: "#8F3227",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#E2E8F0",
  muted: "#64748B",
  placeholder: "#94A3B8",

  glass: "rgba(248, 250, 252, 0.92)",
  overlay: "rgba(20, 27, 35, 0.45)",
  logoBadge: "#FDE6CE",
  logoBadgeBorder: "#F8D3AC",
  paper: "#FFFFFF",
  shadow: "#162C28",
  statusBar: "dark",
};

export const darkColors: Palette = {
  surface: "#141B23",
  surfaceSecondary: "#1E2732",
  surfaceTertiary: "#162C28",
  surfaceInverse: "#F1F5F9",
  onSurface: "#F1F5F9",
  onSurfaceSecondary: "#F1F5F9",
  onSurfaceTertiary: "#52B798",
  onSurfaceInverse: "#141B23",

  brand: "#52B798",
  onBrand: "#0F1A20",
  brandPrimary: "#52B798",
  brandSecondary: "#162C28",
  brandTertiary: "#FBB063",
  brandSoft: "#1F4E3D",
  onBrandSoft: "#DCECE6",

  accent: "#FBB063",
  accentText: "#FBB063",
  onAccent: "#141B23",
  accentSoft: "#3A2E25",

  bubbleUser: "#1F4E3D",
  onBubbleUser: "#EAF6F1",
  bubbleBot: "#232E3C",
  onBubbleBot: "#F1F5F9",
  watermark: "#52B798",

  success: "#52B798",
  successSoft: "#1B3A31",
  onSuccessSoft: "#9FE0C6",
  warning: "#FBB063",
  warningSoft: "#3A2E25",
  onWarningSoft: "#FBB063",
  error: "#E8836F",
  errorSoft: "#3A2622",
  onErrorSoft: "#F2B3A6",

  border: "#2C3847",
  borderStrong: "#3B4A5C",
  divider: "#2C3847",
  muted: "#94A3B8",
  placeholder: "#6B7C8F",

  glass: "rgba(20, 27, 35, 0.92)",
  overlay: "rgba(0, 0, 0, 0.6)",
  logoBadge: "#3A2E25",
  logoBadgeBorder: "#4A3A2C",
  paper: "#1E2732",
  shadow: "#000000",
  statusBar: "light",
};

let activePalette: Palette = lightColors;
let paletteVersion = 0;

/** Called by AppProvider whenever the resolved theme changes. */
export function setActiveTheme(mode: "light" | "dark"): void {
  const next = mode === "dark" ? darkColors : lightColors;
  if (next === activePalette) return;
  activePalette = next;
  paletteVersion += 1;
}

export function getPalette(): Palette {
  return activePalette;
}

/**
 * Live colour lookup. JSX reads (`color={colors.brand}`) always resolve against
 * the palette that is active right now, so no screen needs a theme prop.
 */
export const colors: Palette = new Proxy({} as Palette, {
  get: (_target, prop: string) => (activePalette as unknown as Record<string, unknown>)[prop],
  has: (_target, prop: string) => prop in activePalette,
  ownKeys: () => Reflect.ownKeys(activePalette),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

/**
 * Drop-in replacement for `StyleSheet.create` that rebuilds the sheet when the
 * palette changes. Styles are built lazily on first access and cached per
 * palette version, so switching themes costs one rebuild per screen.
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  factory: () => T & NamedStyles<any>
): T {
  let cache: T | undefined;
  let cacheVersion = -1;

  const build = (): T => {
    if (!cache || cacheVersion !== paletteVersion) {
      cache = StyleSheet.create(factory());
      cacheVersion = paletteVersion;
    }
    return cache;
  };

  return new Proxy({} as T, {
    get: (_target, prop: string) => (build() as unknown as Record<string, unknown>)[prop],
    has: (_target, prop: string) => prop in build(),
    ownKeys: () => Reflect.ownKeys(build()),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Plus Jakarta Sans is loaded in the root layout; the fallbacks keep the app
 * readable during the first frame and on platforms where the font is missing.
 */
export const fontFamily = {
  regular: "PlusJakartaSans_400Regular",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
  mono: "DMMono_500Medium",
} as const;

export const typography = {
  display: { fontSize: 28, fontFamily: fontFamily.extrabold, fontWeight: "800" as const },
  title: { fontSize: 24, fontFamily: fontFamily.bold, fontWeight: "700" as const },
  heading: { fontSize: 20, fontFamily: fontFamily.bold, fontWeight: "700" as const },
  body: { fontSize: 16, fontFamily: fontFamily.regular, fontWeight: "400" as const },
  base: { fontSize: 14, fontFamily: fontFamily.regular, fontWeight: "400" as const },
  sm: { fontSize: 12, fontFamily: fontFamily.semibold, fontWeight: "500" as const },
  label: { fontSize: 12, fontFamily: fontFamily.semibold, fontWeight: "600" as const },
} as const;

/** Minimum 44pt touch target per iOS HIG; 48pt for primary actions. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH = 44;
export const ACTION_HEIGHT = 48;
