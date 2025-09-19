import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Retry wrapper for database operations with exponential backoff
 *
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @param baseDelay - Initial delay in milliseconds (default: 1000ms)
 *                    Doubles with each retry up to max 10 seconds
 * @param operationName - Name for logging purposes
 *
 * Exponential backoff formula: delay = min(baseDelay * 2^(attempt-1), 10000)
 * Example delays: 1s, 2s, 4s, 8s, 10s (capped)
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000,
  operationName = 'database operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
      
      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, error);
        throw error;
      }

      console.log(`⏳ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Unexpected error in retry logic for ${operationName}`);
}

/**
 * Test if database connection is working
 */
async function testConnection(connection: postgres.Sql): Promise<void> {
  try {
    await connection`SELECT 1 as test`;
  } catch (error) {
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const runTestMigration = async (databaseUrl: string) => {
  if (!databaseUrl) {
    throw new Error('Database URL is not defined');
  }

  console.log('⏳ Connecting to test database...');
  
  // Create connection with retry and timeout settings
  const connection = postgres(databaseUrl, { 
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    // Disable SSL for test database
    ssl: false,
    // Add connection retry logic
    connection: {
      application_name: 'playwright-test-migration'
    }
  });
  
  let db: ReturnType<typeof drizzle>;

  try {
    // Test connection with retry
    await withRetry(
      () => testConnection(connection),
      5,
      1000,
      'database connection test'
    );
    
    db = drizzle(connection);

    // Run migrations with retry
    console.log('⏳ Running test database migrations...');
    const start = Date.now();
    
    await withRetry(
      () => migrate(db, { migrationsFolder: './lib/db/migrations' }),
      3,
      2000,
      'database migration'
    );
    
    const end = Date.now();
    console.log(`✅ Test migrations completed in ${end - start}ms`);
  } catch (error) {
    console.error('❌ Test migration failed:', error);
    
    // Add more context to the error
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      throw new Error(
        `Database connection refused. Make sure the test database container is running on the expected port. ` +
        `Original error: ${error.message}`
      );
    }
    
    throw error;
  } finally {
    try {
      await connection.end();
    } catch (endError) {
      console.warn('Warning: Error closing database connection:', endError);
    }
  }
};