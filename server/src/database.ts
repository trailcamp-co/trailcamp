// Backward-compatible getDb() — now returns the Drizzle instance
import { db } from './db';

export function getDb() {
  return db;
}
