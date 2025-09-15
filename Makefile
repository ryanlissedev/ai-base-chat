# Sparka AI - Comprehensive Makefile
# =================================

# Colors for output
RED    := \033[31m
GREEN  := \033[32m
YELLOW := \033[33m
BLUE   := \033[34m
PURPLE := \033[35m
CYAN   := \033[36m
WHITE  := \033[37m
RESET  := \033[0m

# Variables
NODE_VERSION := $(shell node --version 2>/dev/null)
PNPM_VERSION := $(shell pnpm --version 2>/dev/null)
PACKAGE_MANAGER := pnpm
PROJECT_NAME := sparka-ai
DOCKER_COMPOSE_TEST := docker-compose.test.yml
DATABASE_URL_TEST := postgresql://test_user:test_password@localhost:5433/test_db

# Default target
.DEFAULT_GOAL := help

# Phony targets
.PHONY: help install dev build start clean reset \
        test test-unit test-e2e test-db test-db-ci test-db-setup test-db-clean \
        test-db-shell test-db-logs test-db-start test-db-stop test-types \
        lint lint-fix format typecheck \
        db-generate db-migrate db-push db-pull db-studio db-check db-up \
        docker-up docker-down docker-clean docker-logs \
        storybook storybook-build \
        fetch-models fetch-model-features \
        check-deps audit security-audit \
        pre-commit ci-check

# =================================
# Help and Information
# =================================

help: ## Show this help message
	@echo "$(CYAN)$(PROJECT_NAME) - Development Commands$(RESET)"
	@echo "$(CYAN)=====================================$(RESET)"
	@echo ""
	@echo "$(GREEN)📦 Setup and Installation:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Setup|Installation/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🚀 Development:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Development|dev|build|start/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🧪 Testing:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Test|test/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🗃️  Database:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Database|db/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🔍 Code Quality:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Quality|lint|format|typecheck/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🐳 Docker:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Docker/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)🛠️  Utilities:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## .*Utility|clean|reset|storybook|fetch/ {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

status: ## Show project status and environment info
	@echo "$(CYAN)Project Status$(RESET)"
	@echo "=============="
	@echo "$(GREEN)Node.js:$(RESET) $(NODE_VERSION)"
	@echo "$(GREEN)PNPM:$(RESET) $(PNPM_VERSION)"
	@echo "$(GREEN)Project:$(RESET) $(PROJECT_NAME)"
	@echo "$(GREEN)Git Branch:$(RESET) $$(git branch --show-current 2>/dev/null || echo 'Not a git repository')"
	@echo "$(GREEN)Git Status:$(RESET) $$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') modified files"
	@echo ""

# =================================
# Setup and Installation
# =================================

check-node: ## Check if Node.js is installed
	@if ! command -v node >/dev/null 2>&1; then \
		echo "$(RED)❌ Node.js is not installed$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Node.js $(NODE_VERSION) is installed$(RESET)"

check-pnpm: ## Check if pnpm is installed
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "$(RED)❌ pnpm is not installed$(RESET)"; \
		echo "$(YELLOW)Install with: npm install -g pnpm$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ pnpm $(PNPM_VERSION) is installed$(RESET)"

install: check-node check-pnpm ## Setup and Installation - Install all dependencies
	@echo "$(BLUE)📦 Installing dependencies...$(RESET)"
	$(PACKAGE_MANAGER) install
	@echo "$(GREEN)✅ Dependencies installed successfully$(RESET)"

setup: install ## Setup and Installation - Complete project setup
	@echo "$(BLUE)🔧 Setting up project...$(RESET)"
	@if [ ! -f .env.local ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env.local; \
			echo "$(YELLOW)📝 Created .env.local from .env.example$(RESET)"; \
			echo "$(YELLOW)⚠️  Please update .env.local with your values$(RESET)"; \
		else \
			echo "$(YELLOW)⚠️  No .env.example found, please create .env.local manually$(RESET)"; \
		fi \
	fi
	@echo "$(GREEN)✅ Project setup completed$(RESET)"

# =================================
# Development
# =================================

dev: ## Development - Start development server with turbo
	@echo "$(BLUE)🚀 Starting development server...$(RESET)"
	$(PACKAGE_MANAGER) run dev

build: db-migrate ## Development - Build for production (includes DB migration)
	@echo "$(BLUE)🏗️  Building for production...$(RESET)"
	$(PACKAGE_MANAGER) run build
	@echo "$(GREEN)✅ Build completed$(RESET)"

start: ## Development - Start production server
	@echo "$(BLUE)▶️  Starting production server...$(RESET)"
	$(PACKAGE_MANAGER) run start

# =================================
# Testing
# =================================

test: ## Test - Run all tests (Playwright E2E)
	@echo "$(BLUE)🧪 Running all tests...$(RESET)"
	$(PACKAGE_MANAGER) run test

test-unit: ## Test - Run unit tests with Vitest
	@echo "$(BLUE)🔬 Running unit tests...$(RESET)"
	$(PACKAGE_MANAGER) run test:unit

test-e2e: test ## Test - Run end-to-end tests (alias for test)

test-types: ## Test - Run TypeScript type checking
	@echo "$(BLUE)🔍 Running type checking...$(RESET)"
	$(PACKAGE_MANAGER) run test:types

test-db: ## Test - Run database tests
	@echo "$(BLUE)🗃️  Running database tests...$(RESET)"
	$(PACKAGE_MANAGER) run test:db

test-db-ci: ## Test - Run database tests in CI mode
	@echo "$(BLUE)🗃️  Running database tests (CI mode)...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:ci

test-db-setup: ## Test - Setup database test environment
	@echo "$(BLUE)🔧 Setting up database test environment...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:setup

test-db-clean: ## Test - Clean database test environment
	@echo "$(BLUE)🧹 Cleaning database test environment...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:clean

test-db-shell: ## Test - Open shell in database test container
	@echo "$(BLUE)🐚 Opening database test shell...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:shell

test-db-logs: ## Test - View database test logs
	@echo "$(BLUE)📋 Viewing database test logs...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:logs

test-db-start: ## Test - Start database test container
	@echo "$(BLUE)🐳 Starting database test container...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:start

test-db-stop: ## Test - Stop database test container
	@echo "$(BLUE)🛑 Stopping database test container...$(RESET)"
	$(PACKAGE_MANAGER) run test:db:stop

test-all: test-types test-unit test test-db ## Test - Run all test suites
	@echo "$(GREEN)✅ All tests completed$(RESET)"

# =================================
# Database
# =================================

db-generate: ## Database - Generate database migrations
	@echo "$(BLUE)📝 Generating database migrations...$(RESET)"
	$(PACKAGE_MANAGER) run db:generate

db-migrate: ## Database - Run database migrations
	@echo "$(BLUE)🗃️  Running database migrations...$(RESET)"
	$(PACKAGE_MANAGER) run db:migrate

db-push: ## Database - Push schema changes to database
	@echo "$(BLUE)⬆️  Pushing schema changes...$(RESET)"
	$(PACKAGE_MANAGER) run db:push

db-pull: ## Database - Pull schema from database
	@echo "$(BLUE)⬇️  Pulling schema from database...$(RESET)"
	$(PACKAGE_MANAGER) run db:pull

db-studio: ## Database - Open Drizzle Studio
	@echo "$(BLUE)🎨 Opening Drizzle Studio...$(RESET)"
	$(PACKAGE_MANAGER) run db:studio

db-check: ## Database - Check database schema
	@echo "$(BLUE)🔍 Checking database schema...$(RESET)"
	$(PACKAGE_MANAGER) run db:check

db-up: ## Database - Update database
	@echo "$(BLUE)⬆️  Updating database...$(RESET)"
	$(PACKAGE_MANAGER) run db:up

db-test-migrate: ## Database - Run test database migration
	@echo "$(BLUE)🗃️  Running test database migration...$(RESET)"
	$(PACKAGE_MANAGER) run db:test:migrate

# =================================
# Code Quality
# =================================

lint: ## Quality - Run linting
	@echo "$(BLUE)🔍 Running linter...$(RESET)"
	$(PACKAGE_MANAGER) run lint

lint-fix: ## Quality - Run linting with auto-fix
	@echo "$(BLUE)🔧 Running linter with auto-fix...$(RESET)"
	$(PACKAGE_MANAGER) run lint:fix

format: ## Quality - Format code with Biome
	@echo "$(BLUE)💄 Formatting code...$(RESET)"
	$(PACKAGE_MANAGER) run format

typecheck: ## Quality - Run TypeScript type checking
	@echo "$(BLUE)🔍 Running TypeScript type checking...$(RESET)"
	$(PACKAGE_MANAGER) run test:types

quality-check: lint typecheck ## Quality - Run all quality checks
	@echo "$(GREEN)✅ Quality checks completed$(RESET)"

# =================================
# Docker
# =================================

docker-up: ## Docker - Start all Docker services
	@echo "$(BLUE)🐳 Starting Docker services...$(RESET)"
	docker-compose -f $(DOCKER_COMPOSE_TEST) up -d

docker-down: ## Docker - Stop all Docker services
	@echo "$(BLUE)🛑 Stopping Docker services...$(RESET)"
	docker-compose -f $(DOCKER_COMPOSE_TEST) down

docker-clean: ## Docker - Clean Docker containers and volumes
	@echo "$(BLUE)🧹 Cleaning Docker containers and volumes...$(RESET)"
	docker-compose -f $(DOCKER_COMPOSE_TEST) down -v
	docker system prune -f

docker-logs: ## Docker - View Docker container logs
	@echo "$(BLUE)📋 Viewing Docker logs...$(RESET)"
	docker-compose -f $(DOCKER_COMPOSE_TEST) logs -f

docker-rebuild: docker-clean docker-up ## Docker - Rebuild and restart Docker services

# =================================
# Storybook
# =================================

storybook: ## Utility - Start Storybook development server
	@echo "$(BLUE)📚 Starting Storybook...$(RESET)"
	$(PACKAGE_MANAGER) run storybook

storybook-build: ## Utility - Build Storybook for production
	@echo "$(BLUE)🏗️  Building Storybook...$(RESET)"
	$(PACKAGE_MANAGER) run build:storybook

# =================================
# Data Fetching
# =================================

fetch-models: ## Utility - Fetch AI models data
	@echo "$(BLUE)📡 Fetching AI models...$(RESET)"
	$(PACKAGE_MANAGER) run fetch-models

fetch-model-features: ## Utility - Fetch model features data
	@echo "$(BLUE)📡 Fetching model features...$(RESET)"
	$(PACKAGE_MANAGER) run fetch-model-features

fetch-all: fetch-models fetch-model-features ## Utility - Fetch all external data

# =================================
# Dependency Management
# =================================

check-deps: ## Utility - Check for outdated dependencies
	@echo "$(BLUE)📦 Checking for outdated dependencies...$(RESET)"
	$(PACKAGE_MANAGER) outdated

audit: ## Utility - Run security audit
	@echo "$(BLUE)🔒 Running security audit...$(RESET)"
	$(PACKAGE_MANAGER) audit

security-audit: audit ## Utility - Alias for audit

update-deps: ## Utility - Update all dependencies (interactive)
	@echo "$(YELLOW)⚠️  This will update dependencies interactively$(RESET)"
	@echo "$(BLUE)📦 Updating dependencies...$(RESET)"
	$(PACKAGE_MANAGER) update -i

# =================================
# Cleanup and Reset
# =================================

clean: ## Utility - Clean build artifacts and caches
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(RESET)"
	rm -rf .next
	rm -rf dist
	rm -rf build
	rm -rf storybook-static
	rm -rf coverage
	rm -rf .turbo
	@echo "$(GREEN)✅ Clean completed$(RESET)"

clean-deps: ## Utility - Clean dependencies
	@echo "$(BLUE)🧹 Cleaning dependencies...$(RESET)"
	rm -rf node_modules
	rm -f pnpm-lock.yaml
	@echo "$(GREEN)✅ Dependencies cleaned$(RESET)"

reset: clean clean-deps install ## Utility - Complete reset (clean + reinstall)
	@echo "$(GREEN)✅ Project reset completed$(RESET)"

# =================================
# CI/CD and Pre-commit
# =================================

pre-commit: quality-check test-unit ## Run pre-commit checks
	@echo "$(GREEN)✅ Pre-commit checks passed$(RESET)"

ci-check: quality-check test-types test-unit ## Run all CI checks
	@echo "$(GREEN)✅ CI checks completed$(RESET)"

# =================================
# Advanced Operations
# =================================

full-test: clean setup test-all ## Run complete test suite with fresh setup
	@echo "$(GREEN)✅ Full test suite completed$(RESET)"

release-check: clean build test-all ## Check if ready for release
	@echo "$(GREEN)✅ Release checks completed$(RESET)"

# =================================
# Debug and Troubleshooting
# =================================

debug-env: ## Show environment information for debugging
	@echo "$(CYAN)Debug Environment Information$(RESET)"
	@echo "============================="
	@echo "$(GREEN)Node.js:$(RESET) $(NODE_VERSION)"
	@echo "$(GREEN)PNPM:$(RESET) $(PNPM_VERSION)"
	@echo "$(GREEN)Platform:$(RESET) $$(uname -s)"
	@echo "$(GREEN)Working Directory:$(RESET) $$(pwd)"
	@echo "$(GREEN)Package Manager:$(RESET) $(PACKAGE_MANAGER)"
	@echo "$(GREEN)Project Name:$(RESET) $(PROJECT_NAME)"
	@echo ""
	@echo "$(CYAN)Environment Variables:$(RESET)"
	@env | grep -E "(NODE_|NEXT_|DATABASE_)" | sort
	@echo ""

doctor: status debug-env check-deps ## Run comprehensive health check
	@echo "$(GREEN)✅ Health check completed$(RESET)"