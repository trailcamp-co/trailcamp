/**
 * Import campgrounds from OpenStreetMap that we're missing.
 * Fetches tourism=camp_site nodes and ways from CONUS,
 * deduplicates against existing locations, imports new ones.
 */
import 'dotenv/config';
import { db } from '../src/db/index.js';
import { locations } from '../src/db/schema.js';
import { sql } from 'drizzle-orm';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEDUP_DISTANCE_KM = 0.5; // 500m dedup radius
const MAPBOX_KEY = process.env.MAPBOX_PUBLIC_KEY!;

interface OsmCampsite {
  id: number;
  lat: number;
  lng: number;
  name: string;
  tags: Record<string, string>;
}

async function fetchOsmCampgrounds(): Promise<OsmCampsite[]> {
  console.log('Fetching OSM campgrounds (nodes)...');
  const nodeQuery = `[out:json][timeout:120];node["tourism"="camp_site"](24,-125,50,-66);out body;`;
  const nodeRes = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(nodeQuery)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(180000),
  });
  const nodeData = await nodeRes.json();
  console.log(`  Nodes: ${nodeData.elements.length}`);

  const nodes: OsmCampsite[] = nodeData.elements.map((e: any) => ({
    id: e.id,
    lat: e.lat,
    lng: e.lon,
    name: e.tags?.name || '',
    tags: e.tags || {},
  }));

  console.log('Fetching OSM campgrounds (ways with centers)...');
  const wayQuery = `[out:json][timeout:120];way["tourism"="camp_site"](24,-125,50,-66);out center;`;
  const wayRes = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(wayQuery)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(180000),
  });
  const wayData = await wayRes.json();
  console.log(`  Ways: ${wayData.elements.length}`);

  const ways: OsmCampsite[] = wayData.elements
    .filter((e: any) => e.center)
    .map((e: any) => ({
      id: e.id,
      lat: e.center.lat,
      lng: e.center.lon,
      name: e.tags?.name || '',
      tags: e.tags || {},
    }));

  return [...nodes, ...ways];
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function determineSubType(tags: Record<string, string>): string {
  const name = (tags.name || '').toLowerCase();
  const fee = tags.fee;
  
  // Check for boondocking indicators
  if (tags.backcountry === 'yes' || tags.camp_type === 'primitive' || tags.camp_type === 'dispersed') return 'boondocking';
  if (name.includes('dispersed') || name.includes('boondock') || name.includes('primitive camp') || name.includes('blm ')) return 'boondocking';
  if (fee === 'no' && (name.includes('free') || name.includes('wild'))) return 'boondocking';
  
  return 'campground';
}

function extractAmenities(tags: Record<string, string>) {
  return {
    waterAvailable: tags.drinking_water === 'yes' || tags['water:drinking'] === 'yes' ? 1 : 0,
    hasToilets: tags.toilets === 'yes' || tags.toilet === 'yes' ? 1 : 0,
    hasShowers: tags.shower === 'yes' || tags.showers === 'yes' ? 1 : 0,
    hasElectricity: tags.power_supply === 'yes' || tags.electricity === 'yes' ? 1 : 0,
    petsAllowed: tags.dog === 'yes' || tags.pets === 'yes' ? 1 : null,
    isFree: tags.fee === 'no' ? 1 : 0,
    fee: tags.fee_amount || tags.charge || null,
  };
}

