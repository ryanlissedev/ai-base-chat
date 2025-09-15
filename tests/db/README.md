# Database Testing with pgTAP

This directory contains pgTAP tests for PostgreSQL database testing.

## Directory Structure

```
tests/db/
├── init/           # Database initialization scripts
├── sql/            # pgTAP test files
├── scripts/        # Test runner and utility scripts
└── README.md       # This file
```

## Running Tests

### Prerequisites

- Docker and Docker Compose
- PostgreSQL client tools (for local development)

### Quick Start

1. **Run all database tests:**
   ```bash
   npm run test:db
   ```

2. **Start test database only:**
   ```bash
   npm run test:db:start
   ```

3. **Stop test database:**
   ```bash
   npm run test:db:stop
   ```

4. **Run specific test file:**
   ```bash
   npm run test:db:file tests/db/sql/01-schema-validation.sql
   ```

### Manual Testing

1. **Start the test database:**
   ```bash
   docker-compose -f docker-compose.test.yml up postgres-test -d
   ```

2. **Run migrations:**
   ```bash
   npm run db:test:migrate
   ```

3. **Run pgTAP tests:**
   ```bash
   docker-compose -f docker-compose.test.yml run --rm pgtap-test
   ```

## Test Files

- `01-schema-validation.sql` - Tests table schemas and column definitions
- `02-constraints.sql` - Tests primary keys, foreign keys, and constraints
- `03-indexes.sql` - Tests database indexes
- `04-relationships.sql` - Tests foreign key relationships
- `05-queries.sql` - Tests common database queries
- `06-user-table.sql` - Specific tests for User table
- `07-chat-table.sql` - Specific tests for Chat table
- `08-message-table.sql` - Specific tests for Message table
- `09-vote-table.sql` - Specific tests for Vote table
- `10-document-table.sql` - Specific tests for Document table
- `11-suggestion-table.sql` - Specific tests for Suggestion table

## Writing Tests

pgTAP provides many testing functions:

- `ok(boolean, description)` - Basic assertion
- `is(actual, expected, description)` - Equality test
- `has_table(schema, table, description)` - Check if table exists
- `has_column(schema, table, column, description)` - Check if column exists
- `col_type_is(schema, table, column, type, description)` - Check column type
- `col_not_null(schema, table, column, description)` - Check NOT NULL constraint
- `has_pk(schema, table, description)` - Check primary key
- `has_fk(schema, table, description)` - Check foreign key

Example test:
```sql
BEGIN;
SELECT plan(3);

SELECT has_table('public', 'User', 'User table should exist');
SELECT has_column('public', 'User', 'email', 'User table should have email column');
SELECT col_type_is('public', 'User', 'email', 'character varying(255)', 'Email should be varchar(255)');

SELECT * FROM finish();
ROLLBACK;
```

## Environment Variables

The test database uses the following environment variables:

- `PGHOST=postgres-test`
- `PGPORT=5432`
- `PGDATABASE=test_db`
- `PGUSER=test_user`
- `PGPASSWORD=test_password`

## CI/CD Integration

Tests can be run in CI/CD environments by:

1. Starting the test database service
2. Running migrations
3. Executing pgTAP tests
4. Collecting test results

See the npm scripts for automated CI/CD integration.