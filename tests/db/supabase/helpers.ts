/**
 * Supabase-style test helper functions
 * Comprehensive utilities for database testing
 */

import { sql, eq, and, or, desc } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createPooledDatabase, type PooledDatabase } from '../../../lib/db/pool';
import { createModuleLogger } from '../../../lib/logger';
import { FixtureLoader } from './fixtures';
import { SnapshotManager } from './snapshots';
import { TestPerformanceMonitor } from './performance';
import { SchemaVersionManager } from './schema-version';

const logger = createModuleLogger('db:test-helpers');

/**
 * Supabase test context with all utilities
 */
export class SupabaseTestContext {
  public db: PostgresJsDatabase;
  public pool: PooledDatabase;
  public fixtures: FixtureLoader;
  public snapshots: SnapshotManager;
  public performance: TestPerformanceMonitor;
  public schemaVersion: SchemaVersionManager;

  private cleanupFns: Array<() => Promise<void>> = [];
  private transactionDepth = 0;
  private savepointCounter = 0;

  constructor(connectionString?: string) {
    const testPort = process.env.TEST_DB_PORT || '5433';
    const dbUrl =
      connectionString ||
      process.env.TEST_DATABASE_URL ||
      `postgresql://test_user:test_password@localhost:${testPort}/test_db`;

    this.pool = createPooledDatabase(dbUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    this.db = this.pool.db;
    this.fixtures = new FixtureLoader(this.db);
    this.snapshots = new SnapshotManager(this.db);
    this.performance = new TestPerformanceMonitor(this.db);
    this.schemaVersion = new SchemaVersionManager(this.db);
  }

  /**
   * Initialize all test utilities
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Supabase test context');

    await Promise.all([
      this.snapshots.initialize(),
      this.performance.initialize(),
      this.schemaVersion.initialize(),
    ]);

    logger.info('Test context initialized');
  }

  /**
   * Setup test database with template
   */
  async setupWithTemplate(templateName = 'test_template'): Promise<void> {
    logger.info(`Setting up database with template: ${templateName}`);

    try {
      // Create test database from template
      const result = await this.db.execute(sql`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
      `);

      logger.debug(`Terminated ${result.rowCount} connections`);

      // Note: In a real scenario, you'd create a new database from template
      // For testing, we'll just ensure clean state
      await this.cleanDatabase();
      await this.fixtures.loadAll();

      logger.info('Database setup with template completed');
    } catch (error) {
      logger.error('Failed to setup database with template:', error);
      throw error;
    }
  }

  /**
   * Run test in isolated transaction
   */
  async runInTransaction<T>(
    testFn: (tx: PostgresJsDatabase) => Promise<T>,
    options?: { isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' }
  ): Promise<T> {
    const testName = `transaction_${++this.transactionDepth}`;
    this.performance.startTest(testName);

    try {
      await this.db.execute(sql`BEGIN`);

      if (options?.isolationLevel) {
        await this.db.execute(
          sql.raw(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`)
        );
      }

      const result = await testFn(this.db);

      await this.db.execute(sql`ROLLBACK`);

      const metrics = await this.performance.endTest(testName, 'success');
      logger.debug(`Transaction test completed in ${metrics.executionTimeMs}ms`);

      return result;
    } catch (error) {
      await this.db.execute(sql`ROLLBACK`);
      await this.performance.endTest(testName, 'failure', (error as Error).message);
      throw error;
    } finally {
      this.transactionDepth--;
    }
  }

  /**
   * Create and manage savepoints
   */
  async withSavepoint<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const savepointName = `${name}_${++this.savepointCounter}`;

    await this.db.execute(sql.raw(`SAVEPOINT ${savepointName}`));
    logger.debug(`Created savepoint: ${savepointName}`);

    try {
      const result = await fn();
      await this.db.execute(sql.raw(`RELEASE SAVEPOINT ${savepointName}`));
      logger.debug(`Released savepoint: ${savepointName}`);
      return result;
    } catch (error) {
      await this.db.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${savepointName}`));
      logger.debug(`Rolled back to savepoint: ${savepointName}`);
      throw error;
    }
  }

  /**
   * Clean database (remove all test data)
   */
  async cleanDatabase(): Promise<void> {
    logger.info('Cleaning database');

    const tables = [
      'Message',
      'Attachment',
      'Document',
      'Share',
      'Chat',
      'User',
    ];

    for (const table of tables) {
      try {
        await this.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
        logger.debug(`Truncated table: ${table}`);
      } catch (error) {
        logger.warn(`Failed to truncate ${table}, trying DELETE:`, error);
        await this.db.execute(sql.raw(`DELETE FROM "${table}"`));
      }
    }

    // Reset sequences
    await this.resetSequences();

    logger.info('Database cleaned');
  }

  /**
   * Reset all sequences to 1
   */
  async resetSequences(): Promise<void> {
    const sequences = await this.db.execute(sql`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `);

    for (const row of sequences.rows) {
      const seqName = row.sequence_name as string;
      await this.db.execute(sql.raw(`ALTER SEQUENCE "${seqName}" RESTART WITH 1`));
    }

    logger.debug('Reset all sequences');
  }

  /**
   * Wait for specific condition in database
   */
  async waitForCondition(
    condition: () => Promise<boolean>,
    options?: {
      timeout?: number;
      interval?: number;
      message?: string;
    }
  ): Promise<void> {
    const timeout = options?.timeout || 5000;
    const interval = options?.interval || 100;
    const message = options?.message || 'Waiting for condition';

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        logger.debug(`${message}: condition met`);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`${message}: timeout after ${timeout}ms`);
  }

  /**
   * Assert row count in table
   */
  async assertRowCount(
    table: string,
    expectedCount: number,
    where?: string
  ): Promise<void> {
    const whereClause = where ? `WHERE ${where}` : '';
    const result = await this.db.execute(
      sql.raw(`SELECT COUNT(*) as count FROM "${table}" ${whereClause}`)
    );

    const actualCount = Number(result.rows[0].count);

    if (actualCount !== expectedCount) {
      throw new Error(
        `Row count assertion failed for ${table}: expected ${expectedCount}, got ${actualCount}`
      );
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(table: string): Promise<{
    rowCount: number;
    sizeBytes: number;
    indexCount: number;
    lastAnalyzed: Date | null;
  }> {
    const stats = await this.db.execute(sql`
      SELECT
        n_live_tup as row_count,
        pg_relation_size(c.oid) as size_bytes,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = c.relname) as index_count,
        last_analyze
      FROM pg_stat_user_tables s
      JOIN pg_class c ON c.relname = s.relname
      WHERE s.relname = ${table}
    `);

    if (stats.rows.length === 0) {
      return {
        rowCount: 0,
        sizeBytes: 0,
        indexCount: 0,
        lastAnalyzed: null,
      };
    }

    const row = stats.rows[0];
    return {
      rowCount: Number(row.row_count),
      sizeBytes: Number(row.size_bytes),
      indexCount: Number(row.index_count),
      lastAnalyzed: row.last_analyze as Date | null,
    };
  }

  /**
   * Execute raw SQL with timing
   */
  async executeWithTiming(query: string): Promise<{
    rows: any[];
    executionTimeMs: number;
    rowCount: number;
  }> {
    const startTime = performance.now();

    const result = await this.db.execute(sql.raw(query));

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      rows: result.rows,
      executionTimeMs,
      rowCount: result.rowCount || 0,
    };
  }

  /**
   * Create test user with specific permissions
   */
  async createTestUser(options: {
    username: string;
    permissions?: string[];
  }): Promise<void> {
    const { username, permissions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] } = options;

    // Create user if not exists
    await this.db.execute(sql.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${username}') THEN
          CREATE USER ${username} WITH PASSWORD 'test_password';
        END IF;
      END$$;
    `));

    // Grant permissions
    const tables = ['User', 'Chat', 'Message', 'Document', 'Attachment', 'Share'];

    for (const table of tables) {
      for (const permission of permissions) {
        await this.db.execute(sql.raw(`
          GRANT ${permission} ON "${table}" TO ${username}
        `));
      }
    }

    logger.info(`Created test user: ${username} with permissions: ${permissions.join(', ')}`);
  }

  /**
   * Simulate concurrent database operations
   */
  async simulateConcurrency<T>(
    operations: Array<() => Promise<T>>,
    options?: { maxConcurrency?: number }
  ): Promise<T[]> {
    const maxConcurrency = options?.maxConcurrency || 10;
    const results: T[] = [];

    // Process in batches
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map((op) => op()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Monitor query execution
   */
  async withQueryMonitoring<T>(
    fn: () => Promise<T>,
    options?: { logQueries?: boolean; slowQueryThreshold?: number }
  ): Promise<{
    result: T;
    queries: Array<{ query: string; duration: number }>;
  }> {
    const queries: Array<{ query: string; duration: number }> = [];

    // Enable query logging (simplified - would need actual query interception)
    const logQueries = options?.logQueries ?? false;
    const slowQueryThreshold = options?.slowQueryThreshold ?? 100;

    const result = await fn();

    // Log slow queries
    const slowQueries = queries.filter((q) => q.duration > slowQueryThreshold);
    if (slowQueries.length > 0) {
      logger.warn(`Found ${slowQueries.length} slow queries (>${slowQueryThreshold}ms)`);
    }

    return { result, queries };
  }

  /**
   * Add cleanup function
   */
  addCleanup(fn: () => Promise<void>): void {
    this.cleanupFns.push(fn);
  }

  /**
   * Run all cleanup functions
   */
  async cleanup(): Promise<void> {
    logger.info('Running cleanup functions');

    // Run cleanup in reverse order
    for (const fn of this.cleanupFns.reverse()) {
      try {
        await fn();
      } catch (error) {
        logger.error('Cleanup function failed:', error);
      }
    }

    // Close connection pool
    await this.pool.end();

    logger.info('Cleanup completed');
  }

  /**
   * Create a test wrapper for automatic setup/teardown
   */
  createTestWrapper() {
    const context = this;

    return {
      beforeEach: async () => {
        await context.initialize();
        await context.snapshots.checkpoint('before_test');
      },

      afterEach: async () => {
        try {
          await context.snapshots.rollbackToCheckpoint('before_test');
        } catch (error) {
          logger.error('Failed to rollback checkpoint:', error);
        }
      },

      beforeAll: async () => {
        await context.initialize();
        await context.fixtures.loadAll();
      },

      afterAll: async () => {
        await context.cleanup();
      },
    };
  }
}

/**
 * Create a Supabase test context
 */
export function createSupabaseTestContext(
  connectionString?: string
): SupabaseTestContext {
  return new SupabaseTestContext(connectionString);
}

/**
 * Test helper for RLS (Row Level Security) testing
 */
export class RLSTestHelper {
  constructor(private db: PostgresJsDatabase) {}

  /**
   * Enable RLS on a table
   */
  async enableRLS(table: string): Promise<void> {
    await this.db.execute(sql.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    logger.debug(`Enabled RLS on table: ${table}`);
  }

  /**
   * Create a policy
   */
  async createPolicy(options: {
    table: string;
    name: string;
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    using?: string;
    withCheck?: string;
  }): Promise<void> {
    const { table, name, command, using, withCheck } = options;

    let policySQL = `CREATE POLICY "${name}" ON "${table}" FOR ${command}`;

    if (using) {
      policySQL += ` USING (${using})`;
    }

    if (withCheck) {
      policySQL += ` WITH CHECK (${withCheck})`;
    }

    await this.db.execute(sql.raw(policySQL));
    logger.debug(`Created policy: ${name} on ${table}`);
  }

  /**
   * Test RLS policy with specific user
   */
  async testPolicyAsUser<T>(
    username: string,
    testFn: () => Promise<T>
  ): Promise<T> {
    // Set session user
    await this.db.execute(sql.raw(`SET SESSION AUTHORIZATION ${username}`));

    try {
      return await testFn();
    } finally {
      // Reset to default user
      await this.db.execute(sql.raw(`RESET SESSION AUTHORIZATION`));
    }
  }
}

/**
 * Create RLS test helper
 */
export function createRLSTestHelper(db: PostgresJsDatabase): RLSTestHelper {
  return new RLSTestHelper(db);
}