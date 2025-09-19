import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createPooledDatabase, type PooledDatabase } from './pool';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('db:test-utils');

export interface TestTransaction {
  db: PostgresJsDatabase;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Create a test database connection with transaction support
 * @param connectionString Database connection string
 * @returns Test database with transaction utilities
 */
export function createTestDatabase(connectionString?: string): PooledDatabase {
  const dbUrl = connectionString || process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('No test database URL provided');
  }

  return createPooledDatabase(dbUrl, {
    max: 5, // Smaller pool for tests
    idle_timeout: 10,
    connect_timeout: 10,
  });
}

/**
 * Run a test in a transaction that will be rolled back
 * @param db Database instance
 * @param testFn Test function to run in transaction
 */
export async function runInTransaction<T>(
  db: PostgresJsDatabase,
  testFn: (tx: PostgresJsDatabase) => Promise<T>
): Promise<T> {
  logger.debug('Starting test transaction');

  try {
    // Begin transaction
    await db.execute(sql`BEGIN`);

    // Set isolation level for tests
    await db.execute(sql`SET TRANSACTION ISOLATION LEVEL READ COMMITTED`);

    // Run the test function
    const result = await testFn(db);

    // Always rollback test transactions
    await db.execute(sql`ROLLBACK`);

    logger.debug('Test transaction rolled back');

    return result;
  } catch (error) {
    // Ensure rollback on error
    try {
      await db.execute(sql`ROLLBACK`);
    } catch (rollbackError) {
      logger.error('Failed to rollback transaction: %s', rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
    }

    throw error;
  }
}

/**
 * Create a savepoint for nested transactions
 * @param db Database instance
 * @param name Savepoint name
 */
export async function createSavepoint(
  db: PostgresJsDatabase,
  name: string
): Promise<void> {
  await db.execute(sql.raw(`SAVEPOINT ${name}`));
  logger.debug(`Created savepoint: ${name}`);
}

/**
 * Release a savepoint
 * @param db Database instance
 * @param name Savepoint name
 */
export async function releaseSavepoint(
  db: PostgresJsDatabase,
  name: string
): Promise<void> {
  await db.execute(sql.raw(`RELEASE SAVEPOINT ${name}`));
  logger.debug(`Released savepoint: ${name}`);
}

/**
 * Rollback to a savepoint
 * @param db Database instance
 * @param name Savepoint name
 */
export async function rollbackToSavepoint(
  db: PostgresJsDatabase,
  name: string
): Promise<void> {
  await db.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${name}`));
  logger.debug(`Rolled back to savepoint: ${name}`);
}

/**
 * Test helper to clean up test data
 * @param db Database instance
 * @param tables Tables to clean (in reverse dependency order)
 */
export async function cleanupTestData(
  db: PostgresJsDatabase,
  tables: string[] = ['Message', 'Attachment', 'Document', 'Share', 'Chat', 'User']
): Promise<void> {
  logger.info('Cleaning up test data');

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DELETE FROM "${table}" WHERE id LIKE 'test-%'`));
      logger.debug(`Cleaned test data from table: ${table}`);
    } catch (error) {
      logger.warn('Failed to clean table %s: %s', table, error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Seed test data
 * @param db Database instance
 */
export async function seedTestData(db: PostgresJsDatabase): Promise<void> {
  logger.info('Seeding test data');

  // Create test users
  await db.execute(sql`
    INSERT INTO "User" (id, email, name, credits)
    VALUES
      ('test-user-1', 'test1@example.com', 'Test User 1', 100),
      ('test-user-2', 'test2@example.com', 'Test User 2', 50)
    ON CONFLICT (id) DO NOTHING
  `);

  // Create test chats
  await db.execute(sql`
    INSERT INTO "Chat" (id, title, "userId", visibility)
    VALUES
      ('test-chat-1', 'Test Chat 1', 'test-user-1', 'private'),
      ('test-chat-2', 'Test Chat 2', 'test-user-1', 'public')
    ON CONFLICT (id) DO NOTHING
  `);

  // Create test messages
  await db.execute(sql`
    INSERT INTO "Message" (id, "chatId", role, content, sequence)
    VALUES
      ('test-msg-1', 'test-chat-1', 'user', 'Hello, world!', 1),
      ('test-msg-2', 'test-chat-1', 'assistant', 'Hello! How can I help you?', 2)
    ON CONFLICT (id) DO NOTHING
  `);

  logger.info('Test data seeded successfully');
}

/**
 * Create a test context with automatic cleanup
 */
export class TestContext {
  private pool: PooledDatabase;
  private cleanupFns: Array<() => Promise<void>> = [];

  constructor(connectionString?: string) {
    this.pool = createTestDatabase(connectionString);
  }

  get db(): PostgresJsDatabase {
    return this.pool.db;
  }

  /**
   * Register a cleanup function
   */
  addCleanup(fn: () => Promise<void>): void {
    this.cleanupFns.push(fn);
  }

  /**
   * Run a test with automatic transaction rollback
   */
  async runInTransaction<T>(
    testFn: (db: PostgresJsDatabase) => Promise<T>
  ): Promise<T> {
    return runInTransaction(this.db, testFn);
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    // Run cleanup functions in reverse order
    for (const fn of this.cleanupFns.reverse()) {
      try {
        await fn();
      } catch (error) {
        logger.error('Cleanup function failed: %s', error instanceof Error ? error.message : String(error));
      }
    }

    // Clean test data
    await cleanupTestData(this.db);

    // Close connection pool
    await this.pool.end();
  }
}

// Export a helper for use in tests
export function setupTestDatabase(): TestContext {
  return new TestContext();
}