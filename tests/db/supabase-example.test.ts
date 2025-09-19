/**
 * Example test file demonstrating Supabase database testing best practices
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import {
  createSupabaseTestContext,
  TEST_USERS,
} from './supabase';
import { sql } from 'drizzle-orm';

describe('Supabase Database Testing Example', () => {
  // Create test context with all utilities
  const context = createSupabaseTestContext();

  // Setup test wrapper for automatic setup/teardown
  const testWrapper = context.createTestWrapper();

  beforeAll(async () => {
    await testWrapper.beforeAll();
  });

  afterAll(async () => {
    await testWrapper.afterAll();
  });

  beforeEach(async () => {
    await testWrapper.beforeEach();
  });

  afterEach(async () => {
    await testWrapper.afterEach();
  });

  describe('Using Test Fixtures', () => {
    it('should load and query test fixtures', async () => {
      // Fixtures are already loaded in beforeAll
      const users = await context.db.execute(sql`
        SELECT * FROM "User"
        WHERE email = ${TEST_USERS.alice.email}
      `);

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe(TEST_USERS.alice.name);
    });

    it('should create dynamic test data', async () => {
      const factory = await import('./supabase/fixtures').then(m => new m.TestDataFactory());

      const newUser = factory.createUser({
        name: 'Dynamic Test User',
      });

      await context.db.execute(sql`
        INSERT INTO "User" (id, email, name, credits)
        VALUES (${newUser.id}, ${newUser.email}, ${newUser.name}, ${newUser.credits})
      `);

      const result = await context.db.execute(sql`
        SELECT * FROM "User" WHERE id = ${newUser.id}
      `);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dynamic Test User');
    });
  });

  describe('Using Transaction Isolation', () => {
    it('should rollback changes after test', async () => {
      await context.runInTransaction(async (tx) => {
        // Create a user within transaction
        await tx.execute(sql`
          INSERT INTO "User" (id, email, name, credits)
          VALUES ('tx-user', 'tx@test.io', 'Transaction User', 100)
        `);

        // Verify user exists within transaction
        const result = await tx.execute(sql`
          SELECT * FROM "User" WHERE id = 'tx-user'
        `);

        expect(result).toHaveLength(1);
      });

      // Verify user doesn't exist outside transaction
      const result = await context.db.execute(sql`
        SELECT * FROM "User" WHERE id = 'tx-user'
      `);

      expect(result).toHaveLength(0);
    });

    it('should handle nested savepoints', async () => {
      await context.runInTransaction(async (tx) => {
        await tx.execute(sql`
          INSERT INTO "User" (id, email, name, credits)
          VALUES ('user-1', 'user1@test.io', 'User 1', 100)
        `);

        await context.withSavepoint('nested', async () => {
          await tx.execute(sql`
            INSERT INTO "User" (id, email, name, credits)
            VALUES ('user-2', 'user2@test.io', 'User 2', 100)
          `);

          // Simulate error - savepoint will rollback
          throw new Error('Test error');
        }).catch(() => {});

        // user-1 should exist, user-2 should not
        const users = await tx.execute(sql`
          SELECT * FROM "User" WHERE id IN ('user-1', 'user-2')
        `);

        expect(users).toHaveLength(1);
        expect(users[0].id).toBe('user-1');
      });
    });
  });

  describe('Using Database Snapshots', () => {
    it('should create and restore snapshots', async () => {
      // Create initial state
      await context.db.execute(sql`
        INSERT INTO "User" (id, email, name, credits)
        VALUES ('snap-user', 'snap@test.io', 'Snapshot User', 100)
      `);

      // Create snapshot
      await context.snapshots.createSnapshot('test-snapshot');

      // Modify data
      await context.db.execute(sql`
        UPDATE "User" SET credits = 200 WHERE id = 'snap-user'
      `);

      // Verify modification
      let result = await context.db.execute(sql`
        SELECT credits FROM "User" WHERE id = 'snap-user'
      `);
      expect(result[0].credits).toBe(200);

      // Restore snapshot
      await context.snapshots.restoreSnapshot('test-snapshot');

      // Verify original state restored
      result = await context.db.execute(sql`
        SELECT credits FROM "User" WHERE id = 'snap-user'
      `);
      expect(result[0].credits).toBe(100);

      // Cleanup
      await context.snapshots.deleteSnapshot('test-snapshot');
    });

    it('should compare snapshots', async () => {
      await context.snapshots.createSnapshot('snapshot-1');

      // Make changes
      await context.db.execute(sql`
        INSERT INTO "User" (id, email, name, credits)
        VALUES ('diff-user', 'diff@test.io', 'Diff User', 50)
      `);

      await context.snapshots.createSnapshot('snapshot-2');

      const comparison = await context.snapshots.compareSnapshots(
        'snapshot-1',
        'snapshot-2'
      );

      expect(comparison.identical).toBe(false);
      expect(comparison.differences).toHaveLength(1);
      expect(comparison.differences[0].table).toBe('User');

      // Cleanup
      await context.snapshots.deleteSnapshot('snapshot-1');
      await context.snapshots.deleteSnapshot('snapshot-2');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track test performance', async () => {
      context.performance.startTest('example-performance-test');

      // Simulate some database operations
      for (let i = 0; i < 10; i++) {
        await context.db.execute(sql`
          SELECT * FROM "User" LIMIT 1
        `);
        context.performance.recordQuery('example-performance-test', 5);
      }

      const metrics = await context.performance.endTest('example-performance-test');

      expect(metrics.testName).toBe('example-performance-test');
      expect(metrics.status).toBe('success');
      expect(metrics.queriesExecuted).toBe(10);
      expect(metrics.executionTimeMs).toBeGreaterThan(0);
    });

    it('should check performance thresholds', async () => {
      context.performance.startTest('threshold-test');

      // Quick operation
      await context.db.execute(sql`SELECT 1`);

      await context.performance.endTest('threshold-test');

      const { passed, violations } = await context.performance.checkThresholds(
        'threshold-test',
        {
          maxExecutionTimeMs: 1000,
          maxQueries: 10,
        }
      );

      expect(passed).toBe(true);
      expect(violations).toHaveLength(0);
    });

    it('should generate performance reports', async () => {
      const report = await context.performance.generateReport();

      expect(report).toContain('# Test Performance Report');
      expect(report).toContain('| Test Name');
    });
  });

  describe('Schema Version Management', () => {
    it('should track schema versions', async () => {
      const checksum = await context.schemaVersion.calculateSchemaChecksum();

      await context.schemaVersion.recordVersion({
        version: '1.0.0',
        description: 'Test schema version',
        checksum,
      });

      const current = await context.schemaVersion.getCurrentVersion();

      expect(current?.version).toBe('1.0.0');
      expect(current?.checksum).toBe(checksum);
    });

    it('should validate schema integrity', async () => {
      const checksum = await context.schemaVersion.calculateSchemaChecksum();

      await context.schemaVersion.recordVersion({
        version: '1.0.1',
        description: 'Test integrity check',
        checksum,
      });

      const isValid = await context.schemaVersion.validateIntegrity();

      expect(isValid).toBe(true);
    });

    it('should compare schema versions', async () => {
      const comparison = await context.schemaVersion.compareVersions(
        '1.0.0',
        '1.0.1'
      );

      expect(comparison.areCompatible).toBe(true);
      expect(comparison.differences).toContain('Patch version difference');
    });
  });

  describe('Test Helpers', () => {
    it('should assert row counts', async () => {
      await expect(
        context.assertRowCount('User', 3) // We have 3 users from fixtures
      ).resolves.not.toThrow();

      await expect(
        context.assertRowCount('User', 999)
      ).rejects.toThrow('Row count assertion failed');
    });

    it('should get table statistics', async () => {
      const stats = await context.getTableStats('User');

      expect(stats).toHaveProperty('rowCount');
      expect(stats).toHaveProperty('sizeBytes');
      expect(stats).toHaveProperty('indexCount');
      expect(stats.rowCount).toBeGreaterThan(0);
    });

    it('should execute queries with timing', async () => {
      const result = await context.executeWithTiming(
        'SELECT * FROM "User" LIMIT 5'
      );

      expect(result.rows).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.rowCount).toBeGreaterThanOrEqual(0);
    });

    it('should wait for conditions', async () => {
      let conditionMet = false;

      // Set condition to true after 100ms
      setTimeout(() => {
        conditionMet = true;
      }, 100);

      await context.waitForCondition(
        async () => conditionMet,
        {
          timeout: 1000,
          interval: 50,
          message: 'Waiting for async condition',
        }
      );

      expect(conditionMet).toBe(true);
    });

    it('should simulate concurrent operations', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => async () => {
        const result = await context.db.execute(sql`
          SELECT ${i} as value
        `);
        return result[0].value;
      });

      const results = await context.simulateConcurrency(operations, {
        maxConcurrency: 3,
      });

      expect(results).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('RLS Testing', () => {
    it('should test row-level security policies', async () => {
      const rlsHelper = await import('./supabase/helpers').then(
        m => new m.RLSTestHelper(context.db)
      );

      // Enable RLS on Chat table
      await rlsHelper.enableRLS('Chat');

      // Create a policy
      await rlsHelper.createPolicy({
        table: 'Chat',
        name: 'users_see_own_chats',
        command: 'SELECT',
        using: '"userId" = current_user',
      });

      // Test would verify policy behavior
      // Note: This is simplified - real RLS testing requires proper user context
    });
  });
});

/**
 * Example of using the performance decorator
 */
class DatabaseService {
  private context: ReturnType<typeof createSupabaseTestContext>;

  constructor() {
    this.context = createSupabaseTestContext();
  }

  // @performanceTest({ maxExecutionTimeMs: 100, maxQueries: 5 })
  async fetchUserWithChats(userId: string) {
    const user = await this.context.db.execute(sql`
      SELECT * FROM "User" WHERE id = ${userId}
    `);

    const chats = await this.context.db.execute(sql`
      SELECT * FROM "Chat" WHERE "userId" = ${userId}
    `);

    return {
      user: user[0],
      chats: chats,
    };
  }
}