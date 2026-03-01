/**
 * Import water stations, dump stations, and overnight parking from OpenStreetMap
 * via Overpass API, then insert into Supabase PostgreSQL.
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const US_BBOX = '24.396308,-125.0,49.384358,-66.93457';

async function overpassQuery(query: string): Promise<any[]> {
  console.log('Running Overpass query...');
  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!resp.ok) throw new Error(`Overpass error ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  return data.elements || [];
}

function getCenter(el: any): { lat: number; lon: number } | null {
  if (el.type === 'node') return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

// Preload existing source_ids to avoid per-row lookups
async function getExistingSourceIds(prefix: string): Promise<Set<string>> {
  const rows = await sql`SELECT source_id FROM locations WHERE source_id LIKE ${prefix + '%'}`;
  return new Set(rows.map(r => r.source_id));
}

// Spatial dedup key: round to ~100m grid
function geoKey(lat: number, lon: number, cat: string): string {
  return `${cat}:${lat.toFixed(3)},${lon.toFixed(3)}`;
}

async function bulkInsert(rows: any[]) {
  if (rows.length === 0) return;
  // Insert in batches of 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    await sql`
      INSERT INTO locations ${sql(batch, 'name', 'description', 'latitude', 'longitude', 'category', 'sub_type', 'source', 'source_id', 'notes', 'hours', 'water_available', 'visibility', 'created_at', 'updated_at')}
    `;
    process.stdout.write(`  Inserted ${Math.min(i + 100, rows.length)}/${rows.length}\r`);
  }
  console.log();
}

async function importDumpStations() {
  console.log('\n=== Importing Dump Stations ===');
  const existing = await getExistingSourceIds('osm-dump-');
  
  const elements = await overpassQuery(`
    [out:json][timeout:120];
    (node["amenity"="sanitary_dump_station"](${US_BBOX});way["amenity"="sanitary_dump_station"](${US_BBOX}););
    out center;
  `);
  console.log(`Found ${elements.length} from OSM, ${existing.size} already imported`);

  const seen = new Set<string>();
  // Also load existing dump locations for spatial dedup
  const existingDumps = await sql`SELECT latitude, longitude FROM locations WHERE category = 'dump'`;
  for (const d of existingDumps) seen.add(geoKey(d.latitude, d.longitude, 'dump'));

  const rows: any[] = [];
  const now = new Date();
  for (const el of elements) {
    const center = getCenter(el);
    if (!center) continue;
    const sourceId = `osm-dump-${el.id}`;
    if (existing.has(sourceId)) continue;
    const key = geoKey(center.lat, center.lon, 'dump');
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const name = tags.name || tags.description || 'RV Dump Station';
    const notes = [
      tags.fee === 'yes' ? 'Fee required' : tags.fee === 'no' ? 'Free' : null,
      tags.access ? `Access: ${tags.access}` : null,
      tags.opening_hours ? `Hours: ${tags.opening_hours}` : null,
      tags.operator ? `Operator: ${tags.operator}` : null,
    ].filter(Boolean).join('. ') || null;

    rows.push({
      name, description: 'RV sanitary dump station' + (tags.operator ? ` - ${tags.operator}` : ''),
      latitude: center.lat, longitude: center.lon,
      category: 'dump', sub_type: null, source: 'osm', source_id: sourceId,
      notes, hours: tags.opening_hours || null, water_available: null,
      visibility: 'public', created_at: now, updated_at: now,
    });
  }

  await bulkInsert(rows);
  console.log(`Dump stations: ${rows.length} new`);
  return rows.length;
}

async function importWaterStations() {
  console.log('\n=== Importing Water Stations ===');
  const existing = await getExistingSourceIds('osm-water-');

  const elements = await overpassQuery(`
    [out:json][timeout:120];
    (node["amenity"="water_point"](${US_BBOX});way["amenity"="water_point"](${US_BBOX}););
    out center;
  `);
  console.log(`Found ${elements.length} from OSM, ${existing.size} already imported`);

  const seen = new Set<string>();
  const existingWater = await sql`SELECT latitude, longitude FROM locations WHERE category = 'water'`;
  for (const w of existingWater) seen.add(geoKey(w.latitude, w.longitude, 'water'));

  const rows: any[] = [];
  const now = new Date();
  for (const el of elements) {
    const center = getCenter(el);
    if (!center) continue;
    const sourceId = `osm-water-${el.id}`;
    if (existing.has(sourceId)) continue;
    const key = geoKey(center.lat, center.lon, 'water');
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const name = tags.name || 'Water Fill Station';
    const notes = [
      tags.fee === 'yes' ? 'Fee required' : tags.fee === 'no' ? 'Free' : null,
      tags.access ? `Access: ${tags.access}` : null,
      tags.operator ? `Operator: ${tags.operator}` : null,
      tags.drinking_water === 'yes' ? 'Potable water' : tags.drinking_water === 'no' ? 'Non-potable' : null,
    ].filter(Boolean).join('. ') || null;

    rows.push({
      name, description: 'Water fill station' + (tags.operator ? ` - ${tags.operator}` : ''),
      latitude: center.lat, longitude: center.lon,
      category: 'water', sub_type: null, source: 'osm', source_id: sourceId,
      notes, hours: tags.opening_hours || null, water_available: 1,
      visibility: 'public', created_at: now, updated_at: now,
    });
  }

  await bulkInsert(rows);
  console.log(`Water stations: ${rows.length} new`);
  return rows.length;
}

async function importOvernightParking() {
  console.log('\n=== Importing Overnight Parking (Love\'s, Pilot, Flying J) ===');
  const existing = await getExistingSourceIds('osm-parking-');

  const elements = await overpassQuery(`
    [out:json][timeout:180];
    (
      node["brand"~"Love's|Pilot|Flying J"](${US_BBOX});
      way["brand"~"Love's|Pilot|Flying J"](${US_BBOX});
      node["name"~"Love's|Pilot Travel|Flying J"](${US_BBOX});
      way["name"~"Love's|Pilot Travel|Flying J"](${US_BBOX});
    );
    out center;
  `);
  console.log(`Found ${elements.length} from OSM, ${existing.size} already imported`);

  const seen = new Set<string>();
  const existingParking = await sql`SELECT latitude, longitude FROM locations WHERE category = 'campsite' AND sub_type = 'parking'`;
  for (const p of existingParking) seen.add(geoKey(p.latitude, p.longitude, 'parking'));

  const rows: any[] = [];
  const now = new Date();
  for (const el of elements) {
    const center = getCenter(el);
    if (!center) continue;
    const sourceId = `osm-parking-${el.id}`;
    if (existing.has(sourceId)) continue;
    const key = geoKey(center.lat, center.lon, 'parking');
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const name = tags.name || tags.brand || 'Travel Center';
    const brand = tags.brand || name;
    let desc = 'Travel center - overnight parking typically available for RVs.';
    if (brand.includes("Love's")) desc = "Love's Travel Stop - overnight parking typically available for RVs.";
    else if (brand.includes('Pilot') || brand.includes('Flying J')) desc = `${brand} - overnight parking typically available for RVs.`;

    rows.push({
      name, description: desc,
      latitude: center.lat, longitude: center.lon,
      category: 'campsite', sub_type: 'parking', source: 'osm', source_id: sourceId,
      notes: 'Open 24/7. Fuel, restrooms, and food typically available.',
      hours: '24/7', water_available: null,
      visibility: 'public', created_at: now, updated_at: now,
    });
  }

  await bulkInsert(rows);
  console.log(`Overnight parking (Love's/Pilot/FlyingJ): ${rows.length} new`);
  return rows.length;
}

async function importTAPetro() {
  console.log('\n=== Importing TA/Petro Travel Centers ===');
  const existing = await getExistingSourceIds('osm-parking-ta-');

  const elements = await overpassQuery(`
    [out:json][timeout:120];
    (
      node["brand"~"TA|TravelCenters of America|Petro"](${US_BBOX});
      way["brand"~"TA|TravelCenters of America|Petro"](${US_BBOX});
      node["name"~"^TA |TravelCenters|Petro Stopping|Petro Travel"](${US_BBOX});
      way["name"~"^TA |TravelCenters|Petro Stopping|Petro Travel"](${US_BBOX});
    );
    out center;
  `);
  console.log(`Found ${elements.length} from OSM, ${existing.size} already imported`);

  const seen = new Set<string>();
  const existingParking = await sql`SELECT latitude, longitude FROM locations WHERE category = 'campsite' AND sub_type = 'parking'`;
  for (const p of existingParking) seen.add(geoKey(p.latitude, p.longitude, 'parking'));

  const rows: any[] = [];
  const now = new Date();
  for (const el of elements) {
    const center = getCenter(el);
    if (!center) continue;
    const sourceId = `osm-parking-ta-${el.id}`;
    if (existing.has(sourceId)) continue;
    const key = geoKey(center.lat, center.lon, 'parking');
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const name = tags.name || tags.brand || 'TA Travel Center';

    rows.push({
      name, description: 'TA/Petro Travel Center - overnight parking available for RVs and trucks.',
      latitude: center.lat, longitude: center.lon,
      category: 'campsite', sub_type: 'parking', source: 'osm', source_id: sourceId,
      notes: 'Open 24/7. Fuel, restrooms, showers, and food available.',
      hours: '24/7', water_available: null,
      visibility: 'public', created_at: now, updated_at: now,
    });
  }

  await bulkInsert(rows);
  console.log(`TA/Petro: ${rows.length} new`);
  return rows.length;
}

async function updateNearbyFlags() {
  console.log('\n=== Updating Water/Dump Nearby Flags ===');
  const NEARBY = 0.36; // ~25 miles

  const wr = await sql`
    UPDATE locations l SET water_nearby = 1
    WHERE l.category != 'water' AND l.water_nearby IS DISTINCT FROM 1
    AND EXISTS (SELECT 1 FROM locations w WHERE w.category = 'water'
      AND ABS(w.latitude - l.latitude) < ${NEARBY} AND ABS(w.longitude - l.longitude) < ${NEARBY})
  `;
  console.log(`water_nearby updated: ${wr.count} locations`);

  const dr = await sql`
    UPDATE locations l SET dump_nearby = 1
    WHERE l.category != 'dump' AND l.dump_nearby IS DISTINCT FROM 1
    AND EXISTS (SELECT 1 FROM locations d WHERE d.category = 'dump'
      AND ABS(d.latitude - l.latitude) < ${NEARBY} AND ABS(d.longitude - l.longitude) < ${NEARBY})
  `;
  console.log(`dump_nearby updated: ${dr.count} locations`);
}

async function main() {
  console.log('Starting OSM data import...\n');
  
  const d = await importDumpStations();
  const w = await importWaterStations();
  const p = await importOvernightParking();
  const t = await importTAPetro();
  
  console.log(`\n=== Import Summary ===`);
  console.log(`Dump: ${d}, Water: ${w}, Parking (Love's/Pilot/FJ): ${p}, Parking (TA/Petro): ${t}`);
  console.log(`Total new: ${d + w + p + t}`);

  await updateNearbyFlags();

  const counts = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE category = 'water') as water,
      COUNT(*) FILTER (WHERE category = 'dump') as dump,
      COUNT(*) FILTER (WHERE category = 'campsite' AND sub_type = 'parking') as parking,
      COUNT(*) as total
    FROM locations
  `;
  console.log(`\nFinal: Water=${counts[0].water}, Dump=${counts[0].dump}, Parking=${counts[0].parking}, Total=${counts[0].total}`);

  await sql.end();
  console.log('Done!');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
