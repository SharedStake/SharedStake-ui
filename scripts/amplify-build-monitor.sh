#!/bin/bash

# Amplify Build Performance Monitor
# This script monitors build performance and provides insights

set -e

echo "🔍 Amplify Build Performance Monitor"
echo "=================================="

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to measure command execution time
measure_time() {
    local start_time=$(date +%s)
    "$@"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo "⏱️  Command took ${duration}s"
    return $duration
}

# Check system resources
log "📊 System Resources:"
echo "CPU cores: $(nproc)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "Disk space: $(df -h . | tail -1 | awk '{print $4}')"

# Check Node.js and Yarn versions
log "🔧 Environment:"
echo "Node.js: $(node --version)"
echo "Yarn: $(yarn --version)"
echo "NPM: $(npm --version)"

# Measure dependency installation
log "📦 Installing dependencies..."
INSTALL_START=$(date +%s)
yarn install --frozen-lockfile --prefer-offline
INSTALL_END=$(date +%s)
INSTALL_DURATION=$((INSTALL_END - INSTALL_START))
echo "⏱️  Dependency installation took ${INSTALL_DURATION}s"

# Measure linting
log "🔍 Running linting..."
LINT_START=$(date +%s)
yarn lint
LINT_END=$(date +%s)
LINT_DURATION=$((LINT_END - LINT_START))
echo "⏱️  Linting took ${LINT_DURATION}s"

# Measure type checking
log "🔧 Running type checking..."
TYPE_START=$(date +%s)
yarn type-check
TYPE_END=$(date +%s)
TYPE_DURATION=$((TYPE_END - TYPE_START))
echo "⏱️  Type checking took ${TYPE_DURATION}s"

# Measure build
log "🏗️ Building application..."
BUILD_START=$(date +%s)
yarn build
BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))
echo "⏱️  Build took ${BUILD_DURATION}s"

# Calculate total time
TOTAL_DURATION=$((INSTALL_DURATION + LINT_DURATION + TYPE_DURATION + BUILD_DURATION))

# Build analysis
log "📊 Build Analysis:"
echo "Total build time: ${TOTAL_DURATION}s"
echo "Dependency installation: ${INSTALL_DURATION}s ($(( INSTALL_DURATION * 100 / TOTAL_DURATION ))%)"
echo "Linting: ${LINT_DURATION}s ($(( LINT_DURATION * 100 / TOTAL_DURATION ))%)"
echo "Type checking: ${TYPE_DURATION}s ($(( TYPE_DURATION * 100 / TOTAL_DURATION ))%)"
echo "Build: ${BUILD_DURATION}s ($(( BUILD_DURATION * 100 / TOTAL_DURATION ))%)"

# Check build output
if [ -d "dist" ]; then
    log "📦 Build Output:"
    echo "Build size: $(du -sh dist/ | cut -f1)"
    echo "Number of files: $(find dist/ -type f | wc -l)"
    echo "Largest files:"
    find dist/ -type f -exec du -h {} + | sort -rh | head -5
    
    # Check for common issues
    if find dist/ -name "*.map" | grep -q .; then
        echo "⚠️  Source maps found in production build"
    fi
    
    if [ ! -f "dist/index.html" ]; then
        echo "❌ index.html missing"
        exit 1
    else
        echo "✅ index.html found"
    fi
else
    echo "❌ Build directory not found"
    exit 1
fi

# Performance recommendations
log "💡 Performance Recommendations:"
if [ $INSTALL_DURATION -gt 60 ]; then
    echo "⚠️  Dependency installation is slow (${INSTALL_DURATION}s). Consider optimizing cache."
fi

if [ $LINT_DURATION -gt 30 ]; then
    echo "⚠️  Linting is slow (${LINT_DURATION}s). Consider using --cache flag."
fi

if [ $BUILD_DURATION -gt 120 ]; then
    echo "⚠️  Build is slow (${BUILD_DURATION}s). Consider webpack optimizations."
fi

if [ $TOTAL_DURATION -lt 60 ]; then
    echo "✅ Excellent build performance!"
elif [ $TOTAL_DURATION -lt 120 ]; then
    echo "✅ Good build performance"
else
    echo "⚠️  Build could be optimized for better performance"
fi

log "🎉 Build monitoring completed successfully!"