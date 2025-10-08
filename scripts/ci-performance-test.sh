#!/bin/bash

# CI Performance Test Script
# Tests different CI approaches to measure performance improvements

set -e

echo "🚀 CI Performance Test Suite"
echo "============================="

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

# Clean up any existing builds
log "🧹 Cleaning up previous builds..."
rm -rf dist/ .eslintcache || true

# Test 1: Original CI (sequential)
log "📊 Test 1: Original CI (Sequential)"
ORIGINAL_START=$(date +%s)
yarn lint
yarn type-check
yarn build
ORIGINAL_END=$(date +%s)
ORIGINAL_DURATION=$((ORIGINAL_END - ORIGINAL_START))
echo "⏱️  Original CI took ${ORIGINAL_DURATION}s"

# Clean up
rm -rf dist/ .eslintcache || true

# Test 2: Fast CI (optimized sequential)
log "📊 Test 2: Fast CI (Optimized Sequential)"
FAST_START=$(date +%s)
yarn ci:fast
FAST_END=$(date +%s)
FAST_DURATION=$((FAST_END - FAST_START))
echo "⏱️  Fast CI took ${FAST_DURATION}s"

# Clean up
rm -rf dist/ .eslintcache || true

# Test 3: Ultra CI (cached sequential)
log "📊 Test 3: Ultra CI (Cached Sequential)"
ULTRA_START=$(date +%s)
yarn ci:ultra
ULTRA_END=$(date +%s)
ULTRA_DURATION=$((ULTRA_END - ULTRA_START))
echo "⏱️  Ultra CI took ${ULTRA_DURATION}s"

# Clean up
rm -rf dist/ .eslintcache || true

# Test 4: Lightning CI (minimal checks)
log "📊 Test 4: Lightning CI (Minimal Checks)"
LIGHTNING_START=$(date +%s)
yarn ci:lightning
LIGHTNING_END=$(date +%s)
LIGHTNING_DURATION=$((LIGHTNING_END - LIGHTNING_START))
echo "⏱️  Lightning CI took ${LIGHTNING_DURATION}s"

# Clean up
rm -rf dist/ .eslintcache || true

# Test 5: Parallel CI (true parallel execution)
log "📊 Test 5: Parallel CI (True Parallel Execution)"
PARALLEL_START=$(date +%s)
yarn ci:parallel
PARALLEL_END=$(date +%s)
PARALLEL_DURATION=$((PARALLEL_END - PARALLEL_START))
echo "⏱️  Parallel CI took ${PARALLEL_DURATION}s"

# Clean up
rm -rf dist/ .eslintcache || true

# Test 6: Pre-commit CI (fastest feedback)
log "📊 Test 6: Pre-commit CI (Fastest Feedback)"
PRECOMMIT_START=$(date +%s)
yarn precommit
PRECOMMIT_END=$(date +%s)
PRECOMMIT_DURATION=$((PRECOMMIT_END - PRECOMMIT_START))
echo "⏱️  Pre-commit CI took ${PRECOMMIT_DURATION}s"

# Performance Analysis
log "📊 Performance Analysis:"
echo "========================="
echo "Original CI (Sequential):     ${ORIGINAL_DURATION}s (baseline)"
echo "Fast CI (Optimized):          ${FAST_DURATION}s ($(( (ORIGINAL_DURATION - FAST_DURATION) * 100 / ORIGINAL_DURATION ))% faster)"
echo "Ultra CI (Cached):            ${ULTRA_DURATION}s ($(( (ORIGINAL_DURATION - ULTRA_DURATION) * 100 / ORIGINAL_DURATION ))% faster)"
echo "Lightning CI (Minimal):       ${LIGHTNING_DURATION}s ($(( (ORIGINAL_DURATION - LIGHTNING_DURATION) * 100 / ORIGINAL_DURATION ))% faster)"
echo "Parallel CI (True Parallel):  ${PARALLEL_DURATION}s ($(( (ORIGINAL_DURATION - PARALLEL_DURATION) * 100 / ORIGINAL_DURATION ))% faster)"
echo "Pre-commit CI (Fastest):      ${PRECOMMIT_DURATION}s ($(( (ORIGINAL_DURATION - PRECOMMIT_DURATION) * 100 / ORIGINAL_DURATION ))% faster)"

# Find the fastest approach
FASTEST_TIME=$ORIGINAL_DURATION
FASTEST_NAME="Original CI"

if [ $FAST_DURATION -lt $FASTEST_TIME ]; then
    FASTEST_TIME=$FAST_DURATION
    FASTEST_NAME="Fast CI"
fi

if [ $ULTRA_DURATION -lt $FASTEST_TIME ]; then
    FASTEST_TIME=$ULTRA_DURATION
    FASTEST_NAME="Ultra CI"
fi

if [ $LIGHTNING_DURATION -lt $FASTEST_TIME ]; then
    FASTEST_TIME=$LIGHTNING_DURATION
    FASTEST_NAME="Lightning CI"
fi

if [ $PARALLEL_DURATION -lt $FASTEST_TIME ]; then
    FASTEST_TIME=$PARALLEL_DURATION
    FASTEST_NAME="Parallel CI"
fi

if [ $PRECOMMIT_DURATION -lt $FASTEST_TIME ]; then
    FASTEST_TIME=$PRECOMMIT_DURATION
    FASTEST_NAME="Pre-commit CI"
fi

echo ""
echo "🏆 Fastest Approach: $FASTEST_NAME (${FASTEST_TIME}s)"
echo "📈 Total Improvement: $(( (ORIGINAL_DURATION - FASTEST_TIME) * 100 / ORIGINAL_DURATION ))% faster"

# Recommendations
echo ""
echo "💡 Recommendations:"
echo "==================="

if [ $PARALLEL_DURATION -lt $ORIGINAL_DURATION ]; then
    echo "✅ Use Parallel CI for maximum speed when all checks are needed"
fi

if [ $LIGHTNING_DURATION -lt $ORIGINAL_DURATION ]; then
    echo "✅ Use Lightning CI for quick feedback during development"
fi

if [ $PRECOMMIT_DURATION -lt $ORIGINAL_DURATION ]; then
    echo "✅ Use Pre-commit CI for instant feedback before commits"
fi

if [ $ULTRA_DURATION -lt $ORIGINAL_DURATION ]; then
    echo "✅ Use Ultra CI for production builds with caching"
fi

echo ""
echo "🎉 Performance testing completed!"
echo "Use the fastest approach for your specific use case."