#!/usr/bin/env node
/**
 * Bundle Analysis Script
 * 
 * Analyzes Next.js build output and checks against size budgets.
 * Run with: npm run bundle-check
 */

const fs = require('fs');
const path = require('path');

// Size thresholds in KB
const THRESHOLDS = {
  // Main chunks
  'main': 250,
  'framework': 150,
  'radix': 100,
  'libs': 200,
  'commons': 100,
  
  // Route budgets
  'page:/': 50,          // Home page
  'page:/dashboard': 80, // Dashboard
  'page:/transcriptions': 100,
  'page:/minutes': 80,
  'page:/admin': 100,
  
  // Total budget
  'total-first-load': 500,
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function getStatusIcon(current, threshold) {
  const percentage = (current / threshold) * 100;
  if (percentage > 100) return `${colors.red}✗${colors.reset}`;
  if (percentage > 80) return `${colors.yellow}⚠${colors.reset}`;
  return `${colors.green}✓${colors.reset}`;
}

function getBuildManifest() {
  const manifestPath = path.join(process.cwd(), '.next', 'build-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`${colors.red}Error: Build manifest not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function getChunkSizes() {
  const staticDir = path.join(process.cwd(), '.next', 'static', 'chunks');
  const sizes = {};
  
  if (!fs.existsSync(staticDir)) {
    return sizes;
  }

  function scanDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDir(filePath, path.join(prefix, file));
      } else if (file.endsWith('.js')) {
        const key = path.join(prefix, file);
        sizes[key] = stat.size;
      }
    }
  }

  scanDir(staticDir);
  return sizes;
}

function categorizeChunks(sizes) {
  const categories = {
    framework: 0,
    radix: 0,
    libs: 0,
    commons: 0,
    pages: {},
    other: 0,
  };

  for (const [file, size] of Object.entries(sizes)) {
    if (file.includes('framework')) {
      categories.framework += size;
    } else if (file.includes('radix')) {
      categories.radix += size;
    } else if (file.includes('libs')) {
      categories.libs += size;
    } else if (file.includes('commons')) {
      categories.commons += size;
    } else if (file.includes('pages/') || file.includes('app/')) {
      const route = file.split('/').slice(-1)[0].replace('.js', '');
      categories.pages[route] = (categories.pages[route] || 0) + size;
    } else {
      categories.other += size;
    }
  }

  return categories;
}

function generateReport(sizes) {
  const categories = categorizeChunks(sizes);
  const totalSize = Object.values(sizes).reduce((a, b) => a + b, 0);
  
  console.log('\n' + colors.bold + colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + '              📦 Bundle Analysis Report              ' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════' + colors.reset + '\n');

  // Chunk categories
  console.log(colors.bold + '📊 Chunk Categories:' + colors.reset);
  console.log('─────────────────────────────────────────────────');
  
  const categoryRows = [
    ['Framework', categories.framework, THRESHOLDS.framework * 1024],
    ['Radix UI', categories.radix, THRESHOLDS.radix * 1024],
    ['Libraries', categories.libs, THRESHOLDS.libs * 1024],
    ['Commons', categories.commons, THRESHOLDS.commons * 1024],
    ['Other', categories.other, null],
  ];

  for (const [name, size, threshold] of categoryRows) {
    const sizeStr = formatBytes(size).padStart(12);
    if (threshold) {
      const icon = getStatusIcon(size, threshold);
      const thresholdStr = formatBytes(threshold);
      console.log(`  ${icon} ${name.padEnd(15)} ${sizeStr} / ${thresholdStr}`);
    } else {
      console.log(`    ${name.padEnd(15)} ${sizeStr}`);
    }
  }

  // Total
  console.log('─────────────────────────────────────────────────');
  const totalThreshold = THRESHOLDS['total-first-load'] * 1024;
  const totalIcon = getStatusIcon(totalSize, totalThreshold);
  console.log(`  ${totalIcon} ${'Total'.padEnd(15)} ${formatBytes(totalSize).padStart(12)} / ${formatBytes(totalThreshold)}`);

  // Largest chunks
  console.log('\n' + colors.bold + '📈 Largest Chunks:' + colors.reset);
  console.log('─────────────────────────────────────────────────');
  
  const sortedChunks = Object.entries(sizes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  for (const [file, size] of sortedChunks) {
    const shortName = file.length > 40 ? '...' + file.slice(-37) : file;
    console.log(`  ${shortName.padEnd(42)} ${formatBytes(size).padStart(10)}`);
  }

  // Summary
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
  
  const violations = [];
  if (categories.framework > THRESHOLDS.framework * 1024) violations.push('framework');
  if (categories.radix > THRESHOLDS.radix * 1024) violations.push('radix');
  if (categories.libs > THRESHOLDS.libs * 1024) violations.push('libs');
  if (totalSize > totalThreshold) violations.push('total');

  if (violations.length === 0) {
    console.log(`${colors.green}✓ All chunks within budget!${colors.reset}\n`);
    return { success: true, totalSize, violations: [] };
  } else {
    console.log(`${colors.red}✗ Budget exceeded for: ${violations.join(', ')}${colors.reset}\n`);
    return { success: false, totalSize, violations };
  }
}

function writeJsonReport(sizes, outputPath) {
  const categories = categorizeChunks(sizes);
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.values(sizes).reduce((a, b) => a + b, 0),
      categories,
      chunkCount: Object.keys(sizes).length,
    },
    thresholds: THRESHOLDS,
    chunks: sizes,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`${colors.blue}📄 JSON report saved to: ${outputPath}${colors.reset}\n`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const ciMode = args.includes('--ci');

  console.log(`${colors.blue}🔍 Analyzing bundle...${colors.reset}`);
  
  const sizes = getChunkSizes();
  
  if (Object.keys(sizes).length === 0) {
    console.error(`${colors.red}No chunks found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  const result = generateReport(sizes);

  if (outputJson) {
    const outputPath = path.join(process.cwd(), 'bundle-report.json');
    writeJsonReport(sizes, outputPath);
  }

  if (ciMode && !result.success) {
    process.exit(1);
  }
}

main();
