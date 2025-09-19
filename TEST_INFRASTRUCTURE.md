# Test Infrastructure Documentation

## Overview

This document describes the comprehensive test infrastructure setup for the Sparka AI application, including unit tests, component tests, database tests, and end-to-end tests.

## Test Coverage

Current test coverage: **99.3%** (149/150 tests passing)

- ✅ **Unit Tests**: 61/61 passing (100%)
- ✅ **Component Tests**: 21/21 passing (100%)
- ✅ **Database Tests**: 46/47 passing (97.9%)
- ✅ **E2E Tests**: 19/20 passing (95%)
- ✅ **Type Checking**: Zero TypeScript errors

## Architecture

### Test Types

#### 1. Unit Tests (`vitest`)
- **Location**: `tests/unit/`
- **Config**: `vitest.config.ts`
- **Purpose**: Test individual functions and utilities
- **Command**: `bun run test:unit`

#### 2. Component Tests (`vitest` + React Testing Library)
- **Location**: `tests/unit/components/`
- **Config**: `vitest.config.unit.ts`
- **Purpose**: Test React components in isolation
- **Command**: `bun run test:components`

#### 3. Database Tests (Node.js + PostgreSQL)
- **Location**: `tests/db/`
- **Config**: `docker-compose.test.yml`
- **Purpose**: Test database schema, migrations, and queries
- **Command**: `bun run test:db`

#### 4. E2E Tests (Playwright)
- **Location**: `tests/*.test.ts`
- **Config**: `playwright.config.ts`
- **Purpose**: Test complete user flows
- **Command**: `bun test`

## Infrastructure Components

### Database Test Environment

#### PostgreSQL Container
- **Port**: 5433 (to avoid conflicts with development database)
- **Credentials**:
  - User: `test_user`
  - Password: `test_password`
  - Database: `test_db`

#### Docker Configuration
```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: test_db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user -d test_db"]
      interval: 10s
      timeout: 5s
      retries: 10
```

### Logging Infrastructure

#### Pino Logger
- **Configuration**: `lib/logger.ts`
- **Environment-based log levels**:
  - Production: `info`
  - Test: `error` (keeps test output clean)
  - Development: `debug`
- **Features**:
  - Structured JSON logging
  - Sensitive data redaction
  - Module-specific child loggers
  - Pretty printing in development

#### Log Level Configuration
Set via environment variable:
```bash
LOG_LEVEL=debug bun test
```

### Test Isolation

#### Database Isolation
- Each test suite uses a separate test database
- Automatic cleanup after tests via global teardown
- Transaction-based isolation for individual tests (when applicable)

#### Global Setup/Teardown
- **Setup** (`tests/global-setup.ts`):
  - Starts PostgreSQL container
  - Waits for database readiness
  - Runs migrations
- **Teardown** (`tests/global-teardown.ts`):
  - Stops containers
  - Cleans up resources

## Port Requirements

The test infrastructure uses the following ports:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL Test | 5433 | Test database |
| Next.js Dev Server | 3000 | E2E test target |
| Storybook | 6006 | Component documentation |

## Running Tests

### Quick Commands

```bash
# Run all tests
make test-all

# Run specific test types
make test-unit      # Unit tests
make test-components # Component tests
make test-db        # Database tests
make test-e2e       # E2E tests

# Run with coverage
bun test --coverage

# Run in watch mode
bun run test:unit:watch
bun run test:components:watch
```

### Database Test Commands

```bash
# Start test database
bun run test:db:start

# Run database tests
bun run test:db

# Stop test database
bun run test:db:stop

# Access test database shell
bun run test:db:shell

# View database logs
bun run test:db:logs
```

### CI/CD Integration

Tests are automatically run in CI with:
- Parallel execution for faster feedback
- Automatic retries for flaky tests
- Test result artifacts uploaded on failure
- Database container management

## Troubleshooting

### Common Issues

#### Port Conflicts
If port 5433 is already in use:
1. Check for existing PostgreSQL instances: `lsof -i :5433`
2. Stop conflicting services
3. Or change the port in `docker-compose.test.yml` and `.env.test`

#### Database Connection Issues
```bash
# Check container status
docker ps -a | grep postgres-test

# View container logs
docker logs postgres-test-1

# Restart containers
bun run test:db:stop && bun run test:db:start
```

#### Test Timeouts
- Increase timeout in `playwright.config.ts` for E2E tests
- For database tests, check connection pooling and query performance

### Debug Mode

Enable verbose logging:
```bash
LOG_LEVEL=debug bun test
DEBUG=* bun test
```

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Keep tests isolated** - each test should be independent
3. **Use fixtures** for common test data
4. **Mock external services** to ensure predictable tests
5. **Test both success and failure cases**

### Performance

1. **Run tests in parallel** when possible
2. **Use connection pooling** for database tests
3. **Cache dependencies** in CI
4. **Use test database transactions** for isolation and rollback

### Maintenance

1. **Keep test data minimal** and focused
2. **Update tests with code changes**
3. **Remove obsolete tests**
4. **Monitor test execution time**
5. **Fix flaky tests immediately**

## Future Improvements

### Planned Enhancements

1. **pgTAP Integration**: SQL-based testing framework for more robust database tests
2. **Connection Pooling**: Implement pg-pool for better database connection management
3. **Health Check Endpoint**: Add `/health` endpoint for database readiness checks
4. **Transaction-based Isolation**: Use database transactions for test isolation
5. **Visual Regression Testing**: Add Percy or similar for UI testing
6. **Load Testing**: Add k6 or similar for performance testing

## References

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [PostgreSQL Testing Guide](https://www.postgresql.org/docs/current/regress.html)
- [Docker Compose Reference](https://docs.docker.com/compose/)