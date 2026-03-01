/**
 * Migrates all data from the local SQLite database to Supabase PostgreSQL.
 * Run once: npx tsx src/db/seed-from-sqlite.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import Database from 'better-sqlite3';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const SQLITE_PATH = path.join(__dirname, '..', '..', 'trailcamp.db');
const BATCH_SIZE = 200;

async function main() {
  const sqliteDb = new Database(SQLITE_PATH, { readonly: true });
  const pgClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  const pgDb = drizzle(pgClient, { schema });

  // ─── Locations ───────────────────────────────────────────────────────
  console.log('Migrating locations...');
  const locs = sqliteDb.prepare('SELECT * FROM locations').all() as Record<string, unknown>[];
  console.log(`  Found ${locs.length} locations in SQLite`);

  let locCount = 0;
  for (let i = 0; i < locs.length; i += BATCH_SIZE) {
    const batch = locs.slice(i, i + BATCH_SIZE);
    const values = batch.map((l) => ({
      name: String(l.name ?? ''),
      description: l.description as string | null,
      latitude: Number(l.latitude),
      longitude: Number(l.longitude),
      category: String(l.category ?? 'campsite'),
      subType: l.sub_type as string | null,
      source: l.source as string | null,
      sourceId: l.source_id as string | null,
      cellSignal: l.cell_signal as string | null,
      shade: l.shade as number | null,
      levelGround: l.level_ground as number | null,
      waterNearby: l.water_nearby as number | null,
      waterAvailable: l.water_available as number | null,
      dumpNearby: l.dump_nearby as number | null,
      maxVehicleLength: l.max_vehicle_length as number | null,
      stayLimitDays: l.stay_limit_days as number | null,
      season: l.season as string | null,
      crowding: l.crowding as string | null,
      costPerNight: l.cost_per_night != null ? Number(l.cost_per_night) : null,
      trailTypes: l.trail_types as string | null,
      difficulty: l.difficulty as string | null,
      distanceMiles: l.distance_miles != null ? Number(l.distance_miles) : null,
      elevationGainFt: l.elevation_gain_ft as number | null,
      permitRequired: l.permit_required as number | null,
      permitInfo: l.permit_info as string | null,
      sceneryRating: l.scenery_rating as number | null,
      bestSeason: l.best_season as string | null,
      photos: l.photos as string | null,
      externalLinks: l.external_links as string | null,
      notes: l.notes as string | null,
      hours: l.hours as string | null,
      featured: (l.featured as number) || 0,
      userRating: l.user_rating as number | null,
      userNotes: l.user_notes as string | null,
      visited: (l.visited as number) || 0,
      visitedDate: l.visited_date as string | null,
      wantToVisit: (l.want_to_visit as number) || 0,
      favorited: (l.favorited as number) || 0,
      state: l.state as string | null,
      county: l.county as string | null,
      country: l.country as string | null,
      groupId: l.group_id as number | null,
      isGroupPrimary: (l.is_group_primary as number) || 0,
      // Community data: no user_id, visibility public
      userId: null,
      visibility: 'public' as const,
    }));

    await pgDb.insert(schema.locations).values(values);
    locCount += batch.length;
    process.stdout.write(`\r  Migrated ${locCount}/${locs.length} locations`);
  }
  console.log('\n  ✅ Locations done');

  // ─── Trips ─────────────────────────────────────────────────────────
  // Skip trips — they were single-user and will be created fresh by users
  console.log('Skipping trips (single-user data, users will create their own)');

  // ─── Summary ───────────────────────────────────────────────────────
  const [countRes] = await pgDb.select({ c: sql<number>`count(*)` }).from(schema.locations);
  console.log(`\n✅ Migration complete! ${countRes.c} locations in PostgreSQL`);

  sqliteDb.close();
  await pgClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
