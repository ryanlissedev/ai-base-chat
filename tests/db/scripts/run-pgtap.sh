#!/bin/bash

# pgTAP test runner script
# This script sets up and runs pgTAP tests in the test database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_NAME=${DB_NAME:-test_db}
DB_USER=${DB_USER:-test_user}
DB_PASSWORD=${DB_PASSWORD:-test_password}

# Export for psql
export PGPASSWORD=$DB_PASSWORD

echo -e "${YELLOW}🧪 Starting pgTAP test suite...${NC}"

# Function to check if database is ready
check_db_ready() {
    pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /dev/null 2>&1
}

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if check_db_ready; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database is not ready after 30 seconds${NC}"
        exit 1
    fi
    sleep 1
done

# Install pgTAP extension if not already installed
echo "📦 Installing pgTAP extension..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pgtap;" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  pgTAP extension might already be installed or requires superuser${NC}"
}

# Run migrations first to ensure schema is up to date
echo "🔄 Running database migrations..."
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" npm run db:migrate || {
    echo -e "${YELLOW}⚠️  Migration might have already been run${NC}"
}

# Find all pgTAP test files
TEST_DIR="tests/db/pgtap"
if [ ! -d "$TEST_DIR" ]; then
    echo -e "${RED}❌ Test directory $TEST_DIR does not exist${NC}"
    exit 1
fi

# Run each test file
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

for test_file in $TEST_DIR/*.sql; do
    if [ -f "$test_file" ]; then
        test_name=$(basename "$test_file")
        echo ""
        echo "🧪 Running test: $test_name"
        echo "----------------------------------------"

        # Run the test and capture output
        OUTPUT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$test_file" 2>&1) || {
            echo -e "${RED}❌ Test file execution failed${NC}"
            echo "$OUTPUT"
            ((FAILED_TESTS++))
            continue
        }

        # Parse TAP output
        if echo "$OUTPUT" | grep -q "^ok"; then
            # Count passed tests
            PASS_COUNT=$(echo "$OUTPUT" | grep -c "^ok" || true)
            ((PASSED_TESTS += PASS_COUNT))
            echo -e "${GREEN}✅ $PASS_COUNT tests passed${NC}"
        fi

        if echo "$OUTPUT" | grep -q "^not ok"; then
            # Count failed tests
            FAIL_COUNT=$(echo "$OUTPUT" | grep -c "^not ok" || true)
            ((FAILED_TESTS += FAIL_COUNT))
            echo -e "${RED}❌ $FAIL_COUNT tests failed${NC}"
            echo "$OUTPUT" | grep "^not ok" | head -10
        fi

        # Show test plan
        if echo "$OUTPUT" | grep -q "^1\.\."; then
            echo "$OUTPUT" | grep "^1\.\."
        fi

        # Count total tests
        TOTAL=$(echo "$OUTPUT" | grep -oP '1\.\.\K\d+' || echo 0)
        ((TOTAL_TESTS += TOTAL))
    fi
done

echo ""
echo "========================================"
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "========================================"
echo "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ] && [ $TOTAL_TESTS -gt 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
elif [ $TOTAL_TESTS -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No tests were run${NC}"
    exit 1
else
    echo ""
    echo -e "${RED}💔 Some tests failed${NC}"
    exit 1
fi