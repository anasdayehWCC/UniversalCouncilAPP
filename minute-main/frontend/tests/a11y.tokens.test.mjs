import assert from "node:assert";
import { themeTokens } from "../lib/theme/tokens.mjs";

const toRgb = (hex) => {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b];
};

const relLuminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (fg, bg) => {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
};

for (const [themeId, tokens] of Object.entries(themeTokens)) {
  const cases = [
    ["text on background", tokens.text, tokens.background],
    ["mutedText on surface", tokens.mutedText, tokens.surface],
    ["onPrimary on primary", tokens.onPrimary, tokens.primary],
    ["onAccent on accent", tokens.onAccent, tokens.accent],
  ];

  for (const [label, fg, bg] of cases) {
    const ratio = contrast(fg, bg);
    assert.ok(
      ratio >= 4.5,
      `Contrast for ${label} in ${themeId} is ${ratio.toFixed(2)} (<4.5). fg=${fg} bg=${bg}`
    );
  }
}
