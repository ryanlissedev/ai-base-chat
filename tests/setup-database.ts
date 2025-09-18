import { test as base } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const test = base.extend({
  // Set up clean database before each test
  page: async ({ page }, use) => {
    // Clean up any existing test database
    const testDbPath = path.join(process.cwd(), 'test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize fresh test database
    try {
      // Run database migrations for test environment
      execSync('DATABASE_URL=file:./test.db npx prisma db push --force-reset', {
        stdio: 'ignore',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      });
    } catch (error) {
      console.warn('Database setup failed, continuing with existing database:', error);
    }

    await use(page);

    // Cleanup after test (optional - commented out to keep for debugging)
    // if (fs.existsSync(testDbPath)) {
    //   fs.unlinkSync(testDbPath);
    // }
  },
});

export { expect } from '@playwright/test';