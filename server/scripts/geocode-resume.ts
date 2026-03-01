import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

const MAPBOX_KEY = process.env.MAPBOX_PUBLIC_KEY!;
const BATCH = 40;
const DELAY = 4200;

async function geocode(lat: number, lng: number): Promise<{ city: string | null; state: string | null }> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,region&access_token=${MAPBOX_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    let city: string | null = null;
    let state: string | null = null;
    for (const f of data.features || []) {
      if (f.place_type?.includes('place')) city = f.text;
      if (f.place_type?.includes('region')) state = f.properties?.short_code?.replace('US-', '') || f.text;
    }
    return { city, state };
  } catch { return { city: null, state: null }; }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const result = await db.execute(sql`
    SELECT id, latitude, longitude, state FROM locations 
    WHERE city IS NULL ORDER BY id
  `);
  const locs = [...result] as any[];
  console.log(`Geocoding ${locs.length} locations...`);
  
  let updated = 0;
  let i = 0;
  while (i < locs.length) {
    const end = Math.min(i + BATCH, locs.length);
    const batch = locs.slice(i, end);
    
    const geos = await Promise.all(batch.map(r => geocode(r.latitude, r.longitude)));
    
    for (let j = 0; j < batch.length; j++) {
      const loc = batch[j];
      const geo = geos[j];
      if (geo.city || (geo.state && !loc.state)) {
        await db.execute(sql`
          UPDATE locations SET city = COALESCE(${geo.city}, city), state = COALESCE(state, ${geo.state})
          WHERE id = ${loc.id}
        `);
        updated++;
      }
    }

    i = end;
    if (i % 500 < BATCH || i >= locs.length) {
      console.log(`${i}/${locs.length} | Updated: ${updated}`);
    }
    if (i < locs.length) await sleep(DELAY);
  }

  console.log(`DONE: ${updated} updated`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
