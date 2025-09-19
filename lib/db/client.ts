import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getMainPool } from './pool';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Use pooled connection if available, otherwise fall back to direct connection
let db: ReturnType<typeof drizzle> & { $client: any };
try {
  // Try to use the pooled connection
  const pool = getMainPool();
  db = Object.assign(pool.db, { $client: pool.client });
} catch (error) {
  // Fallback to direct connection if pool fails
  // biome-ignore lint: Forbidden non-null assertion.
  const client = postgres(process.env.POSTGRES_URL!);
  const drizzleDb = drizzle(client);
  db = Object.assign(drizzleDb, { $client: client });
}

export { db };
