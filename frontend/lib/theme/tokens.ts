import { applyThemeTokens, themeTokens } from "./tokens.mjs"

export type Role = "social_worker" | "manager" | "admin"
export type Domain = "childrens" | "adults" | "housing" | "transport" | string

export { applyThemeTokens, themeTokens }

export const getThemeForRole = (role: Role) => {
  const palette = role === "manager" ? themeTokens["theme-rbkc"] : themeTokens["theme-wcc"]
  return {
    colors: {
      background: palette.background,
      foreground: palette.text,
      mutedForeground: palette.mutedText,
      primary: palette.primary,
      primaryForeground: palette.onPrimary,
      accent: palette.accent,
      accentForeground: palette.onAccent,
      border: palette.border,
      card: palette.surface,
      cardForeground: palette.text,
    },
  }
}
