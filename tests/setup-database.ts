import { test as base } from '@playwright/test';
import { runTestMigration } from '../lib/db/migrate-test';

export const test = base.extend({
  // Set up clean database before each test
  page: async ({ page }, use) => {
    // Initialize PostgreSQL test database
    const testPort = process.env.TEST_DB_PORT || '5433';
    const testDatabaseUrl = process.env.POSTGRES_URL || `postgresql://test_user:test_password@localhost:${testPort}/test_db`;
    
    try {
      // The database container should already be running from globalSetup
      // but we still need to run migrations for test isolation
      await runTestMigration(testDatabaseUrl);
    } catch (error) {
      console.error('Database setup failed:', error);
      console.error('This usually means:');
      console.error('1. The test database container is not running');
      console.error('2. Database connection parameters are incorrect');
      console.error('3. Database migrations failed');
      console.error('Make sure to run the global setup or start the database manually with:');
      console.error('  docker compose -f docker-compose.test.yml up -d postgres-test');
      throw error; // Fail fast instead of continuing with broken database
    }

    await use(page);

    // Note: Database cleanup is handled by the test environment
    // No explicit cleanup needed as each test run uses isolated transactions
  },
});

export { expect } from '@playwright/test';