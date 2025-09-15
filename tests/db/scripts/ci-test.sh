#!/bin/bash

# CI/CD-friendly pgTAP test runner
# Simplified version for automated environments

set -e

# Configuration
TEST_DB_URL="postgresql://test_user:test_password@localhost:5433/test_db"
COMPOSE_FILE="docker-compose.test.yml"

echo "🧪 Starting pgTAP Database Tests"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true

# Start test database
echo "🗄️  Starting test database..."
docker-compose -f "$COMPOSE_FILE" up -d postgres-test

# Wait for database
echo "⏳ Waiting for database to be ready..."
timeout=60
count=0
while [ $count -lt $timeout ]; do
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres-test pg_isready -U test_user -d test_db >/dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $timeout ]; then
    echo "❌ Database failed to start within timeout"
    exit 1
fi

# Run migrations
echo "🔄 Running database migrations..."
if ! DATABASE_URL="$TEST_DB_URL" npm run db:migrate 2>/dev/null; then
    echo "❌ Failed to run migrations"
    exit 1
fi

# Run pgTAP tests
echo "🧪 Running pgTAP tests..."
if docker-compose -f "$COMPOSE_FILE" run --rm pgtap-test; then
    echo "✅ All tests passed!"
    exit_code=0
else
    echo "❌ Tests failed!"
    exit_code=1
fi

# Cleanup
echo "🧹 Cleaning up..."
docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true

exit $exit_code