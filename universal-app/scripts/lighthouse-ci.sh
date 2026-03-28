#!/bin/bash
#
# Local Lighthouse CI script for Universal App
# Runs Lighthouse audits against a local or remote URL
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
URL="${1:-http://localhost:3000}"
OUTPUT_DIR="./lighthouse-reports"
CATEGORIES="performance,accessibility,best-practices,seo"

# Print header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Universal App - Lighthouse CI              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}Installing Lighthouse CLI...${NC}"
    npm install -g lighthouse
fi

# Check if the URL is accessible
echo -e "${BLUE}🔍 Checking URL: ${URL}${NC}"
if ! curl -s --head "$URL" | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${RED}Error: URL ${URL} is not accessible${NC}"
    echo ""
    echo "Options:"
    echo "  1. Start the dev server: pnpm dev"
    echo "  2. Build and start: pnpm build && pnpm start"
    echo "  3. Provide a different URL: ./scripts/lighthouse-ci.sh https://your-url.com"
    echo ""
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_NAME="lighthouse_${TIMESTAMP}"

echo -e "${YELLOW}▶ Running Lighthouse audit...${NC}"
echo "  URL: $URL"
echo "  Categories: $CATEGORIES"
echo "  Output: ${OUTPUT_DIR}/${REPORT_NAME}"
echo ""

# Run Lighthouse
lighthouse "$URL" \
    --output=html,json \
    --output-path="${OUTPUT_DIR}/${REPORT_NAME}" \
    --only-categories="$CATEGORIES" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --quiet

# Parse results
JSON_FILE="${OUTPUT_DIR}/${REPORT_NAME}.report.json"

if [ -f "$JSON_FILE" ]; then
    echo ""
    echo -e "${BLUE}📊 Results Summary${NC}"
    echo ""
    
    # Extract scores using node
    node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('$JSON_FILE'));
        const cats = report.categories;
        
        const formatScore = (score) => {
            const pct = Math.round(score * 100);
            const emoji = pct >= 90 ? '🟢' : pct >= 50 ? '🟡' : '🔴';
            return emoji + ' ' + pct;
        };
        
        console.log('  Performance:     ' + formatScore(cats.performance.score));
        console.log('  Accessibility:   ' + formatScore(cats.accessibility.score));
        console.log('  Best Practices:  ' + formatScore(cats['best-practices'].score));
        console.log('  SEO:             ' + formatScore(cats.seo.score));
    "
    
    echo ""
    echo -e "${GREEN}✅ Report saved to: ${OUTPUT_DIR}/${REPORT_NAME}.report.html${NC}"
    echo ""
    
    # Check against budgets
    echo -e "${BLUE}📋 Performance Budget Check${NC}"
    echo ""
    
    node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('$JSON_FILE'));
        const cats = report.categories;
        
        const budgets = {
            performance: 80,
            accessibility: 90,
            'best-practices': 90,
            seo: 90
        };
        
        let passed = true;
        
        for (const [key, budget] of Object.entries(budgets)) {
            const score = Math.round(cats[key].score * 100);
            if (score < budget) {
                console.log('  ❌ ' + key + ': ' + score + ' (budget: ' + budget + ')');
                passed = false;
            } else {
                console.log('  ✅ ' + key + ': ' + score + ' (budget: ' + budget + ')');
            }
        }
        
        process.exit(passed ? 0 : 1);
    " || {
        echo ""
        echo -e "${YELLOW}⚠️  Some metrics are below budget${NC}"
    }
    
else
    echo -e "${RED}Error: Report generation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  - Open the HTML report in a browser for detailed analysis"
echo "  - Compare reports over time to track improvements"
echo "  - Focus on Core Web Vitals: LCP, FID, CLS"
echo ""
