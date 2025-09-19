import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('db:pool');

export interface PoolConfig {
  max?: number;              // Maximum number of connections in pool
  idle_timeout?: number;      // Seconds to keep idle connections
  connect_timeout?: number;   // Seconds to wait for connection
  max_lifetime?: number;      // Maximum lifetime of a connection in seconds
}

export interface PooledDatabase {
  db: PostgresJsDatabase;
  client: Sql;
  end: () => Promise<void>;
  getPoolStats: () => PoolStats;
}

export interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
  max: number;
}

/**
 * Create a pooled database connection
 * @param connectionString Database connection string
 * @param config Pool configuration options
 * @returns Pooled database instance
 */
export function createPooledDatabase(
  connectionString: string,
  config: PoolConfig = {}
): PooledDatabase {
  const defaultConfig: Required<PoolConfig> = {
    max: config.max ?? 10,
    idle_timeout: config.idle_timeout ?? 30,
    connect_timeout: config.connect_timeout ?? 30,
    max_lifetime: config.max_lifetime ?? 60 * 30, // 30 minutes
  };

  logger.debug('Creating database pool with config: %o', defaultConfig);

  // Create the postgres client with pooling configuration
  const client = postgres(connectionString, {
    max: defaultConfig.max,
    idle_timeout: defaultConfig.idle_timeout,
    connect_timeout: defaultConfig.connect_timeout,
    max_lifetime: defaultConfig.max_lifetime,
    onnotice: (notice) => {
      logger.debug('Database notice: %s', notice.message || String(notice));
    },
    onparameter: (key, value) => {
      logger.trace(`Database parameter: ${key} = ${value}`);
    },
    prepare: false, // Disable prepared statements for better compatibility
  });

  // Create Drizzle ORM instance
  const db = drizzle(client);

  // Function to get pool statistics
  const getPoolStats = (): PoolStats => {
    // The postgres library doesn't expose direct pool stats,
    // but we can infer from the configuration
    return {
      total: defaultConfig.max,
      idle: 0, // Would need to track this manually
      waiting: 0, // Would need to track this manually
      max: defaultConfig.max,
    };
  };

  // Graceful shutdown function
  const end = async (): Promise<void> => {
    logger.info('Closing database connection pool...');
    try {
      await client.end();
      logger.info('Database connection pool closed successfully');
    } catch (error) {
      logger.error('Error closing database pool: %s', error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  return {
    db,
    client,
    end,
    getPoolStats,
  };
}

// Singleton instance for the main database
let mainPool: PooledDatabase | null = null;

/**
 * Get or create the main database pool
 * @returns The main pooled database instance
 */
export function getMainPool(): PooledDatabase {
  if (!mainPool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('No database connection string provided. Set POSTGRES_URL or DATABASE_URL environment variable.');
    }

    const poolConfig: PoolConfig = {
      max: process.env.DB_POOL_MAX ? Number.parseInt(process.env.DB_POOL_MAX, 10) : 10,
      idle_timeout: process.env.DB_POOL_IDLE_TIMEOUT ? Number.parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) : 30,
      connect_timeout: process.env.DB_POOL_CONNECT_TIMEOUT ? Number.parseInt(process.env.DB_POOL_CONNECT_TIMEOUT, 10) : 30,
    };

    mainPool = createPooledDatabase(connectionString, poolConfig);

    // Setup graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, closing database pool...');
        await mainPool?.end();
      });

      process.on('SIGINT', async () => {
        logger.info('Received SIGINT, closing database pool...');
        await mainPool?.end();
      });
    }
  }

  return mainPool;
}

// Export a convenience function to get the db instance directly
export function getDb(): PostgresJsDatabase {
  return getMainPool().db;
}