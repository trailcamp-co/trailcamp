import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Connection pool for queries
const queryClient = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// For migrations / one-off scripts that need a single connection
export function createMigrationClient() {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  return postgres(databaseUrl, { max: 1 });
}
