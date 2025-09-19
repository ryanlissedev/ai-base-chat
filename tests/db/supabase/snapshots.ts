/**
 * Database snapshot management for test isolation and rollback
 * Based on Supabase's testing patterns
 */

import { sql } from 'drizzle-orm';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createModuleLogger } from '../../../lib/logger';

const logger = createModuleLogger('db:snapshots');

export interface Snapshot {
  id?: number;
  name: string;
  tableName: string;
  data: any[];
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface SnapshotManifest {
  id?: number;
  name: string;
  tables: string[];
  rowCount: number;
  checksum: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Database snapshot manager for test data isolation
 */
export class SnapshotManager {
  private db: PostgresJsDatabase;
  private snapshots: Map<string, Snapshot[]> = new Map();

  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  /**
   * Initialize snapshot tables
   */
  async initialize(): Promise<void> {
    logger.debug('Initializing snapshot tables');

    // Create snapshot manifest table
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_snapshot_manifest (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        tables TEXT[] NOT NULL,
        row_count INTEGER NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create snapshot data table
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_snapshot_data (
        id SERIAL PRIMARY KEY,
        manifest_id INTEGER REFERENCES test_snapshot_manifest(id) ON DELETE CASCADE,
        table_name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_manifest_id (manifest_id),
        INDEX idx_table_name (table_name)
      )
    `);

    logger.debug('Snapshot tables initialized');
  }

  /**
   * Create a snapshot of specified tables
   */
  async createSnapshot(
    name: string,
    tables: string[] = ['User', 'Chat', 'Message'],
    metadata?: Record<string, any>
  ): Promise<SnapshotManifest> {
    logger.info(`Creating snapshot: ${name}`);

    const snapshotData: Snapshot[] = [];
    let totalRows = 0;
    let checksumData = '';

    for (const table of tables) {
      try {
        // Get all data from table
        const result = await this.db.execute(sql.raw(`SELECT * FROM "${table}"`));
        const rows = result.rows;

        snapshotData.push({
          name,
          tableName: table,
          data: rows,
        });

        totalRows += rows.length;
        checksumData += JSON.stringify(rows);

        logger.debug(`Captured ${rows.length} rows from ${table}`);
      } catch (error) {
        logger.warn(`Failed to snapshot table ${table}:`, error);
      }
    }

    // Calculate checksum
    const crypto = await import('crypto');
    const checksum = crypto.createHash('md5').update(checksumData).digest('hex');

    // Store manifest
    const manifestResult = await this.db.execute(sql`
      INSERT INTO test_snapshot_manifest (name, tables, row_count, checksum, metadata)
      VALUES (
        ${name},
        ${sql.raw(`ARRAY[${tables.map(t => `'${t}'`).join(',')}]`)},
        ${totalRows},
        ${checksum},
        ${JSON.stringify(metadata) || null}
      )
      RETURNING *
    `);

    const manifest = manifestResult.rows[0] as any;

    // Store snapshot data
    for (const snapshot of snapshotData) {
      await this.db.execute(sql`
        INSERT INTO test_snapshot_data (manifest_id, table_name, data)
        VALUES (
          ${manifest.id},
          ${snapshot.tableName},
          ${JSON.stringify(snapshot.data)}
        )
      `);
    }

    // Cache in memory for faster access
    this.snapshots.set(name, snapshotData);

    logger.info(`Snapshot created: ${name} (${totalRows} rows, checksum: ${checksum})`);

    return {
      id: manifest.id,
      name: manifest.name,
      tables: manifest.tables,
      rowCount: manifest.row_count,
      checksum: manifest.checksum,
      createdAt: manifest.created_at,
      metadata: manifest.metadata,
    };
  }

  /**
   * Restore database from snapshot
   */
  async restoreSnapshot(name: string): Promise<void> {
    logger.info(`Restoring snapshot: ${name}`);

    // Get manifest
    const manifestResult = await this.db.execute(sql`
      SELECT * FROM test_snapshot_manifest
      WHERE name = ${name}
    `);

    if (manifestResult.rows.length === 0) {
      throw new Error(`Snapshot not found: ${name}`);
    }

    const manifest = manifestResult.rows[0] as any;

    // Get snapshot data
    const dataResult = await this.db.execute(sql`
      SELECT table_name, data
      FROM test_snapshot_data
      WHERE manifest_id = ${manifest.id}
      ORDER BY id
    `);

    // Begin transaction for atomic restore
    await this.db.execute(sql`BEGIN`);

    try {
      // Clear existing data in reverse dependency order
      const tables = manifest.tables as string[];
      const clearOrder = [...tables].reverse();

      for (const table of clearOrder) {
        await this.db.execute(sql.raw(`DELETE FROM "${table}"`));
        logger.debug(`Cleared table: ${table}`);
      }

      // Restore data in original order
      for (const row of dataResult.rows) {
        const tableName = row.table_name as string;
        const data = row.data as any[];

        if (data && data.length > 0) {
          // Build insert query dynamically
          const columns = Object.keys(data[0]);
          const values = data.map(row => {
            return columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              return value;
            }).join(',');
          });

          const insertQuery = `
            INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(',')})
            VALUES ${values.map(v => `(${v})`).join(',')}
          `;

          await this.db.execute(sql.raw(insertQuery));
          logger.debug(`Restored ${data.length} rows to ${tableName}`);
        }
      }

      await this.db.execute(sql`COMMIT`);
      logger.info(`Snapshot restored successfully: ${name}`);
    } catch (error) {
      await this.db.execute(sql`ROLLBACK`);
      logger.error(`Failed to restore snapshot: ${name}`, error);
      throw error;
    }
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(name: string): Promise<void> {
    logger.info(`Deleting snapshot: ${name}`);

    await this.db.execute(sql`
      DELETE FROM test_snapshot_manifest
      WHERE name = ${name}
    `);

    this.snapshots.delete(name);
    logger.info(`Snapshot deleted: ${name}`);
  }

  /**
   * List available snapshots
   */
  async listSnapshots(): Promise<SnapshotManifest[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM test_snapshot_manifest
      ORDER BY created_at DESC
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      tables: row.tables,
      rowCount: row.row_count,
      checksum: row.checksum,
      createdAt: row.created_at,
      metadata: row.metadata,
    }));
  }

  /**
   * Create a checkpoint (temporary snapshot)
   */
  async checkpoint(name?: string): Promise<string> {
    const checkpointName = name || `checkpoint_${Date.now()}`;
    await this.createSnapshot(checkpointName, undefined, { type: 'checkpoint' });
    return checkpointName;
  }

  /**
   * Rollback to checkpoint and delete it
   */
  async rollbackToCheckpoint(checkpointName: string): Promise<void> {
    await this.restoreSnapshot(checkpointName);
    await this.deleteSnapshot(checkpointName);
  }

  /**
   * Clean up old snapshots
   */
  async cleanupOldSnapshots(olderThan: Date | string): Promise<number> {
    const date = typeof olderThan === 'string' ? new Date(olderThan) : olderThan;

    const result = await this.db.execute(sql`
      DELETE FROM test_snapshot_manifest
      WHERE created_at < ${date.toISOString()}
      RETURNING id
    `);

    const deletedCount = result.rows.length;
    logger.info(`Cleaned up ${deletedCount} old snapshots`);

    return deletedCount;
  }

  /**
   * Verify snapshot integrity
   */
  async verifySnapshot(name: string): Promise<boolean> {
    const manifestResult = await this.db.execute(sql`
      SELECT * FROM test_snapshot_manifest
      WHERE name = ${name}
    `);

    if (manifestResult.rows.length === 0) {
      return false;
    }

    const manifest = manifestResult.rows[0] as any;

    // Get snapshot data and recalculate checksum
    const dataResult = await this.db.execute(sql`
      SELECT data FROM test_snapshot_data
      WHERE manifest_id = ${manifest.id}
      ORDER BY id
    `);

    let checksumData = '';
    for (const row of dataResult.rows) {
      checksumData += JSON.stringify(row.data);
    }

    const crypto = await import('crypto');
    const actualChecksum = crypto.createHash('md5').update(checksumData).digest('hex');

    const isValid = actualChecksum === manifest.checksum;

    if (!isValid) {
      logger.warn(
        `Snapshot integrity check failed for ${name}: expected ${manifest.checksum}, got ${actualChecksum}`
      );
    }

    return isValid;
  }

  /**
   * Compare two snapshots
   */
  async compareSnapshots(
    snapshot1: string,
    snapshot2: string
  ): Promise<{
    identical: boolean;
    differences: Array<{ table: string; diff: string }>;
  }> {
    const [snap1, snap2] = await Promise.all([
      this.getSnapshotData(snapshot1),
      this.getSnapshotData(snapshot2),
    ]);

    const differences: Array<{ table: string; diff: string }> = [];

    // Compare each table
    const allTables = new Set([
      ...Object.keys(snap1),
      ...Object.keys(snap2),
    ]);

    for (const table of allTables) {
      const data1 = snap1[table] || [];
      const data2 = snap2[table] || [];

      if (data1.length !== data2.length) {
        differences.push({
          table,
          diff: `Row count differs: ${data1.length} vs ${data2.length}`,
        });
        continue;
      }

      // Simple comparison - could be enhanced with deep diff
      const json1 = JSON.stringify(data1);
      const json2 = JSON.stringify(data2);

      if (json1 !== json2) {
        differences.push({
          table,
          diff: 'Data differs',
        });
      }
    }

    return {
      identical: differences.length === 0,
      differences,
    };
  }

  /**
   * Get snapshot data
   */
  private async getSnapshotData(name: string): Promise<Record<string, any[]>> {
    const manifestResult = await this.db.execute(sql`
      SELECT id FROM test_snapshot_manifest
      WHERE name = ${name}
    `);

    if (manifestResult.rows.length === 0) {
      throw new Error(`Snapshot not found: ${name}`);
    }

    const manifestId = (manifestResult.rows[0] as any).id;

    const dataResult = await this.db.execute(sql`
      SELECT table_name, data
      FROM test_snapshot_data
      WHERE manifest_id = ${manifestId}
    `);

    const snapshotData: Record<string, any[]> = {};

    for (const row of dataResult.rows) {
      snapshotData[row.table_name as string] = row.data as any[];
    }

    return snapshotData;
  }
}

/**
 * Create a snapshot manager instance
 */
export function createSnapshotManager(db: PostgresJsDatabase): SnapshotManager {
  return new SnapshotManager(db);
}

/**
 * Test helper for snapshot-based testing
 */
export class SnapshotTestHelper {
  private snapshotManager: SnapshotManager;
  private activeCheckpoint?: string;

  constructor(db: PostgresJsDatabase) {
    this.snapshotManager = new SnapshotManager(db);
  }

  /**
   * Setup before test
   */
  async beforeEach(): Promise<void> {
    await this.snapshotManager.initialize();
    this.activeCheckpoint = await this.snapshotManager.checkpoint();
  }

  /**
   * Cleanup after test
   */
  async afterEach(): Promise<void> {
    if (this.activeCheckpoint) {
      await this.snapshotManager.rollbackToCheckpoint(this.activeCheckpoint);
      this.activeCheckpoint = undefined;
    }
  }

  /**
   * Create a named snapshot for later reference
   */
  async createSnapshot(name: string): Promise<void> {
    await this.snapshotManager.createSnapshot(name);
  }

  /**
   * Restore from a named snapshot
   */
  async restoreSnapshot(name: string): Promise<void> {
    await this.snapshotManager.restoreSnapshot(name);
  }

  /**
   * Run test with automatic rollback
   */
  async withRollback<T>(testFn: () => Promise<T>): Promise<T> {
    const checkpoint = await this.snapshotManager.checkpoint();

    try {
      return await testFn();
    } finally {
      await this.snapshotManager.rollbackToCheckpoint(checkpoint);
    }
  }
}