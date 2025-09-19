import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, runInTransaction } from '@/lib/db/test-utils';
import { sql } from 'drizzle-orm';

describe('Database Transaction Tests', () => {
  const testContext = setupTestDatabase();

  beforeAll(async () => {
    // Seed initial test data if needed
    await testContext.db.execute(sql`
      INSERT INTO "User" (id, email, name, credits)
      VALUES ('test-base-user', 'base@example.com', 'Base User', 100)
      ON CONFLICT (id) DO NOTHING
    `);
  });

  afterAll(async () => {
    // Clean up all test resources
    await testContext.cleanup();
  });

  it('should rollback changes after test', async () => {
    await testContext.runInTransaction(async (db) => {
      // Insert data within transaction
      await db.execute(sql`
        INSERT INTO "User" (id, email, name, credits)
        VALUES ('test-tx-user', 'tx@example.com', 'Transaction User', 50)
      `);

      // Verify data exists within transaction
      const result = await db.execute(sql`
        SELECT * FROM "User" WHERE id = 'test-tx-user'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe('tx@example.com');
    });

    // Verify data doesn't exist outside transaction (was rolled back)
    const result = await testContext.db.execute(sql`
      SELECT * FROM "User" WHERE id = 'test-tx-user'
    `);

    expect(result.rows).toHaveLength(0);
  });

  it('should isolate tests from each other', async () => {
    // Test 1: Create a user in transaction
    await testContext.runInTransaction(async (db) => {
      await db.execute(sql`
        INSERT INTO "User" (id, email, name)
        VALUES ('isolated-user-1', 'isolated1@example.com', 'Isolated 1')
      `);

      const count = await db.execute(sql`
        SELECT COUNT(*) as count FROM "User" WHERE id LIKE 'isolated-%'
      `);

      expect(count.rows[0].count).toBe('1');
    });

    // Test 2: Create another user in separate transaction
    await testContext.runInTransaction(async (db) => {
      await db.execute(sql`
        INSERT INTO "User" (id, email, name)
        VALUES ('isolated-user-2', 'isolated2@example.com', 'Isolated 2')
      `);

      // Should only see the user created in this transaction
      const count = await db.execute(sql`
        SELECT COUNT(*) as count FROM "User" WHERE id LIKE 'isolated-%'
      `);

      expect(count.rows[0].count).toBe('1');
    });

    // Outside transactions, neither user should exist
    const finalCount = await testContext.db.execute(sql`
      SELECT COUNT(*) as count FROM "User" WHERE id LIKE 'isolated-%'
    `);

    expect(finalCount.rows[0].count).toBe('0');
  });

  it('should handle nested savepoints', async () => {
    await testContext.runInTransaction(async (db) => {
      // Insert initial data
      await db.execute(sql`
        INSERT INTO "User" (id, email, name, credits)
        VALUES ('savepoint-user', 'savepoint@example.com', 'Savepoint User', 100)
      `);

      // Create a savepoint
      await db.execute(sql`SAVEPOINT sp1`);

      // Update credits
      await db.execute(sql`
        UPDATE "User" SET credits = 200 WHERE id = 'savepoint-user'
      `);

      // Verify update
      let result = await db.execute(sql`
        SELECT credits FROM "User" WHERE id = 'savepoint-user'
      `);
      expect(result.rows[0].credits).toBe(200);

      // Rollback to savepoint
      await db.execute(sql`ROLLBACK TO SAVEPOINT sp1`);

      // Credits should be back to original value
      result = await db.execute(sql`
        SELECT credits FROM "User" WHERE id = 'savepoint-user'
      `);
      expect(result.rows[0].credits).toBe(100);
    });
  });

  it('should handle errors and still rollback', async () => {
    try {
      await testContext.runInTransaction(async (db) => {
        // Insert valid data
        await db.execute(sql`
          INSERT INTO "User" (id, email, name)
          VALUES ('error-test-user', 'error@example.com', 'Error User')
        `);

        // This should throw an error (duplicate email)
        await db.execute(sql`
          INSERT INTO "User" (id, email, name)
          VALUES ('error-test-user-2', 'error@example.com', 'Duplicate Email')
        `);
      });
    } catch (error) {
      // Error is expected
      expect(error).toBeDefined();
    }

    // Verify that even the valid insert was rolled back
    const result = await testContext.db.execute(sql`
      SELECT * FROM "User" WHERE id = 'error-test-user'
    `);

    expect(result.rows).toHaveLength(0);
  });
});