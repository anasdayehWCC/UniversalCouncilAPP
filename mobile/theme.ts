import type { ThemeId } from "../frontend/lib/theme/tokens.mjs"

let sharedTokens: any
try {
  // Reuse shared tokens from web; Metro may require extra config if bundling in RN.
  // For now we import directly for parity; fall back to local copy if unavailable.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sharedTokens = require("../frontend/lib/theme/tokens.mjs").themeTokens
} catch (err) {
  sharedTokens = {
    "theme-wcc": {
      background: "#f7f9fc",
      surface: "#ffffff",
      surfaceSubtle: "#eef2f7",
      text: "#0f172a",
      mutedText: "#475569",
      primary: "#004b65",
      onPrimary: "#0b1220",
      accent: "#3ba08d",
      onAccent: "#0b1220",
      focus: "#2563eb",
      border: "#d6dde7",
    },
  }
}

export const getThemeTokens = (id: ThemeId | "theme-wcc" | "dark" = "theme-wcc") =>
  sharedTokens[id] ?? sharedTokens["theme-wcc"]
