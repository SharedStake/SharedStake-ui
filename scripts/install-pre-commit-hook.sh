#!/bin/bash

# Simple script to install git pre-commit hook
# Copies the hook script to .git/hooks/pre-commit
#
# This script is automatically run via postinstall when you run 'bun install'
# It ensures the hook is installed for all developers cloning the repo.

set -e

# Only install if .git exists (we're in a git repo)
if [ ! -d ".git" ]; then
    # Silently exit if not in a git repo (e.g., npm pack scenario)
    exit 0
fi

# Verify hook source exists
if [ ! -f "scripts/pre-commit-check.sh" ]; then
    echo "??  Warning: scripts/pre-commit-check.sh not found, skipping hook installation"
    exit 0
fi

# Install the hook
mkdir -p .git/hooks
cp scripts/pre-commit-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "? Pre-commit hook installed"
