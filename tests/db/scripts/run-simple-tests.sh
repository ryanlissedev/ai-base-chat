#!/bin/bash

# Simple Database Test Runner - runs Node.js tests locally
# This provides immediate database testing without complex Docker setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_SERVICE="postgres-test"
TEST_DB_URL="postgresql://test_user:test_password@localhost:5433/test_db"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    log_info "Cleaning up..."
    docker-compose -f "docker-compose.test.simple.yml" down -v --remove-orphans 2>/dev/null || true
}

wait_for_db() {
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "docker-compose.test.simple.yml" exec -T "$DB_SERVICE" pg_isready -U test_user -d test_db >/dev/null 2>&1; then
            log_success "Database is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        log_info "Attempt $attempt/$max_attempts - waiting for database..."
        sleep 2
    done

    log_error "Database failed to become ready within timeout"
    return 1
}

setup_database() {
    log_info "Setting up test database..."

    # Clean any existing containers first
    log_info "Cleaning up any existing containers..."
    docker-compose -f "docker-compose.test.simple.yml" down -v --remove-orphans 2>/dev/null || true

    # Start the database service
    log_info "Starting database service..."
    docker-compose -f "docker-compose.test.simple.yml" up -d "$DB_SERVICE"

    # Wait for database to be ready
    if ! wait_for_db; then
        log_error "Failed to set up database"
        return 1
    fi

    # Run database migrations with proper environment
    log_info "Running database migrations..."
    export DATABASE_URL="$TEST_DB_URL"
    export POSTGRES_URL="$TEST_DB_URL"
    
    if ! npm run db:migrate; then
        log_error "Failed to run migrations"
        return 1
    fi

    log_success "Database setup completed successfully"
}

run_tests() {
    log_info "Running database tests..."
    
    # Set environment variables for the test runner
    export PGHOST=localhost
    export PGPORT=5433
    export PGDATABASE=test_db
    export PGUSER=test_user
    export PGPASSWORD=test_password
    
    # Run the Node.js test runner
    if node tests/db/scripts/simple-test-runner.js; then
        log_success "All database tests completed!"
        return 0
    else
        log_error "Some database tests failed!"
        return 1
    fi
}

show_help() {
    echo "Simple Database Test Runner"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     Set up test database and run migrations"
    echo "  test      Run database tests (assumes DB is set up)"
    echo "  run       Set up database and run tests (default)"
    echo "  clean     Clean up test containers and volumes"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 setup              # Just set up the database"
    echo "  $0 test               # Just run tests"
    echo "  $0 clean              # Clean up containers"
}

# Parse command line arguments
COMMAND="${1:-run}"

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
case "$COMMAND" in
    setup)
        setup_database
        ;;
    test)
        run_tests
        ;;
    run)
        setup_database
        run_tests
        ;;
    clean)
        cleanup
        log_success "Cleanup completed"
        trap - EXIT  # Disable cleanup trap since we're doing it manually
        ;;
    help|--help|-h)
        show_help
        exit 0
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac