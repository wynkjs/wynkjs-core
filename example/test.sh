#!/bin/bash

# WynkJS Example Test Runner
# Runs all test cases in the example folder

set -e  # Exit on error

echo "======================================"
echo "🧪 WynkJS Example Test Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Error: Bun is not installed${NC}"
    echo "Please install Bun: https://bun.sh"
    exit 1
fi

echo -e "${BLUE}📦 Running all example tests...${NC}"
echo ""

# Run all tests
bun test

# Capture exit code
TEST_EXIT_CODE=$?

echo ""
echo "======================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo ""
    echo -e "${YELLOW}Note: Auth E2E tests require the server to be running${NC}"
    echo -e "${YELLOW}To run auth tests:${NC}"
    echo -e "${YELLOW}  1. Start server: bun run src/index.ts${NC}"
    echo -e "${YELLOW}  2. Run auth tests: bun test test/e2e/auth.test.ts${NC}"
fi
echo "======================================"

exit $TEST_EXIT_CODE
