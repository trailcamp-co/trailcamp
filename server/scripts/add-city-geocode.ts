import 'dotenv/config';
import { db } from '../src/db/index.js';
import { locations } from '../src/db/schema.js';
import { eq, isNull, or, and, sql } from 'drizzle-orm';

const MAPBOX_KEY = process.env.MAPBOX_PUBLIC_KEY!;
const BATCH = 50; // Mapbox allows 600 req/min
const DELAY = 5100; // ~50 per 5 seconds = safe under rate limit

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string | null; state: string | null }> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,region&access_token=${MAPBOX_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    let city: string | null = null;
    let state: string | null = null;
    for (const feat of data.features || []) {
      if (feat.place_type?.includes('place')) city = feat.text;
      if (feat.place_type?.includes('region')) state = feat.properties?.short_code?.replace('US-', '') || feat.text;
    }
    return { city, state };
  } catch {
    return { city: null, state: null };
  }
}

async function main() {
  // Add city column if not exists
  console.log('Adding city column if needed...');
  await db.execute(sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS city TEXT`);

  // Get locations missing city
  const rows = await db.select({
    id: locations.id,
    name: locations.name,
    latitude: locations.latitude,
    longitude: locations.longitude,
    state: locations.state,
  }).from(locations).where(
    sql`city IS NULL`
  );

  console.log(`Found ${rows.length} locations needing city geocoding`);
  let updated = 0, skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async r => {
      const geo = await reverseGeocode(r.latitude, r.longitude);
      return { ...r, ...geo };
    }));

    for (const r of results) {
      const updates: any = {};
      if (r.city) updates.city = r.city;
      if (r.state && !rows.find(rr => rr.id === r.id)?.state) {
        updates.state = r.state;
      }
      if (Object.keys(updates).length > 0) {
        await db.execute(sql`UPDATE locations SET city = ${r.city}, state = COALESCE(state, ${r.state}) WHERE id = ${r.id}`);
        updated++;
      } else {
        skipped++;
      }
    }

    const done = i + batch.length;
    if (done % 500 === 0 || done === rows.length) {
      console.log(`${done}/${rows.length} | Updated: ${updated} | Skipped: ${skipped}`);
    }
    if (i + BATCH < rows.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  console.log(`\nDONE: ${updated} updated, ${skipped} skipped`);
  
  // Now set Google search fallback for campgrounds without external_links
  console.log('\nSetting Google search fallback links...');
  const noLink = await db.execute(sql`
    SELECT id, name, city, state FROM locations 
    WHERE source = 'recreation_gov' 
    AND external_links IS NULL 
    AND (city IS NOT NULL OR state IS NOT NULL)
  `);
  let linkCount = 0;
  for (const row of noLink.rows as any[]) {
    const parts = [row.name, row.city, row.state].filter(Boolean);
    const query = encodeURIComponent(parts.join(', '));
    const url = `https://www.google.com/search?q=${query}+campground+reservations`;
    await db.execute(sql`UPDATE locations SET external_links = ${url} WHERE id = ${row.id}`);
    linkCount++;
  }
  console.log(`Set ${linkCount} Google search fallback links`);
  
  process.exit(0);
}

main().catch(console.error);
