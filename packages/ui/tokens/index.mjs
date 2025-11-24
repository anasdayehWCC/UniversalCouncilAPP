/**
 * Theme token definitions kept in JS so they can be consumed by both browser runtime and Node-based tests.
 *
 * @typedef {"theme-wcc" | "theme-rbkc" | "dark"} ThemeId
 */

/**
 * @type {Record<ThemeId, {background:string; surface:string; surfaceSubtle:string; text:string; mutedText:string; primary:string; onPrimary:string; accent:string; onAccent:string; focus:string; border:string;}>}
 */
export const themeTokens = {
  'theme-wcc': {
    background: '#f7f9fc',
    surface: '#ffffff',
    surfaceSubtle: '#eef2f7',
    text: '#0f172a',
    mutedText: '#475569',
    primary: '#004b65',
    onPrimary: '#ffffff',
    accent: '#3ba08d',
    onAccent: '#0b1220',
    focus: '#2563eb',
    border: '#d6dde7',
  },
  'theme-rbkc': {
    background: '#f6f8fb',
    surface: '#ffffff',
    surfaceSubtle: '#e9eef7',
    text: '#0f1526',
    mutedText: '#4b5563',
    primary: '#273971',
    onPrimary: '#ffffff',
    accent: '#6fa3d2',
    onAccent: '#0b1220',
    focus: '#2f57d9',
    border: '#d2daeb',
  },
  dark: {
    background: '#0f172a',
    surface: '#111827',
    surfaceSubtle: '#1f2937',
    text: '#e5e7eb',
    mutedText: '#9ca3af',
    primary: '#7ea8ff',
    onPrimary: '#0b1220',
    accent: '#67e8f9',
    onAccent: '#0b1220',
    focus: '#93c5fd',
    border: '#1f2937',
  },
};

export const getThemeForRole = (role) => {
  const palette = role === 'manager' ? themeTokens['theme-rbkc'] : themeTokens['theme-wcc'];
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
  };
};

/**
 * Apply tokens to CSS custom properties for the current document.
 * @param {ThemeId} theme
 */
export const applyThemeTokens = (theme) => {
  if (typeof document === 'undefined') return;
  const tokens = themeTokens[theme] ?? themeTokens['theme-wcc'];
  const root = document.documentElement;
  root.style.setProperty('--background', tokens.background);
  root.style.setProperty('--foreground', tokens.text);
  root.style.setProperty('--muted-foreground', tokens.mutedText);
  root.style.setProperty('--muted', tokens.surfaceSubtle);
  root.style.setProperty('--card', tokens.surface);
  root.style.setProperty('--card-foreground', tokens.text);
  root.style.setProperty('--popover', tokens.surface);
  root.style.setProperty('--popover-foreground', tokens.text);
  root.style.setProperty('--border', tokens.border);
  root.style.setProperty('--input', tokens.surfaceSubtle);
  root.style.setProperty('--ring', tokens.focus);
  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-foreground', tokens.onPrimary);
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--accent-foreground', tokens.onAccent);
  root.style.setProperty('--sidebar', tokens.surfaceSubtle);
  root.style.setProperty('--sidebar-foreground', tokens.text);
  root.style.setProperty('--sidebar-primary', tokens.primary);
  root.style.setProperty('--sidebar-primary-foreground', tokens.onPrimary);
  root.style.setProperty('--sidebar-border', tokens.border);
  root.style.setProperty('--sidebar-ring', tokens.focus);
};
