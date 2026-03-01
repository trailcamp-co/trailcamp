/**
 * Fix data quality issues:
 * 1. Give dump stations better names using reverse geocoding
 * 2. Remove duplicate overnight parking locations
 * 3. Mark parking locations that have dump stations nearby
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN!;

// --- 1. Fix dump station names via reverse geocoding ---
async function fixDumpStationNames() {
  console.log('\n=== Fixing Dump Station Names ===');
  
  const genericNames = ['RV Dump Station', 'Dump Station', 'RV Dump', 'Dumping Station', 'RV dump station'];
  const dumps = await sql`
    SELECT id, name, latitude, longitude, notes 
    FROM locations 
    WHERE category = 'dump' AND name IN ${sql(genericNames)}
    ORDER BY id
  `;
  console.log(`Found ${dumps.length} dump stations with generic names`);

  let updated = 0;
  let failed = 0;
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < dumps.length; i++) {
    const d = dumps[i];
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${d.longitude},${d.latitude}.json?types=poi,address,neighborhood,locality,place&limit=1&access_token=${MAPBOX_TOKEN}`;
      const resp = await fetch(url);
      if (!resp.ok) { failed++; continue; }
      const data = await resp.json();
      
      const features = data.features || [];
      let newName = 'RV Dump Station';
      
      if (features.length > 0) {
        const f = features[0];
        // Get the place name and context
        const placeName = f.text || f.place_name || '';
        const context = f.context || [];
        const locality = context.find((c: any) => c.id?.startsWith('place'))?.text || 
                         context.find((c: any) => c.id?.startsWith('locality'))?.text || '';
        const state = context.find((c: any) => c.id?.startsWith('region'))?.short_code?.replace('US-', '') || '';
        
        if (placeName && locality && state) {
          newName = `RV Dump Station - ${locality}, ${state}`;
        } else if (locality && state) {
          newName = `RV Dump Station - ${locality}, ${state}`;
        } else if (placeName && state) {
          newName = `RV Dump Station - ${placeName}, ${state}`;
        } else if (state) {
          newName = `RV Dump Station - ${state}`;
        }
      }
      
      if (newName !== 'RV Dump Station') {
        await sql`UPDATE locations SET name = ${newName} WHERE id = ${d.id}`;
        updated++;
      }
      
      // Rate limit: ~10 requests/sec for Mapbox
      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, 1100));
        process.stdout.write(`  Progress: ${i}/${dumps.length} (${updated} updated)\r`);
      }
    } catch (err) {
      failed++;
    }
  }
  console.log(`\nDump station names: ${updated} updated, ${failed} failed`);
}

// --- 2. Remove duplicate overnight parking ---
async function removeDuplicateParking() {
  console.log('\n=== Removing Duplicate Parking ===');
  
  // Find duplicates within ~500m of each other, keep the one with the better name
  const dupeIds = await sql`
    SELECT DISTINCT b.id
    FROM locations a
    JOIN locations b ON a.id < b.id
      AND a.category = 'campsite' AND a.sub_type = 'parking'
      AND b.category = 'campsite' AND b.sub_type = 'parking'
      AND ABS(a.latitude - b.latitude) < 0.005
      AND ABS(a.longitude - b.longitude) < 0.005
  `;
  
  if (dupeIds.length === 0) {
    console.log('No duplicates found');
    return;
  }
  
  const ids = dupeIds.map(d => d.id);
  console.log(`Found ${ids.length} duplicate parking locations to remove`);
  
  // Delete in batches
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    await sql`DELETE FROM locations WHERE id IN ${sql(batch)}`;
    console.log(`  Deleted ${Math.min(i + 500, ids.length)}/${ids.length}`);
  }
  
  const remaining = await sql`SELECT count(*) FROM locations WHERE category = 'campsite' AND sub_type = 'parking'`;
  console.log(`Parking locations remaining: ${remaining[0].count}`);
}

// --- 3. Mark parking with dump stations ---
async function markParkingWithDump() {
  console.log('\n=== Marking Parking with Dump Stations ===');
  
  // Set dump_nearby = 1 for parking locations near dump stations
  const result = await sql`
    UPDATE locations p
    SET dump_nearby = 1
    WHERE p.category = 'campsite' AND p.sub_type = 'parking'
    AND p.dump_nearby IS DISTINCT FROM 1
    AND EXISTS (
      SELECT 1 FROM locations d WHERE d.category = 'dump'
      AND ABS(d.latitude - p.latitude) < 0.01
      AND ABS(d.longitude - p.longitude) < 0.01
    )
  `;
  console.log(`Marked ${result.count} parking locations as having dump nearby`);
  
  // Also add a note about dump station availability
  const withDump = await sql`
    UPDATE locations p
    SET notes = CASE 
      WHEN p.notes IS NULL OR p.notes = '' THEN 'Has RV dump station on-site or nearby.'
      WHEN p.notes NOT LIKE '%dump%' THEN p.notes || ' Has RV dump station on-site or nearby.'
      ELSE p.notes
    END
    WHERE p.category = 'campsite' AND p.sub_type = 'parking'
    AND EXISTS (
      SELECT 1 FROM locations d WHERE d.category = 'dump'
      AND ABS(d.latitude - p.latitude) < 0.01
      AND ABS(d.longitude - p.longitude) < 0.01
    )
  `;
  console.log(`Updated notes on ${withDump.count} parking locations`);
}

async function main() {
  console.log('Starting data quality fixes...');
  
  await removeDuplicateParking();
  await markParkingWithDump();
  await fixDumpStationNames();
  
  // Final stats
  const stats = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE category = 'dump') as dump,
      COUNT(*) FILTER (WHERE category = 'water') as water,
      COUNT(*) FILTER (WHERE category = 'campsite' AND sub_type = 'parking') as parking,
      COUNT(*) as total
    FROM locations
  `;
  console.log(`\nFinal: Dump=${stats[0].dump}, Water=${stats[0].water}, Parking=${stats[0].parking}, Total=${stats[0].total}`);
  
  await sql.end();
  console.log('Done!');
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