async function geocodeCity(lat: number, lng: number): Promise<{ city: string | null; state: string | null }> {
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

async function main() {
  // 1. Fetch from OSM
  const osmCamps = await fetchOsmCampgrounds();
  console.log(`\nTotal OSM campgrounds: ${osmCamps.length}`);

  // Filter: must have a name
  const named = osmCamps.filter(c => c.name.length > 0);
  console.log(`With names: ${named.length}`);

  // 2. Load existing locations for dedup
  console.log('Loading existing locations...');
  const existing = await db.execute(sql`SELECT id, name, latitude, longitude FROM locations`);
  const existingLocs = [...existing] as any[];
  console.log(`Existing locations: ${existingLocs.length}`);

  // 3. Deduplicate
  console.log('Deduplicating...');
  const newCamps: OsmCampsite[] = [];
  
  // Build a rough grid for faster dedup (0.01 degree cells ~1km)
  const grid: Map<string, any[]> = new Map();
  for (const loc of existingLocs) {
    const key = `${Math.floor(loc.latitude * 10)},${Math.floor(loc.longitude * 10)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(loc);
  }

  for (const camp of named) {
    const key = `${Math.floor(camp.lat * 10)},${Math.floor(camp.lng * 10)}`;
    // Check surrounding cells
    let isDupe = false;
    for (let dx = -1; dx <= 1 && !isDupe; dx++) {
      for (let dy = -1; dy <= 1 && !isDupe; dy++) {
        const nearKey = `${Math.floor(camp.lat * 10) + dx},${Math.floor(camp.lng * 10) + dy}`;
        const nearby = grid.get(nearKey) || [];
        for (const loc of nearby) {
          if (haversineKm(camp.lat, camp.lng, loc.latitude, loc.longitude) < DEDUP_DISTANCE_KM) {
            isDupe = true;
            break;
          }
        }
      }
    }
    if (!isDupe) newCamps.push(camp);
  }

  console.log(`New unique campgrounds to import: ${newCamps.length}`);

  // 4. Import in batches with geocoding
  const BATCH = 30;
  const GEOCODE_DELAY = 3000;
  let imported = 0;

  for (let i = 0; i < newCamps.length; i += BATCH) {
    const batch = newCamps.slice(i, i + BATCH);
    
    // Geocode batch
    const geos = await Promise.all(batch.map(c => geocodeCity(c.lat, c.lng)));
    
    for (let j = 0; j < batch.length; j++) {
      const camp = batch[j];
      const geo = geos[j];
      const amenities = extractAmenities(camp.tags);
      const subType = determineSubType(camp.tags);
      
      try {
        await db.insert(locations).values({
          name: camp.name,
          latitude: camp.lat,
          longitude: camp.lng,
          category: 'campsite',
          subType: subType,
          source: 'osm',
          sourceId: `osm-camp-${camp.id}`,
          city: geo.city,
          state: geo.state,
          country: 'US',
          waterAvailable: amenities.waterAvailable,
          hasToilets: amenities.hasToilets,
          hasShowers: amenities.hasShowers,
          hasElectricity: amenities.hasElectricity,
          petsAllowed: amenities.petsAllowed,
          isFree: amenities.isFree,
          fee: amenities.fee,
          featured: 0,
          description: camp.tags.description || camp.tags.note || null,
        });
        imported++;
      } catch (e: any) {
        // Skip duplicates
        if (!e.message?.includes('duplicate')) console.error(`Error importing ${camp.name}:`, e.message?.slice(0, 80));
      }
    }

    const done = Math.min(i + BATCH, newCamps.length);
    if (done % 500 < BATCH || done >= newCamps.length) {
      console.log(`${done}/${newCamps.length} | Imported: ${imported}`);
    }
    if (i + BATCH < newCamps.length) await new Promise(r => setTimeout(r, GEOCODE_DELAY));
  }

  console.log(`\nIMPORT COMPLETE: ${imported} new campgrounds added`);

  // 5. Update dump_nearby and water_nearby for new campgrounds
  console.log('Updating nearby flags for new campgrounds...');
  await db.execute(sql`
    UPDATE locations AS camp
    SET dump_nearby = 1
    FROM locations AS dump
    WHERE camp.source = 'osm' AND camp.source_id LIKE 'osm-camp-%'
    AND camp.dump_nearby IS NOT TRUE
    AND dump.category = 'dump'
    AND ABS(camp.latitude - dump.latitude) < 0.36
    AND ABS(camp.longitude - dump.longitude) < 0.36
  `);
  
  await db.execute(sql`
    UPDATE locations AS camp
    SET water_nearby = 1
    FROM locations AS water
    WHERE camp.source = 'osm' AND camp.source_id LIKE 'osm-camp-%'
    AND camp.water_nearby IS NOT TRUE
    AND water.category = 'water'
    AND ABS(camp.latitude - water.latitude) < 0.36
    AND ABS(camp.longitude - water.longitude) < 0.36
  `);
  console.log('Nearby flags updated');

  // 6. Check dump stations that are now inside campgrounds
  console.log('\nChecking dump stations inside new campgrounds...');
  const dumpsInCamps = await db.execute(sql`
    SELECT d.id, d.name as dump_name, c.name as camp_name,
      SQRT(POW(d.latitude - c.latitude, 2) + POW(d.longitude - c.longitude, 2)) * 111 as dist_km
    FROM locations d
    JOIN locations c ON c.category = 'campsite' 
      AND ABS(d.latitude - c.latitude) < 0.005 
      AND ABS(d.longitude - c.longitude) < 0.005
    WHERE d.category = 'dump'
    LIMIT 20
  `);
  console.log(`Dump stations within ~500m of a campground: (sample)`);
  const dumpRows = [...dumpsInCamps] as any[];
  for (const r of dumpRows.slice(0, 10)) {
    console.log(`  ${r.dump_name} <-> ${r.camp_name} (${Number(r.dist_km).toFixed(2)}km)`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
