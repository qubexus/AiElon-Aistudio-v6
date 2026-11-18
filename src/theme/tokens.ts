/**
 * Design tokens derived from design_guidelines.json ("UNION Elon", iOS-native clean).
 * Light theme only. Single source of truth for colors, spacing, radii and typography.
 */

export const colors = {
  surface: "#FBF8F3",
  onSurface: "#0F1A24",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#0F1A24",
  surfaceTertiary: "#F6F3EC",
  onSurfaceTertiary: "#132B41",
  surfaceInverse: "#0F1A24",
  onSurfaceInverse: "#FFFFFF",

  brand: "#1D4F3C",
  onBrand: "#FFFFFF",
  brandPrimary: "#1D4F3C",
  brandSecondary: "#132B41",
  brandTertiary: "#F97316",

  success: "#10B981",
  warning: "#D97706",
  error: "#EF4444",

  border: "#E6E1D6",
  borderStrong: "#D1D5DB",
  divider: "#E6E1D6",
  muted: "#526B7A",

  /** Translucent header/tab-bar fill (glassmorphism: header + tab bar only). */
  glass: "rgba(251, 248, 243, 0.86)",
  overlay: "rgba(15, 26, 36, 0.45)",
} as const;

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
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "700" },
  heading: { fontSize: 20, fontWeight: "600" },
  body: { fontSize: 16, fontWeight: "400" },
  base: { fontSize: 14, fontWeight: "400" },
  sm: { fontSize: 12, fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "600" },
} as const;

/** Minimum 44pt touch target per iOS HIG. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH = 44;
