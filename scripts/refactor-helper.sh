#!/bin/bash

# Sparka AI Refactoring Helper Script
# This script helps automate some of the refactoring tasks identified in the plan

set -e

echo "🏗️ Sparka AI Refactoring Helper"
echo "================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."
if ! command_exists bun; then
    echo "❌ Bun is not installed. Please install Bun first."
    exit 1
fi

if ! command_exists psql; then
    echo "⚠️  PostgreSQL client not found. Some database operations may fail."
fi

echo "✅ Dependencies check completed"

# Function to run code quality checks
run_quality_checks() {
    echo "🔍 Running code quality checks..."
    
    # Count TODO/FIXME comments
    TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" . | wc -l | tr -d ' ')
    echo "📝 Found $TODO_COUNT TODO/FIXME comments"
    
    # Count console.log statements
    CONSOLE_COUNT=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" . | wc -l | tr -d ' ')
    echo "🖥️  Found $CONSOLE_COUNT console.log statements"
    
    # Count commented lines
    COMMENT_COUNT=$(grep -r "^[[:space:]]*//" --include="*.ts" --include="*.tsx" . | wc -l | tr -d ' ')
    echo "💬 Found $COMMENT_COUNT commented lines"
    
    # Run TypeScript check
    echo "🔧 Running TypeScript check..."
    bun run test:types
    
    # Run linting
    echo "🧹 Running linter..."
    bun run lint
    
    echo "✅ Quality checks completed"
}

# Function to analyze bundle size
analyze_bundle() {
    echo "📦 Analyzing bundle size..."
    
    # Check if bundle analyzer is installed
    if ! bun list | grep -q "@next/bundle-analyzer"; then
        echo "📥 Installing bundle analyzer..."
        bun add -D @next/bundle-analyzer
    fi
    
    # Generate bundle report
    echo "🔍 Generating bundle analysis..."
    ANALYZE=true bun run build
    
    echo "✅ Bundle analysis completed"
}

# Function to check database schema consistency
check_database_schema() {
    echo "🗄️  Checking database schema consistency..."
    
    # Check if schema files exist and are consistent
    if [ -f "lib/db/schema.ts" ]; then
        echo "✅ Main schema file exists"
    else
        echo "❌ Main schema file missing"
        return 1
    fi
    
    if [ -f "lib/db/migrations/schema.ts" ]; then
        echo "⚠️  Duplicate schema file found - this should be removed"
    else
        echo "✅ No duplicate schema files"
    fi
    
    # Check for database connection
    if [ -n "$DATABASE_URL" ]; then
        echo "🔗 Database URL is configured"
    else
        echo "⚠️  DATABASE_URL not set"
    fi
    
    echo "✅ Database schema check completed"
}

# Function to generate refactoring report
generate_report() {
    echo "📊 Generating refactoring report..."
    
    REPORT_FILE="refactoring-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# Refactoring Report - $(date)

## Code Quality Metrics

- TODO/FIXME Comments: $(grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" . | wc -l | tr -d ' ')
- Console.log Statements: $(grep -r "console\.log" --include="*.ts" --include="*.tsx" . | wc -l | tr -d ' ')
- Commented Lines: $(grep -r "^[[:space:]]*//" --include="*.ts" --include="*.tsx" . | wc -l | tr -d ' ')
- TypeScript Files: $(find . -name "*.ts" -o -name "*.tsx" | wc -l | tr -d ' ')
- Total Lines of Code: $(find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}')

## File Size Analysis

$(find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -nr | head -20)

## Dependencies

$(bun list | wc -l | tr -d ' ') total dependencies

## Recommendations

1. Focus on files with >500 lines
2. Remove TODO comments and implement proper solutions
3. Replace console.log with proper logging
4. Add database indexes for performance
5. Implement proper error handling

EOF

    echo "📄 Report generated: $REPORT_FILE"
    echo "✅ Refactoring report completed"
}

# Function to create database indexes
create_database_indexes() {
    echo "🗄️  Creating database indexes..."
    
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  DATABASE_URL not set, skipping database operations"
        return 0
    fi
    
    # Create indexes for performance
    psql "$DATABASE_URL" << EOF
-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email ON "User" ("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_at ON "User" ("createdAt");

-- Chat table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_user_id ON "Chat" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_updated_at ON "Chat" ("updatedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_visibility ON "Chat" ("visibility");

-- Message table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_id ON "Message" ("chatId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_created_at ON "Message" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_id_created_at ON "Message" ("chatId", "createdAt");

-- Document table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_user_id ON "Document" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_message_id ON "Document" ("messageId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_created_at ON "Document" ("createdAt");

-- Vote table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_chat_id ON "Vote" ("chatId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_message_id ON "Vote" ("messageId");

-- Suggestion table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_user_id ON "Suggestion" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_document_id ON "Suggestion" ("documentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_created_at ON "Suggestion" ("createdAt");
EOF

    echo "✅ Database indexes created"
}

# Main menu
show_menu() {
    echo ""
    echo "🎯 Available Operations:"
    echo "1. Run code quality checks"
    echo "2. Analyze bundle size"
    echo "3. Check database schema"
    echo "4. Generate refactoring report"
    echo "5. Create database indexes"
    echo "6. Run all checks"
    echo "7. Exit"
    echo ""
    read -p "Select an option (1-7): " choice
}

# Main execution
main() {
    case $1 in
        "quality")
            run_quality_checks
            ;;
        "bundle")
            analyze_bundle
            ;;
        "schema")
            check_database_schema
            ;;
        "report")
            generate_report
            ;;
        "indexes")
            create_database_indexes
            ;;
        "all")
            run_quality_checks
            check_database_schema
            generate_report
            ;;
        *)
            while true; do
                show_menu
                case $choice in
                    1)
                        run_quality_checks
                        ;;
                    2)
                        analyze_bundle
                        ;;
                    3)
                        check_database_schema
                        ;;
                    4)
                        generate_report
                        ;;
                    5)
                        create_database_indexes
                        ;;
                    6)
                        run_quality_checks
                        check_database_schema
                        generate_report
                        ;;
                    7)
                        echo "👋 Goodbye!"
                        exit 0
                        ;;
                    *)
                        echo "❌ Invalid option. Please try again."
                        ;;
                esac
            done
            ;;
    esac
}

# Run main function with arguments
main "$@"

