#!/bin/bash

# Pre-commit hook that ensures tests and builds pass
# This script runs before every commit and will fail if checks don't pass

set -e  # Exit on any error

echo "?? Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo -e "${RED}? Error: bun is not installed${NC}"
    exit 1
fi

# Step 1: Run lint with auto-fix
echo -e "${YELLOW}?? Step 1/3: Running linter (with auto-fix)...${NC}"
if ! bun run lint:fix; then
    echo -e "${RED}? Linting failed. Please fix the errors above.${NC}"
    echo -e "${YELLOW}?? Tip: Run 'bun run pre-commit:fix' to see detailed errors${NC}"
    exit 1
fi

# Step 2: Run type checking
echo -e "${YELLOW}?? Step 2/3: Running type check...${NC}"
if ! bun run type-check; then
    echo -e "${RED}? Type checking failed. Please fix the errors above.${NC}"
    echo -e "${YELLOW}?? Tip: Run 'bun run pre-commit:fix' to see detailed errors${NC}"
    exit 1
fi

# Step 3: Run build
echo -e "${YELLOW}???  Step 3/3: Running build...${NC}"
if ! bun run build; then
    echo -e "${RED}? Build failed. Please fix the errors above.${NC}"
    echo -e "${YELLOW}?? Tip: Run 'bun run pre-commit:fix' to see detailed errors${NC}"
    exit 1
fi

echo -e "${GREEN}? All pre-commit checks passed!${NC}"
exit 0
