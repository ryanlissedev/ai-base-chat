import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { existsSync } from 'node:fs';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('db:migrate');

// Load environment configuration with fallbacks
const envFiles = ['.env.local', '.env.test', '.env'];
const envFile = envFiles.find(file => existsSync(file)) || '.env.local';

config({
  path: envFile,
});

const runMigrate = async () => {
  // Check for skip flag first
  if (process.env.SKIP_DB_MIGRATION === 'true') {
    logger.info('🔧 Database migration skipped (SKIP_DB_MIGRATION=true)');
    logger.info('✅ Build can proceed without database connectivity');
    process.exit(0);
  }

  // Check for database URL with fallbacks
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  // Detect build environment (Vercel, CI, or local build without database)
  const isBuildEnvironment = process.env.VERCEL === '1' || 
                            process.env.CI === 'true' ||
                            process.env.NODE_ENV === 'production';
  
  // Check if database URL is a local file (SQLite) that won't work in cloud environments
  const isLocalFileDatabase = databaseUrl && (
    databaseUrl.startsWith('file:') || 
    databaseUrl.startsWith('sqlite:') ||
    databaseUrl.includes('./test.db')
  );
  
  if (!databaseUrl || (isBuildEnvironment && isLocalFileDatabase)) {
    if (isBuildEnvironment) {
      const reason = !databaseUrl 
        ? 'no database URL provided' 
        : 'local file database not available in cloud environment';
      logger.info(`🔧 Skipping database migration during build (${reason})`);
      logger.info('✅ Build can proceed without database connectivity');
      process.exit(0);
    }
    
    if (!databaseUrl) {
      logger.error('❌ No database URL found');
      logger.error('Please set POSTGRES_URL or DATABASE_URL environment variable');
      logger.error('Available environment variables:');
      Object.keys(process.env)
        .filter(key => key.includes('DATABASE') || key.includes('POSTGRES'))
        .forEach(key => logger.error(`  ${key}=${process.env[key]}`));
      process.exit(1);
    }
  }

  logger.info(`🔗 Connecting to database: ${databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`);

  try {
    // Create connection with enhanced timeout and error handling
    const connection = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 30,
      connect_timeout: 30,
      prepare: false,
      onnotice: () => {}, // Suppress notices during migration
    });

    const db = drizzle(connection);

    logger.info('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    logger.info(`✅ Migrations completed in ${end - start}ms`);
    
    // Close connection gracefully
    await connection.end();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed');

    if (error instanceof Error) {
      // Provide specific error handling for common issues
      if (error.message.includes('ECONNREFUSED')) {
        logger.error('🔌 Connection refused - is the database running?');
        logger.error('For test database, try: make test-db-start');
      } else if (error.message.includes('ENOTFOUND')) {
        logger.error('🌐 Host not found - check your database URL');
      } else if (error.message.includes('password authentication failed')) {
        logger.error('🔐 Authentication failed - check username/password');
      } else if (error.message.includes('timeout')) {
        logger.error('⏰ Connection timeout - database may be overloaded');
      } else {
        logger.error('Error details: %s', error.message);
      }
    } else {
      logger.error('Migration error: %s', String(error));
    }
    
    process.exit(1);
  }
};

runMigrate();
