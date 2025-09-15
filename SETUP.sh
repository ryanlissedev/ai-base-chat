#!/bin/bash

# SETUP.sh - Idempotent Setup Script for Sparka AI Project
# This script safely sets up the development environment with proper error handling

set -e  # Exit on any error

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Configuration
readonly REQUIRED_NODE_VERSION="18"
readonly REQUIRED_PNPM_VERSION="9"
readonly ENV_EXAMPLE_FILE=".env.example"
readonly ENV_LOCAL_FILE=".env.local"
readonly COMPOSE_FILE="docker-compose.test.yml"

# Global flags
VERBOSE=false
SKIP_DOCKER=false
SKIP_DB=false
FORCE_REINSTALL=false

# Logging functions
log_header() {
    echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n"
}

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

log_step() {
    echo -e "${CYAN}→${NC} $1"
}

# Progress tracking
TOTAL_STEPS=10
CURRENT_STEP=0

show_progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "\n${BOLD}[${CURRENT_STEP}/${TOTAL_STEPS}]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
${BOLD}Sparka AI Project Setup Script${NC}

This script sets up the complete development environment for Sparka AI.

${BOLD}Usage:${NC}
    ./SETUP.sh [OPTIONS]

${BOLD}Options:${NC}
    -h, --help          Show this help message
    -v, --verbose       Enable verbose output
    --skip-docker       Skip Docker setup and database testing
    --skip-db           Skip database setup and migrations
    --force             Force reinstall of dependencies
    --check             Only run environment checks

${BOLD}Features:${NC}
    • Validates Node.js and pnpm versions
    • Installs pnpm if not present
    • Sets up environment variables
    • Installs project dependencies
    • Runs database migrations
    • Sets up Docker for testing
    • Validates installation with type checking and linting
    • Completely idempotent (safe to run multiple times)

${BOLD}Requirements:${NC}
    • Node.js ${REQUIRED_NODE_VERSION}+
    • PostgreSQL database connection (for production setup)
    • Docker (optional, for database testing)

${BOLD}Examples:${NC}
    ./SETUP.sh                    # Full setup
    ./SETUP.sh --verbose          # Full setup with detailed output
    ./SETUP.sh --skip-docker      # Setup without Docker
    ./SETUP.sh --check            # Check environment only

EOF
}

# Utility functions
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

