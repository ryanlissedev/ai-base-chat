import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { existsSync } from 'fs';

// Load environment configuration with fallbacks
const envFiles = ['.env.local', '.env.test', '.env'];
const envFile = envFiles.find(file => existsSync(file)) || '.env.local';

config({
  path: envFile,
});

const runMigrate = async () => {
  // Check for database URL with fallbacks
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found');
    console.error('Please set POSTGRES_URL or DATABASE_URL environment variable');
    console.error('Available environment variables:');
    Object.keys(process.env)
      .filter(key => key.includes('DATABASE') || key.includes('POSTGRES'))
      .forEach(key => console.error(`  ${key}=${process.env[key]}`));
    process.exit(1);
  }

  console.log(`🔗 Connecting to database: ${databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`);

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

    console.log('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');
    
    // Close connection gracefully
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed');
    
    if (error instanceof Error) {
      // Provide specific error handling for common issues
      if (error.message.includes('ECONNREFUSED')) {
        console.error('🔌 Connection refused - is the database running?');
        console.error('For test database, try: make test-db-start');
      } else if (error.message.includes('ENOTFOUND')) {
        console.error('🌐 Host not found - check your database URL');
      } else if (error.message.includes('password authentication failed')) {
        console.error('🔐 Authentication failed - check username/password');
      } else if (error.message.includes('timeout')) {
        console.error('⏰ Connection timeout - database may be overloaded');
      } else {
        console.error('Error details:', error.message);
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
};

runMigrate();
