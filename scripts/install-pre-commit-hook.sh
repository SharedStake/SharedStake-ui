#!/bin/bash

# Setup script to install git pre-commit hook
# This ensures the hook is installed after cloning or when dependencies are installed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOK_SOURCE="$PROJECT_ROOT/scripts/pre-commit-check.sh"
HOOK_TARGET="$PROJECT_ROOT/.git/hooks/pre-commit"

echo "?? Installing git pre-commit hook..."

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "??  Warning: .git directory not found. Skipping hook installation."
    echo "   This is normal if you're not in a git repository."
    exit 0
fi

# Check if hook source exists
if [ ! -f "$HOOK_SOURCE" ]; then
    echo "? Error: Hook source not found at $HOOK_SOURCE"
    exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/.git/hooks"

# Copy hook script
cp "$HOOK_SOURCE" "$HOOK_TARGET"
chmod +x "$HOOK_TARGET"

echo "? Pre-commit hook installed successfully!"
echo "   The hook will automatically run before each commit."
echo "   Run 'bun run pre-commit' to test manually."
echo "   Run 'bun run pre-commit:fix' if checks fail."
