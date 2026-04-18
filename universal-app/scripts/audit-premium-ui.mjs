import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const TARGETS = [
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/app/templates/page.tsx',
  'src/app/review-queue/page.tsx',
  'src/app/record/page.tsx',
  'src/app/my-notes/[id]/page.tsx',
  'src/app/insights/page.tsx',
  'src/components/layout/AppShell.tsx',
  'src/components/layout/ShellPage.tsx',
  'src/components/AIEditSidebar.tsx',
  'src/components/templates/TemplateSelector.tsx',
  'src/components/ResilienceBanner.tsx',
  'src/components/ConnectivityIndicator.tsx',
];

const RULES = [
  {
    id: 'browser-native-dialogs',
    description: 'Do not use browser-native alert/confirm prompts in premium UI flows.',
    regex: /^(?!\s*\/\/).*?\b(?:alert|confirm)\s*\(/,
  },
  {
    id: 'arbitrary-z-index',
    description: 'Use the shared z-index scale instead of arbitrary z-[...] utilities.',
    regex: /z-\[\d+\]/,
  },
  {
    id: 'fixed-right-rail',
    description: 'Avoid fixed right rails; inspector panels must dock through the shell.',
    regex: /fixed right-0|right-0 fixed/,
  },
  {
    id: 'raw-neutral-color',
    description: 'Avoid raw gray/slate utilities in shared premium UI surfaces.',
    regex: /\b(?:bg|text|border)-(?:gray|slate)-\d{2,3}\b/,
  },
  {
    id: 'raw-status-color',
    description: 'Avoid raw red/amber/emerald utilities in shared premium UI surfaces.',
    regex: /\b(?:bg|text|border)-(?:red|amber|emerald)-\d{2,3}\b/,
  },
];

const ALLOWLIST = [
  {
    file: 'src/components/layout/AppShell.tsx',
    regex: /bg-slate-900/,
    reason: 'AppShell sidebar remains an intentional branded dark surface.',
  },
];

function isAllowed(file, line) {
  return ALLOWLIST.some((entry) => entry.file === file && entry.regex.test(line));
}

const findings = [];

for (const relativeFile of TARGETS) {
  const absoluteFile = path.join(ROOT, relativeFile);
  const contents = await readFile(absoluteFile, 'utf8');
  const lines = contents.split('\n');

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.regex.test(line) && !isAllowed(relativeFile, line)) {
        findings.push({
          file: relativeFile,
          line: index + 1,
          rule: rule.id,
          description: rule.description,
          snippet: line.trim(),
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('\nPremium UI audit failed.\n');
  for (const finding of findings) {
    console.error(
      `- ${finding.file}:${finding.line} [${finding.rule}] ${finding.description}\n  ${finding.snippet}\n`
    );
  }
  process.exit(1);
}

console.log('Premium UI audit passed.');
