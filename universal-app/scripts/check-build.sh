#!/bin/bash
#
# Local build check script for Universal App
# Run this before pushing to ensure CI will pass
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Universal App - Local Build Check          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Track failures
FAILURES=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    
    echo -e "${YELLOW}▶ Running: ${name}${NC}"
    echo "  Command: $command"
    echo ""
    
    if eval "$command"; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
        echo ""
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        echo ""
        ((FAILURES++))
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found${NC}"
    echo "Please run this script from the universal-app directory"
    exit 1
fi

# Check Node.js version
echo -e "${BLUE}📋 Environment Check${NC}"
echo "  Node.js: $(node --version)"
echo "  pnpm: $(pnpm --version 2>/dev/null || echo 'not installed')"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    echo ""
fi

# Run checks
echo -e "${BLUE}🔍 Running Checks${NC}"
echo ""

# 1. Lint check
run_check "ESLint" "pnpm lint"

# 2. TypeScript type check
run_check "TypeScript" "pnpm exec tsc --noEmit"

# 3. Build
run_check "Build" "pnpm build"

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Summary                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to push.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ${FAILURES} check(s) failed. Please fix before pushing.${NC}"
    echo ""
    exit 1
fi
