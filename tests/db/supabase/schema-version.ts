/**
 * Schema version tracking for database tests
 * Following Supabase's approach to schema versioning
 */

import { sql } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import crypto from 'crypto';
import { createModuleLogger } from '../../../lib/logger';

const logger = createModuleLogger('db:schema-version');

export interface SchemaVersion {
  version: string;
  description: string;
  checksum: string;
  installedOn?: Date;
  installedBy?: string;
  executionTime?: number;
}

/**
 * Schema version manager for tracking database schema changes
 */
export class SchemaVersionManager {
  private db: PostgresJsDatabase;

  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  /**
   * Initialize schema version tracking table
   */
  async initialize(): Promise<void> {
    logger.debug('Initializing schema version tracking');

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS schema_version (
        version_id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL UNIQUE,
        description TEXT,
        installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        installed_by VARCHAR(100) DEFAULT CURRENT_USER,
        execution_time INTEGER,
        checksum VARCHAR(64)
      )
    `);

    await this.db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_schema_version_installed_on
      ON schema_version(installed_on DESC)
    `);

    logger.debug('Schema version tracking initialized');
  }

  /**
   * Get current schema version
   */
  async getCurrentVersion(): Promise<SchemaVersion | null> {
    const result = await this.db.execute(sql`
      SELECT version, description, checksum, installed_on, installed_by, execution_time
      FROM schema_version
      ORDER BY installed_on DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      version: row.version as string,
      description: row.description as string,
      checksum: row.checksum as string,
      installedOn: row.installed_on as Date,
      installedBy: row.installed_by as string,
      executionTime: row.execution_time as number,
    };
  }

  /**
   * Record a new schema version
   */
  async recordVersion(version: SchemaVersion, executionTimeMs?: number): Promise<void> {
    logger.info(`Recording schema version: ${version.version}`);

    await this.db.execute(sql`
      INSERT INTO schema_version (version, description, checksum, execution_time)
      VALUES (
        ${version.version},
        ${version.description},
        ${version.checksum},
        ${executionTimeMs || null}
      )
      ON CONFLICT (version) DO UPDATE SET
        description = EXCLUDED.description,
        checksum = EXCLUDED.checksum,
        installed_on = CURRENT_TIMESTAMP,
        execution_time = EXCLUDED.execution_time
    `);

    logger.info(`Schema version ${version.version} recorded`);
  }

  /**
   * Verify schema version matches expected
   */
  async verifyVersion(expectedVersion: string): Promise<boolean> {
    const current = await this.getCurrentVersion();

    if (!current) {
      logger.warn('No schema version found');
      return false;
    }

    const matches = current.version === expectedVersion;

    if (!matches) {
      logger.warn(
        `Schema version mismatch: expected ${expectedVersion}, found ${current.version}`
      );
    }

    return matches;
  }

  /**
   * Calculate checksum for schema
   */
  async calculateSchemaChecksum(): Promise<string> {
    // Get all table and column information
    const schema = await this.db.execute(sql`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name NOT IN ('schema_version', 'test_snapshots', 'test_performance')
      ORDER BY table_name, ordinal_position
    `);

    // Create a deterministic string representation of the schema
    const schemaString = JSON.stringify(schema.rows, null, 0);

    // Calculate MD5 checksum
    const checksum = crypto.createHash('md5').update(schemaString).digest('hex');

    logger.debug(`Calculated schema checksum: ${checksum}`);
    return checksum;
  }

  /**
   * Validate schema integrity
   */
  async validateIntegrity(): Promise<boolean> {
    const current = await this.getCurrentVersion();

    if (!current) {
      logger.warn('No schema version to validate');
      return false;
    }

    const actualChecksum = await this.calculateSchemaChecksum();
    const isValid = actualChecksum === current.checksum;

    if (!isValid) {
      logger.error(
        `Schema integrity check failed: expected checksum ${current.checksum}, got ${actualChecksum}`
      );
    } else {
      logger.info('Schema integrity validated successfully');
    }

    return isValid;
  }

  /**
   * Get version history
   */
  async getVersionHistory(limit = 10): Promise<SchemaVersion[]> {
    const result = await this.db.execute(sql`
      SELECT version, description, checksum, installed_on, installed_by, execution_time
      FROM schema_version
      ORDER BY installed_on DESC
      LIMIT ${limit}
    `);

    return result.rows.map((row) => ({
      version: row.version as string,
      description: row.description as string,
      checksum: row.checksum as string,
      installedOn: row.installed_on as Date,
      installedBy: row.installed_by as string,
      executionTime: row.execution_time as number,
    }));
  }

  /**
   * Compare two schema versions
   */
  async compareVersions(version1: string, version2: string): Promise<{
    areCompatible: boolean;
    differences: string[];
  }> {
    // This is a simplified version comparison
    // In production, you'd want more sophisticated version comparison logic
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    const majorDiff = v1Parts[0] !== v2Parts[0];
    const minorDiff = v1Parts[1] !== v2Parts[1];
    const patchDiff = v1Parts[2] !== v2Parts[2];

    const differences: string[] = [];
    if (majorDiff) differences.push('Major version difference');
    if (minorDiff) differences.push('Minor version difference');
    if (patchDiff) differences.push('Patch version difference');

    // Major version differences are considered incompatible
    const areCompatible = !majorDiff;

    return { areCompatible, differences };
  }
}

/**
 * Factory function to create a schema version manager
 */
export function createSchemaVersionManager(
  db: PostgresJsDatabase
): SchemaVersionManager {
  return new SchemaVersionManager(db);
}

/**
 * Migration runner with version tracking
 */
export class MigrationRunner {
  private versionManager: SchemaVersionManager;
  private db: PostgresJsDatabase;

  constructor(db: PostgresJsDatabase) {
    this.db = db;
    this.versionManager = new SchemaVersionManager(db);
  }

  /**
   * Run a migration with version tracking
   */
  async runMigration(
    version: string,
    description: string,
    migrationFn: () => Promise<void>
  ): Promise<void> {
    logger.info(`Running migration: ${version} - ${description}`);

    const startTime = Date.now();

    try {
      // Initialize version tracking if needed
      await this.versionManager.initialize();

      // Check if migration already applied
      const current = await this.versionManager.getCurrentVersion();
      if (current && current.version >= version) {
        logger.info(`Migration ${version} already applied, skipping`);
        return;
      }

      // Run the migration
      await migrationFn();

      // Calculate schema checksum after migration
      const checksum = await this.versionManager.calculateSchemaChecksum();

      // Record the version
      const executionTime = Date.now() - startTime;
      await this.versionManager.recordVersion(
        { version, description, checksum },
        executionTime
      );

      logger.info(`Migration ${version} completed in ${executionTime}ms`);
    } catch (error) {
      logger.error(`Migration ${version} failed:`, error);
      throw error;
    }
  }

  /**
   * Run multiple migrations in sequence
   */
  async runMigrations(
    migrations: Array<{
      version: string;
      description: string;
      migration: () => Promise<void>;
    }>
  ): Promise<void> {
    for (const { version, description, migration } of migrations) {
      await this.runMigration(version, description, migration);
    }
  }
}