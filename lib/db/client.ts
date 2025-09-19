import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getMainPool } from './pool';
import { createModuleLogger } from '@/lib/logger';

const logger = createModuleLogger('db:client');

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Circuit breaker pattern for database operations
class DatabaseCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Database circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`Database circuit breaker opened after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

const circuitBreaker = new DatabaseCircuitBreaker();

// Enhanced connection with retry logic
async function createDatabaseConnection() {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Database connection attempt ${attempt}/${maxRetries}`);
      
      // Try to use the pooled connection
      const pool = getMainPool();
      const db = Object.assign(pool.db, { $client: pool.client });
      
      logger.info('Successfully connected to database using pool');
      return db;
    } catch (poolError) {
      logger.warn({ poolError, attempt }, `Pool connection failed on attempt ${attempt}`);
      
      if (attempt === maxRetries) {
        // Final attempt: fallback to direct connection
        try {
          const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
          
          if (!connectionString) {
            throw new Error('No database connection string provided');
          }

          const client = postgres(connectionString, {
            max: 1, // Single connection for fallback
            idle_timeout: 30,
            connect_timeout: 10,
            onnotice: (notice) => {
              logger.debug({ notice }, 'Database notice received');
            },
          });
          
          const drizzleDb = drizzle(client);
          const db = Object.assign(drizzleDb, { $client: client });
          
          logger.warn('Using fallback direct database connection');
          return db;
        } catch (fallbackError) {
          logger.error({ fallbackError, maxRetries }, 'All database connection attempts failed');
          throw new Error(`Database connection failed after ${maxRetries} attempts`);
        }
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.debug(`Waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Database connection failed');
}

// Create a placeholder database that will be initialized asynchronously
let db: ReturnType<typeof drizzle> & { $client: any } = new Proxy({} as any, {
  get() {
    throw new Error('Database connection is not available yet');
  }
});

// Initialize database connection with error handling
(async () => {
  try {
    db = await createDatabaseConnection();
  } catch (error) {
    logger.error({ error }, 'Failed to initialize database connection');
    // Keep the error proxy
    db = new Proxy({} as any, {
      get() {
        throw new Error('Database connection is not available');
      }
    });
  }
})();

// Enhanced database operations with circuit breaker
const enhancedDb = new Proxy({} as any, {
  get(target, prop) {
    const original = (db as any)[prop];
    
    // Wrap database operations with circuit breaker
    if (typeof original === 'function' && (prop === 'execute' || prop === 'query' || prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete')) {
      return async (...args: any[]) => {
        return circuitBreaker.execute(() => original.apply(db, args));
      };
    }
    
    return original;
  }
});

export { enhancedDb as db, circuitBreaker };
