#!/bin/bash

# pgTAP Database Test Runner
# This script sets up the test database, runs migrations, and executes pgTAP tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
DB_SERVICE="postgres-test"
TEST_SERVICE="pgtap-test"
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
    docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
}

wait_for_db() {
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" pg_isready -U test_user -d test_db >/dev/null 2>&1; then
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

    # Start the database service
    docker-compose -f "$COMPOSE_FILE" up -d "$DB_SERVICE"

    # Wait for database to be ready
    if ! wait_for_db; then
        log_error "Failed to set up database"
        return 1
    fi

    # Run database migrations
    log_info "Running database migrations..."
    if ! DATABASE_URL="$TEST_DB_URL" npm run db:migrate; then
        log_error "Failed to run migrations"
        return 1
    fi

    log_success "Database setup completed"
}

run_pgtap_tests() {
    log_info "Running pgTAP tests..."

    # Build and run the test container
    if docker-compose -f "$COMPOSE_FILE" run --rm "$TEST_SERVICE"; then
        log_success "All pgTAP tests passed!"
        return 0
    else
        log_error "Some pgTAP tests failed!"
        return 1
    fi
}

run_specific_test() {
    local test_file="$1"
    log_info "Running specific test: $test_file"

    # Check if test file exists
    if [ ! -f "$test_file" ]; then
        log_error "Test file not found: $test_file"
        return 1
    fi

    # Get relative path from tests/db/sql/
    local relative_path
    relative_path=$(realpath --relative-to="$(pwd)/tests/db/sql" "$test_file" 2>/dev/null || echo "$test_file")

    docker-compose -f "$COMPOSE_FILE" run --rm "$TEST_SERVICE" sh -c "
        until pg_isready -h postgres-test -U test_user -d test_db; do
          echo 'Waiting for PostgreSQL to be ready...'
          sleep 2
        done &&
        pg_prove -h postgres-test -U test_user -d test_db /tests/sql/$relative_path
    "
}

show_help() {
    echo "pgTAP Database Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     Set up test database and run migrations"
    echo "  test      Run all pgTAP tests"
    echo "  run       Set up database and run all tests (default)"
    echo "  clean     Clean up test containers and volumes"
    echo "  logs      Show database logs"
    echo "  shell     Open psql shell to test database"
    echo ""
    echo "Options:"
    echo "  -f, --file TEST_FILE    Run specific test file"
    echo "  -h, --help             Show this help message"
    echo "  -v, --verbose          Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests"
    echo "  $0 test                              # Run tests only (assumes DB is set up)"
    echo "  $0 -f tests/db/sql/01-schema-validation.sql  # Run specific test"
    echo "  $0 clean                             # Clean up containers"
}

# Parse command line arguments
VERBOSE=false
TEST_FILE=""
COMMAND="run"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--file)
            TEST_FILE="$2"
            COMMAND="test-file"
            shift 2
            ;;
        setup|test|run|clean|logs|shell)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown argument: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set verbose mode if requested
if [ "$VERBOSE" = true ]; then
    set -x
fi

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
case "$COMMAND" in
    setup)
        setup_database
        ;;
    test)
        run_pgtap_tests
        ;;
    test-file)
        setup_database
        run_specific_test "$TEST_FILE"
        ;;
    run)
        setup_database
        run_pgtap_tests
        ;;
    clean)
        cleanup
        log_success "Cleanup completed"
        trap - EXIT  # Disable cleanup trap since we're doing it manually
        ;;
    logs)
        docker-compose -f "$COMPOSE_FILE" logs -f "$DB_SERVICE"
        ;;
    shell)
        docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" psql -U test_user -d test_db
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac