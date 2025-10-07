#!/bin/bash

# SharedStake QA Test Runner
# This script provides an easy way to run different test suites

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${2}${1}${NC}\n"
}

# Function to run tests with nice output
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_color "Running $test_name..." "$YELLOW"
    if $test_command; then
        print_color "✓ $test_name passed" "$GREEN"
        return 0
    else
        print_color "✗ $test_name failed" "$RED"
        return 1
    fi
}

# Display menu
show_menu() {
    echo "================================"
    echo "  SharedStake QA Test Runner"
    echo "================================"
    echo "1) Run All Tests"
    echo "2) Run Unit Tests"
    echo "3) Run E2E Tests (Headless)"
    echo "4) Open Cypress Test Runner"
    echo "5) Run Unit Tests with Coverage"
    echo "6) Run Linting"
    echo "7) Run Blog Tests Only"
    echo "8) Run Blockchain Tests Only"
    echo "9) Run Specific Test File"
    echo "0) Exit"
    echo "================================"
}

# Function to run specific test file
run_specific_test() {
    echo "Available test files:"
    echo ""
    echo "E2E Tests:"
    ls -1 cypress/e2e/*.cy.js 2>/dev/null | sed 's/^/  - /'
    echo ""
    echo "Unit Tests:"
    ls -1 tests/unit/**/*.spec.js 2>/dev/null | sed 's/^/  - /'
    echo ""
    read -p "Enter the test file path: " test_file
    
    if [[ $test_file == *".cy.js" ]]; then
        npx cypress run --spec "$test_file"
    elif [[ $test_file == *".spec.js" ]]; then
        npx jest "$test_file"
    else
        print_color "Invalid test file path" "$RED"
    fi
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            print_color "Running all tests..." "$YELLOW"
            npm run test:ci
            ;;
        2)
            run_test "Unit Tests" "npm run test:unit"
            ;;
        3)
            run_test "E2E Tests" "npm run test:e2e:headless"
            ;;
        4)
            print_color "Opening Cypress Test Runner..." "$YELLOW"
            npm run test:e2e:open
            ;;
        5)
            run_test "Unit Tests with Coverage" "npm run test:unit:coverage"
            ;;
        6)
            run_test "Linting" "npm run lint"
            ;;
        7)
            print_color "Running Blog Tests..." "$YELLOW"
            npx cypress run --spec "cypress/e2e/blog.cy.js"
            ;;
        8)
            print_color "Running Blockchain Tests..." "$YELLOW"
            npx cypress run --spec "cypress/e2e/stake.cy.js,cypress/e2e/withdraw.cy.js,cypress/e2e/rollover.cy.js,cypress/e2e/earn.cy.js,cypress/e2e/wrap-unwrap.cy.js"
            ;;
        9)
            run_specific_test
            ;;
        0)
            print_color "Exiting..." "$GREEN"
            exit 0
            ;;
        *)
            print_color "Invalid choice. Please try again." "$RED"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done