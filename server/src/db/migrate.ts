import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  console.log('Running migrations...');
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: path.join(__dirname, '..', '..', 'drizzle') });

  console.log('Migrations complete!');
  await client.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
