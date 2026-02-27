/**
 * Import boondocking spots, water, dump stations from iOverlander API
 * Covers the entire continental US in a grid pattern
 */
import { getDb } from './database';

const IOVERLANDER_API = 'https://www.ioverlander.com/api/places';

// Category mapping: iOverlander category_id -> our category
const CATEGORY_MAP: Record<number, string> = {
  1: 'campsite',    // Wild Camping
  2: 'campsite',    // Informal Campsite  
  3: 'campsite',    // Established Campground
  4: 'campsite',    // Truck Camper Parking
  5: 'water',       // Water
  6: 'dump',        // Dump Station
  7: 'gas',         // Propane
  8: 'gas',         // Gas Station
  9: 'grocery',     // Supermarket
  10: 'scenic',     // Restaurant (skip or scenic)
  11: 'laundromat', // Laundry
  12: 'water',      // Shower
  15: 'campsite',   // Rest Area
};

// Sub-type mapping
const SUBTYPE_MAP: Record<number, string> = {
  1: 'Dispersed/Wild',
  2: 'Informal',
  3: 'Established',
  4: 'Parking/Overnight',
  5: 'Water Fill',
  6: 'Dump Station',
  15: 'Rest Area',
};

interface IoPlace {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: { id: number; name: string };
  date_verified?: string;
  is_verified?: boolean;
}

// Grid of bounding boxes covering continental US
// Format: [south, west, north, east]
function generateUSGrid(): [number, number, number, number][] {
  const boxes: [number, number, number, number][] = [];
  // Continental US roughly: lat 24-50, lng -125 to -66
  // Use 5-degree grid cells
  for (let lat = 24; lat < 50; lat += 4) {
    for (let lng = -125; lng < -66; lng += 4) {
      boxes.push([lat, lng, lat + 4, lng + 4]);
    }
  }
  return boxes;
}

async function fetchPlaces(south: number, west: number, north: number, east: number): Promise<IoPlace[]> {
  const url = `${IOVERLANDER_API}?south=${south}&west=${west}&north=${north}&east=${east}`;
  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) {
      console.log(`  HTTP ${resp.status} for box [${south},${west},${north},${east}]`);
      return [];
    }
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.log(`  Error fetching [${south},${west},${north},${east}]: ${err.message}`);
    return [];
  }
}

async function importIoverlander() {
  const db = getDb();
  const grid = generateUSGrid();
  
  console.log(`iOverlander Import: scanning ${grid.length} grid cells across the US...`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFetched = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO locations (
      name, description, latitude, longitude, category, sub_type, source, source_id,
      cell_signal, shade, level_ground, water_nearby, dump_nearby,
      scenery_rating, notes, visited, want_to_visit
    ) VALUES (?, ?, ?, ?, ?, ?, 'ioverlander', ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
  `);

  for (let i = 0; i < grid.length; i++) {
    const [south, west, north, east] = grid[i];
    
    if (i % 10 === 0) {
      console.log(`  Grid cell ${i + 1}/${grid.length} — imported ${totalImported} so far...`);
    }
    
    const places = await fetchPlaces(south, west, north, east);
    totalFetched += places.length;

    for (const place of places) {
      const catId = place.category?.id;
      const category = CATEGORY_MAP[catId];
      if (!category) {
        totalSkipped++;
        continue;
      }

      try {
        insertStmt.run(
          place.name || 'Unnamed',
          place.description || '',
          place.latitude,
          place.longitude,
          category,
          SUBTYPE_MAP[catId] || null,
          `io-${place.id}`,
          null, // cell_signal
          null, // shade
          null, // level_ground
          category === 'water' ? 1 : null,  // water_nearby
          category === 'dump' ? 1 : null,    // dump_nearby
          null, // scenery_rating
          place.date_verified ? `Verified: ${place.date_verified}` : null,
        );
        totalImported++;
      } catch (err: any) {
        if (!err.message?.includes('UNIQUE')) {
          console.log(`  Error inserting ${place.name}: ${err.message}`);
        }
        totalSkipped++;
      }
    }

    // Rate limit: 200ms between requests
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\niOverlander Import Complete!`);
  console.log(`  Fetched: ${totalFetched}`);
  console.log(`  Imported: ${totalImported}`);
  console.log(`  Skipped: ${totalSkipped}`);
}

// Run if called directly
importIoverlander().catch(console.error);