# Environment validation functions
check_node_version() {
    if ! command_exists node; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js ${REQUIRED_NODE_VERSION}+ from https://nodejs.org/"
        return 1
    fi

    local node_version
    node_version=$(node --version | sed 's/v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)

    if [ "$major_version" -lt "$REQUIRED_NODE_VERSION" ]; then
        log_error "Node.js version $node_version is too old"
        log_info "Required: Node.js ${REQUIRED_NODE_VERSION}+, Found: $node_version"
        return 1
    fi

    log_success "Node.js version $node_version ✓"
    return 0
}

check_pnpm_version() {
    if ! command_exists pnpm; then
        log_warning "pnpm is not installed"
        return 1
    fi

    local pnpm_version
    pnpm_version=$(pnpm --version)
    local major_version
    major_version=$(echo "$pnpm_version" | cut -d. -f1)

    if [ "$major_version" -lt "$REQUIRED_PNPM_VERSION" ]; then
        log_warning "pnpm version $pnpm_version is too old"
        log_info "Required: pnpm ${REQUIRED_PNPM_VERSION}+, Found: $pnpm_version"
        return 1
    fi

    log_success "pnpm version $pnpm_version ✓"
    return 0
}

install_pnpm() {
    log_step "Installing pnpm..."

    if command_exists npm; then
        npm install -g pnpm@latest
    elif command_exists corepack; then
        corepack enable
        corepack prepare pnpm@latest --activate
    else
        log_info "Installing pnpm via curl..."
        curl -fsSL https://get.pnpm.io/install.sh | sh -

        # Add pnpm to PATH for current session
        export PATH="$HOME/.local/share/pnpm:$PATH"

        # Add to shell profile
        local shell_profile=""
        if [ -n "$ZSH_VERSION" ]; then
            shell_profile="$HOME/.zshrc"
        elif [ -n "$BASH_VERSION" ]; then
            shell_profile="$HOME/.bashrc"
        fi

        if [ -n "$shell_profile" ] && [ -f "$shell_profile" ]; then
            if ! grep -q "pnpm" "$shell_profile"; then
                echo 'export PATH="$HOME/.local/share/pnpm:$PATH"' >> "$shell_profile"
                log_info "Added pnpm to $shell_profile"
            fi
        fi
    fi

    # Verify installation
    if check_pnpm_version; then
        log_success "pnpm installed successfully"
    else
        log_error "Failed to install pnpm"
        return 1
    fi
}

check_docker() {
    if ! command_exists docker; then
        log_warning "Docker is not installed"
        return 1
    fi

    if ! docker info >/dev/null 2>&1; then
        log_warning "Docker daemon is not running"
        return 1
    fi

    log_success "Docker is available ✓"
    return 0
}

# Setup functions
setup_environment_variables() {
    if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
        log_error "Environment example file not found: $ENV_EXAMPLE_FILE"
        return 1
    fi

    if [ -f "$ENV_LOCAL_FILE" ]; then
        log_info "Environment file already exists: $ENV_LOCAL_FILE"

        # Check if all required variables from .env.example are present
        local missing_vars=()
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Z_][A-Z0-9_]*= ]]; then
                local var_name
                var_name=$(echo "$line" | cut -d= -f1)
                if ! grep -q "^$var_name=" "$ENV_LOCAL_FILE"; then
                    missing_vars+=("$var_name")
                fi
            fi
        done < "$ENV_EXAMPLE_FILE"

        if [ ${#missing_vars[@]} -gt 0 ]; then
            log_warning "Missing environment variables: ${missing_vars[*]}"
            log_info "Adding missing variables to $ENV_LOCAL_FILE"

            for var in "${missing_vars[@]}"; do
                local line
                line=$(grep "^$var=" "$ENV_EXAMPLE_FILE")
                echo "$line" >> "$ENV_LOCAL_FILE"
                log_step "Added: $var"
            done
        else
            log_success "All required environment variables are present"
        fi
    else
        log_step "Creating environment file from example..."
        cp "$ENV_EXAMPLE_FILE" "$ENV_LOCAL_FILE"
        log_success "Created $ENV_LOCAL_FILE from $ENV_EXAMPLE_FILE"
        log_warning "Please configure the environment variables in $ENV_LOCAL_FILE"
    fi
}

install_dependencies() {
    log_step "Installing project dependencies..."

    if [ "$FORCE_REINSTALL" = true ]; then
        log_info "Force reinstall requested, removing node_modules and lockfile..."
        rm -rf node_modules pnpm-lock.yaml
    fi

    # Check if dependencies are already installed
    if [ -d "node_modules" ] && [ -f "pnpm-lock.yaml" ] && [ "$FORCE_REINSTALL" = false ]; then
        log_info "Dependencies appear to be installed, checking..."

        if pnpm list >/dev/null 2>&1; then
            log_success "Dependencies are already installed and valid"
            return 0
        else
            log_warning "Dependencies are corrupted, reinstalling..."
        fi
    fi

    # Install dependencies
    if [ "$VERBOSE" = true ]; then
        pnpm install
    else
        pnpm install --silent
    fi

    log_success "Dependencies installed successfully"
}

setup_database() {
    if [ "$SKIP_DB" = true ]; then
        log_info "Skipping database setup (--skip-db flag)"
        return 0
    fi

    if [ ! -f "$ENV_LOCAL_FILE" ]; then
        log_warning "Environment file not found, skipping database setup"
        return 0
    fi

    # Source environment variables
    set -a
    source "$ENV_LOCAL_FILE"
    set +a

    if [ -z "$POSTGRES_URL" ]; then
        log_warning "POSTGRES_URL not set, skipping database migrations"
        log_info "Please configure POSTGRES_URL in $ENV_LOCAL_FILE to enable database setup"
        return 0
    fi

    log_step "Running database migrations..."

    # Check if migrations directory exists
    if [ ! -d "lib/db/migrations" ]; then
        log_info "No migrations directory found, generating migrations..."
        if command_exists pnpm; then
            pnpm run db:generate
        fi
    fi

    # Run migrations
    if pnpm run db:migrate; then
        log_success "Database migrations completed"
    else
        log_warning "Database migrations failed - this might be expected if database is not accessible"
        log_info "You can run migrations later with: pnpm run db:migrate"
    fi
}

setup_docker_testing() {
    if [ "$SKIP_DOCKER" = true ]; then
        log_info "Skipping Docker setup (--skip-docker flag)"
        return 0
    fi

    if ! check_docker; then
        log_warning "Docker not available, skipping Docker test setup"
        return 0
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_warning "Docker compose file not found: $COMPOSE_FILE"
        return 0
    fi

    log_step "Setting up Docker test environment..."

    # Check if test containers are already running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "postgres-test"; then
        log_info "Test database container already exists"
    else
        log_info "Starting test database container..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres-test

        # Wait for database to be ready
        log_info "Waiting for test database to be ready..."
        local max_attempts=30
        local attempt=0

        while [ $attempt -lt $max_attempts ]; do
            if docker-compose -f "$COMPOSE_FILE" exec -T postgres-test pg_isready -U test_user -d test_db >/dev/null 2>&1; then
                log_success "Test database is ready"
                break
            fi

            attempt=$((attempt + 1))
            sleep 2
        done

        if [ $attempt -eq $max_attempts ]; then
            log_warning "Test database startup timeout - may need manual intervention"
        fi
    fi

    log_success "Docker test environment is ready"
}

run_validation() {
    log_step "Running project validation..."

    # Type checking
    log_info "Running type checking..."
    if pnpm run test:types; then
        log_success "Type checking passed ✓"
    else
        log_error "Type checking failed ✗"
        return 1
    fi

    # Linting
    log_info "Running linting..."
    if pnpm run lint; then
        log_success "Linting passed ✓"
    else
        log_warning "Linting found issues - run 'pnpm run lint:fix' to auto-fix"
    fi

    # Build test
    log_info "Testing build process..."
    if pnpm run build; then
        log_success "Build test passed ✓"
    else
        log_error "Build test failed ✗"
        return 1
    fi

    log_success "Project validation completed"
}

cleanup_on_error() {
    log_error "Setup failed at step $CURRENT_STEP"
    log_info "You can re-run this script to continue from where it left off"
    exit 1
}

# Main setup function
main() {
    log_header "Sparka AI Project Setup"

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                ;;
            --skip-db)
                SKIP_DB=true
                ;;
            --force)
                FORCE_REINSTALL=true
                ;;
            --check)
                CHECK_ONLY=true
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done

    # Set verbose mode
    if [ "$VERBOSE" = true ]; then
        set -x
    fi

    # Trap errors
    trap cleanup_on_error ERR

    # Step 1: Environment Detection
    show_progress "Validating Environment"

    if ! check_node_version; then
        exit 1
    fi

    if ! check_pnpm_version; then
        log_info "pnpm not found or outdated, installing..."
        install_pnpm
    fi

    # Step 2: Docker Check
    show_progress "Checking Docker Availability"
    check_docker || log_info "Docker setup will be skipped"

    # Exit early if only checking
    if [ "$CHECK_ONLY" = true ]; then
        log_success "Environment check completed"
        exit 0
    fi

    # Step 3: Environment Variables
    show_progress "Setting Up Environment Variables"
    setup_environment_variables

    # Step 4: Dependencies
    show_progress "Installing Dependencies"
    install_dependencies

    # Step 5: Database Setup
    show_progress "Setting Up Database"
    setup_database

    # Step 6: Docker Testing
    show_progress "Setting Up Docker Testing Environment"
    setup_docker_testing

    # Step 7: Validation
    show_progress "Running Project Validation"
    run_validation

    # Final success message
    log_header "Setup Complete!"
    cat << EOF
${GREEN}✅ Sparka AI development environment is ready!${NC}

${BOLD}Next steps:${NC}
1. Configure your environment variables in ${ENV_LOCAL_FILE}
2. Set up your PostgreSQL database connection
3. Start development: ${CYAN}pnpm run dev${NC}

${BOLD}Available commands:${NC}
• ${CYAN}pnpm run dev${NC}         - Start development server
• ${CYAN}pnpm run build${NC}       - Build for production
• ${CYAN}pnpm run test${NC}        - Run tests
• ${CYAN}pnpm run db:studio${NC}   - Open database studio
• ${CYAN}pnpm run test:db${NC}     - Run database tests

${BOLD}Documentation:${NC}
Check the README.md and package.json for more commands and information.

${GREEN}Happy coding! 🚀${NC}
EOF
}

# Run main function
main "$@"