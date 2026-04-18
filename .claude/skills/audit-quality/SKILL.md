---
name: audit-quality
description: Run comprehensive quality audits on the codebase — theme tokens, accessibility, z-index, hydration safety, bundle size. Use /audit-quality to check for violations.
---

# Quality Audit

Run all project quality checks and report violations.

**Announce:** "Running quality audit..."

## Checks to Run

### 1. Theme Token Violations

Search for hardcoded Tailwind colors in production UI:

```bash
cd universal-app
grep -rn -E "(text|bg|border|ring)-(slate|gray|red|blue|green|amber|yellow|emerald|orange|pink|purple|indigo|cyan|teal|sky|violet|fuchsia|rose|lime|zinc|neutral|stone)-[0-9]+" \
  src/components/ src/app/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" | grep -v ".test." | grep -v "// branded"
```

Exceptions: `bg-slate-900` in AppShell sidebar (branded surface).

### 2. Missing motion-reduce

```bash
cd universal-app
grep -rn "animate-spin\|animate-pulse" src/ --include="*.tsx" \
  | grep -v "motion-reduce"
```

Every match is a violation.

### 3. Missing aria-labels on icon buttons

```bash
cd universal-app
grep -rn 'size="icon"' src/ --include="*.tsx" -A3 \
  | grep -v "aria-label"
```

### 4. Z-index violations

```bash
cd universal-app
grep -rn "z-\[" src/ --include="*.tsx" \
  | grep -v "z-\[40\]\|z-\[50\]\|z-\[60\]\|z-\[100\]"
```

Arbitrary z-index values should use `lib/z-index.ts` constants.

### 5. Hydration safety

```bash
cd universal-app
grep -rn "useNetworkStatus\|navigator\.onLine\|useLiveQuery\|indexedDB" src/ --include="*.tsx" -l
```

Each file should have the `isMounted` guard pattern.

### 6. Premium UI audit (existing script)

```bash
pnpm --filter universal-app audit:premium-ui
```

### 7. Build check

```bash
pnpm --filter universal-app build 2>&1 | tail -20
```

### 8. Lint check

```bash
pnpm --filter universal-app lint 2>&1 | tail -30
```

## Output Format

```
=== Quality Audit Report ===

Theme Tokens:     X violations (list top 5)
Motion-Reduce:    X violations
Aria-Labels:      X potential issues
Z-Index:          X arbitrary values
Hydration Safety: X files to check
Premium UI Audit: PASS/FAIL
Build:            PASS/FAIL
Lint:             X warnings, Y errors

Total issues: N
Priority fixes: [top 3 most impactful]
```

## After Audit

If violations are found, offer to:
1. Fix them automatically (for clear-cut cases like missing motion-reduce)
2. Create a plan for complex fixes
3. Add them as items for the next `/orchestrate` run
