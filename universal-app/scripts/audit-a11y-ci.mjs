#!/usr/bin/env node
/**
 * Accessibility Audit Script (CI)
 *
 * Enforces three WCAG-related rules across all .tsx/.ts source files:
 *   1. No hardcoded Tailwind color classes — use CSS-variable tokens instead.
 *   2. Every `animate-spin` / `animate-pulse` must have `motion-reduce:animate-none`.
 *   3. Every `size="icon"` button must have an `aria-label`.
 *
 * Exit code 0  = all checks pass.
 * Exit code 1  = violations found (printed to stdout).
 *
 * Usage:  node scripts/audit-a11y-ci.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Root of the universal-app package (one level up from this script). */
const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

/** Directories under ROOT/src to scan. */
const SCAN_DIRS = ['src/components', 'src/app', 'src/lib', 'src/hooks', 'src/providers'];

/** File extensions to check. */
const EXTENSIONS = new Set(['.tsx', '.ts']);

/**
 * Paths (relative to ROOT) that are explicitly allowed to contain
 * hardcoded Tailwind color classes. These are intentional — typically
 * type-definition maps, branded surfaces, or dev/admin tooling that
 * is theme-aware via dark: variants.
 */
const HARDCODED_COLOR_ALLOWLIST = new Set([
  // --- Data-layer color maps (type definitions, configs) ---
  'src/lib/minutes/types.ts',
  'src/lib/domain/config.ts',
  'src/lib/workflow/types.ts',
  'src/components/a11y/AccessibleIcon.tsx',

  // --- Notification type-to-color mappings (include dark: variants) ---
  'src/components/notifications/NotificationItem.tsx',
  'src/components/notifications/NotificationPreferences.tsx',

  // --- Feature-flag admin tooling (internal dev surface) ---
  'src/components/features/FeatureGate.tsx',
  'src/components/features/FeatureToggle.tsx',
  'src/components/features/FeatureBadge.tsx',

  // --- Dev-only overlays ---
  'src/components/dev/PerformanceOverlay.tsx',

  // --- Branded / semantic status surfaces with dark: variants ---
  'src/components/domain/DomainGuard.tsx',
  'src/components/settings/SoundSettings.tsx',
  'src/components/Toast.tsx',
  'src/components/minutes/ActionItemList.tsx',
  'src/components/minutes/MinuteEditor.tsx',
  'src/app/minutes/[id]/components/MinuteInfoSidebar.tsx',
  'src/app/minutes/[id]/page.tsx',
  'src/app/minutes/page.tsx',
  'src/app/my-notes/[id]/page.tsx',
  'src/app/admin/templates/page.tsx',
  'src/app/admin/error.tsx',
  'src/app/record/page.tsx',
  'src/app/record/components/RecordingMetadata.tsx',
  'src/app/templates/page.tsx',
  'src/app/templates/[id]/page.tsx',

  // --- Review surfaces (border-slate with potential token migration) ---
  'src/components/review/PendingReviews.tsx',
  'src/components/review/ReviewFilters.tsx',
  'src/app/upload/page.tsx',
]);

/**
 * Files excluded entirely from all checks (test files, CSS, etc.).
 * Matched by substring against the relative path.
 */
const EXCLUDED_PATTERNS = [
  '/tests/',
  '/__tests__/',
  '.test.',
  '.spec.',
  'globals.css',
];

// ---------------------------------------------------------------------------
// Color patterns
// ---------------------------------------------------------------------------

const HARDCODED_COLOR_RE = new RegExp(
  '(?:text|bg)-(?:' +
    'slate|blue|green|red|amber|yellow|gray|emerald' +
  ')-\\d+',
  'g',
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function walk(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (EXTENSIONS.has(entry.slice(entry.lastIndexOf('.')))) {
      results.push(full);
    }
  }
  return results;
}

function isExcluded(relPath) {
  return EXCLUDED_PATTERNS.some((pat) => relPath.includes(pat));
}

function isColorAllowlisted(relPath) {
  return HARDCODED_COLOR_ALLOWLIST.has(relPath);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/**
 * @typedef {{ file: string, line: number, text: string, rule: string }} Violation
 */

/** Check 1: hardcoded Tailwind color classes. */
function checkHardcodedColors(relPath, lines) {
  if (isColorAllowlisted(relPath)) return [];
  /** @type {Violation[]} */
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comment-only lines
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    const matches = line.match(HARDCODED_COLOR_RE);
    if (matches) {
      violations.push({
        file: relPath,
        line: i + 1,
        text: line.trim(),
        rule: `hardcoded-color: ${matches.join(', ')}`,
      });
    }
  }
  return violations;
}

