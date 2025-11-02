#!/bin/bash

# Simple script to install git pre-commit hook
# Copies the hook script to .git/hooks/pre-commit

set -e

# Only install if .git exists (we're in a git repo)
if [ ! -d ".git" ]; then
    exit 0
fi

# Install the hook
mkdir -p .git/hooks
cp scripts/pre-commit-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "? Pre-commit hook installed"
