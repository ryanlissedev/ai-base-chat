import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('db-client');

// Enhanced database configuration with connection pooling
const dbConfig = {
  // Connection pooling settings
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  
  // Performance optimizations
  prepare: false, // Disable prepared statements for better performance in some cases
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL compatibility
  },
  
  // Connection retry settings
  max_lifetime: 60 * 30, // Maximum connection lifetime (30 minutes)
  retry_delay: 1000, // Retry delay in milliseconds
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? 'require' as const : false,
  
  // Logging
  debug: process.env.NODE_ENV === 'development',
  onnotice: (notice: any) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug({ notice }, 'PostgreSQL notice');
    }
  },
};

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, dbConfig);

// Enhanced database instance with logging
export const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
});

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error({ error }, 'Error closing database connection');
  }
}