/** Check 2: animate-spin / animate-pulse without motion-reduce:animate-none. */
function checkMotionReduce(relPath, lines) {
  /** @type {Violation[]} */
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comment-only lines
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    const hasAnimation =
      line.includes('animate-spin') || line.includes('animate-pulse');
    if (!hasAnimation) continue;
    // CSS variable definitions (e.g. in globals.css or tailwind config) are not violations
    if (line.includes('--animate-pulse') || line.includes('--animate-spin')) continue;
    if (!line.includes('motion-reduce:animate-none')) {
      violations.push({
        file: relPath,
        line: i + 1,
        text: line.trim(),
        rule: 'missing-motion-reduce',
      });
    }
  }
  return violations;
}

/** Check 3: size="icon" buttons without aria-label. */
function checkIconButtons(relPath, lines) {
  /** @type {Violation[]} */
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('size="icon"') && !line.includes("size='icon'")) continue;
    // Look at surrounding lines for aria-label (JSX props often span multiple lines).
    // Check a window of lines around the size="icon" for the enclosing JSX element.
    const windowStart = Math.max(0, i - 5);
    const windowEnd = Math.min(lines.length - 1, i + 5);
    const window = lines.slice(windowStart, windowEnd + 1).join('\n');

    // Check if aria-label exists in the element's prop span
    const hasAriaLabel =
      window.includes('aria-label=') || window.includes('aria-label:');

    if (!hasAriaLabel) {
      violations.push({
        file: relPath,
        line: i + 1,
        text: line.trim(),
        rule: 'icon-button-missing-aria-label',
      });
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(`${colors.bold}Accessibility Audit${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);

  const filesToScan = [];
  for (const dir of SCAN_DIRS) {
    const fullDir = join(ROOT, dir);
    filesToScan.push(...walk(fullDir));
  }

  let totalFiles = 0;
  /** @type {Violation[]} */
  const allViolations = [];

  for (const absPath of filesToScan) {
    const relPath = relative(ROOT, absPath);
    if (isExcluded(relPath)) continue;
    totalFiles++;

    const content = readFileSync(absPath, 'utf8');
    const lines = content.split('\n');

    allViolations.push(
      ...checkHardcodedColors(relPath, lines),
      ...checkMotionReduce(relPath, lines),
      ...checkIconButtons(relPath, lines),
    );
  }

  // Group violations by rule
  const byRule = {};
  for (const v of allViolations) {
    (byRule[v.rule] ??= []).push(v);
  }

  // Print violations
  if (allViolations.length === 0) {
    console.log(
      `${colors.green}${colors.bold}All checks passed!${colors.reset}`,
    );
    console.log(`Scanned ${totalFiles} files. No violations found.\n`);
    console.log('Checks performed:');
    console.log('  1. No hardcoded Tailwind color classes');
    console.log('  2. All animations have motion-reduce:animate-none');
    console.log('  3. All icon buttons have aria-label');
    process.exit(0);
  }

  // Print by rule
  for (const [rule, violations] of Object.entries(byRule)) {
    const uniqueFiles = new Set(violations.map((v) => v.file));
    console.log(
      `${colors.red}${colors.bold}[${rule}]${colors.reset} ${violations.length} violation(s) in ${uniqueFiles.size} file(s):\n`,
    );
    for (const v of violations) {
      console.log(
        `  ${colors.cyan}${v.file}:${v.line}${colors.reset}`,
      );
      console.log(`    ${colors.dim}${v.text}${colors.reset}\n`);
    }
  }

  // Summary
  const uniqueFiles = new Set(allViolations.map((v) => v.file));
  console.log(`${'='.repeat(60)}`);
  console.log(
    `${colors.red}${colors.bold}${allViolations.length} violation(s) found across ${uniqueFiles.size} file(s)${colors.reset} (scanned ${totalFiles} files)`,
  );
  console.log(
    `\n${colors.yellow}Fix violations or add intentional exceptions to the allowlist in this script.${colors.reset}\n`,
  );
  process.exit(1);
}

main();
