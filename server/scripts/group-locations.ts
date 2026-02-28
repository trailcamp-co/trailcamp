/**
 * Group nearby locations (same category, within ~0.5mi) into clusters.
 * - Assigns group_id to each member of a group
 * - Marks the "best" location as is_group_primary = 1
 * - Exact duplicates (same name + same coords) get merged into one
 * 
 * Run: npx tsx server/scripts/group-locations.ts
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'trailcamp.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ~0.5mi threshold in degrees (rough: 0.0072 deg latitude ≈ 0.5mi)
const LAT_THRESHOLD = 0.0072;
const LNG_THRESHOLD = 0.0095; // slightly wider for longitude at mid-latitudes

interface Loc {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  source: string;
  scenery_rating: number | null;
  description: string | null;
  user_rating: number | null;
  favorited: number;
  featured: number;
  visited: number;
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  difficulty: string | null;
  best_season: string | null;
  notes: string | null;
}

// Step 1: Find and remove exact duplicates (same name + very close coords)
console.log('Step 1: Removing exact duplicates...');
const exactDupes = db.prepare(`
  SELECT a.id as keep_id, b.id as remove_id, a.name
  FROM locations a
  JOIN locations b ON a.id < b.id 
    AND LOWER(TRIM(a.name)) = LOWER(TRIM(b.name))
    AND a.category = b.category
    AND ABS(a.latitude - b.latitude) < 0.001
    AND ABS(a.longitude - b.longitude) < 0.001
`).all() as { keep_id: number; remove_id: number; name: string }[];

console.log(`  Found ${exactDupes.length} exact duplicate pairs`);

const removeIds = new Set<number>();
for (const dupe of exactDupes) {
  if (!removeIds.has(dupe.keep_id)) {
    removeIds.add(dupe.remove_id);
  }
}

if (removeIds.size > 0) {
  const deleteStmt = db.prepare('DELETE FROM locations WHERE id = ?');
  const deleteMany = db.transaction((ids: number[]) => {
    for (const id of ids) deleteStmt.run(id);
  });
  deleteMany([...removeIds]);
  console.log(`  Deleted ${removeIds.size} exact duplicates`);
}

// Step 2: Reset all grouping
console.log('Step 2: Resetting groups...');
db.prepare('UPDATE locations SET group_id = NULL, is_group_primary = 0').run();

// Step 3: Build groups using Union-Find
console.log('Step 3: Building proximity groups...');

const allLocations = db.prepare(
  'SELECT id, name, latitude, longitude, category, source, scenery_rating, description, user_rating, favorited, featured, visited, distance_miles, elevation_gain_ft, difficulty, best_season, notes FROM locations ORDER BY id'
).all() as Loc[];

console.log(`  Total locations: ${allLocations.length}`);

// Union-Find data structure
const parent = new Map<number, number>();
const rank = new Map<number, number>();

function find(x: number): number {
  if (!parent.has(x)) { parent.set(x, x); rank.set(x, 0); }
  if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
  return parent.get(x)!;
}

function union(x: number, y: number): void {
  const px = find(x), py = find(y);
  if (px === py) return;
  const rx = rank.get(px)!, ry = rank.get(py)!;
  if (rx < ry) parent.set(px, py);
  else if (rx > ry) parent.set(py, px);
  else { parent.set(py, px); rank.set(px, rx + 1); }
}

// Group by category first for efficiency
const byCategory = new Map<string, Loc[]>();
for (const loc of allLocations) {
  if (!byCategory.has(loc.category)) byCategory.set(loc.category, []);
  byCategory.get(loc.category)!.push(loc);
}

let pairCount = 0;
for (const [category, locs] of byCategory) {
  // Sort by latitude for sweep-line efficiency
  locs.sort((a, b) => a.latitude - b.latitude);
  
  for (let i = 0; i < locs.length; i++) {
    for (let j = i + 1; j < locs.length; j++) {
      const latDiff = Math.abs(locs[j].latitude - locs[i].latitude);
      if (latDiff > LAT_THRESHOLD) break; // sorted, so no more matches
      
      const lngDiff = Math.abs(locs[j].longitude - locs[i].longitude);
      if (lngDiff <= LNG_THRESHOLD) {
        union(locs[i].id, locs[j].id);
        pairCount++;
      }
    }
  }
}
console.log(`  Found ${pairCount} proximity pairs`);

// Step 4: Assign group_ids and pick primaries
console.log('Step 4: Assigning group IDs...');

// Collect groups (only groups with 2+ members)
const groups = new Map<number, Loc[]>();
for (const loc of allLocations) {
  const root = find(loc.id);
  if (!groups.has(root)) groups.set(root, []);
  groups.get(root)!.push(loc);
}

let groupId = 1;
let groupedCount = 0;
let singletonCount = 0;

const updateStmt = db.prepare('UPDATE locations SET group_id = ?, is_group_primary = ? WHERE id = ?');
const assignGroups = db.transaction(() => {
  for (const [_, members] of groups) {
    if (members.length === 1) {
      // Singleton — no group needed
      singletonCount++;
      continue;
    }
    
    // Pick primary: prefer featured > user_rated > most complete data > first by id
    members.sort((a, b) => {
      // Featured first
      if (a.featured !== b.featured) return b.featured - a.featured;
      // User rated first
      if ((a.user_rating || 0) !== (b.user_rating || 0)) return (b.user_rating || 0) - (a.user_rating || 0);
      // Favorited first
      if (a.favorited !== b.favorited) return b.favorited - a.favorited;
      // Has description
      const aDesc = a.description ? 1 : 0;
      const bDesc = b.description ? 1 : 0;
      if (aDesc !== bDesc) return bDesc - aDesc;
      // Has difficulty (riding)
      const aDiff = a.difficulty ? 1 : 0;
      const bDiff = b.difficulty ? 1 : 0;
      if (aDiff !== bDiff) return bDiff - aDiff;
      // Higher scenery rating
      if ((a.scenery_rating || 0) !== (b.scenery_rating || 0)) return (b.scenery_rating || 0) - (a.scenery_rating || 0);
      // Agent-curated preferred over API data
      const aAgent = a.source === 'agent-curated' ? 1 : 0;
      const bAgent = b.source === 'agent-curated' ? 1 : 0;
      if (aAgent !== bAgent) return bAgent - aAgent;
      // Lower ID first (older = more established)
      return a.id - b.id;
    });
    
    const currentGroupId = groupId++;
    for (let i = 0; i < members.length; i++) {
      updateStmt.run(currentGroupId, i === 0 ? 1 : 0, members[i].id);
    }
    groupedCount += members.length;
  }
});

assignGroups();

console.log(`\nResults:`);
console.log(`  Groups created: ${groupId - 1}`);
console.log(`  Locations in groups: ${groupedCount}`);
console.log(`  Singletons (no group): ${singletonCount}`);
console.log(`  Exact duplicates removed: ${removeIds.size}`);

// Summary stats
const finalCount = (db.prepare('SELECT COUNT(*) as c FROM locations').get() as any).c;
const groupedLocs = (db.prepare('SELECT COUNT(*) as c FROM locations WHERE group_id IS NOT NULL').get() as any).c;
const primaryLocs = (db.prepare('SELECT COUNT(*) as c FROM locations WHERE is_group_primary = 1').get() as any).c;
const uniquePins = finalCount - groupedLocs + primaryLocs;

console.log(`\nFinal stats:`);
console.log(`  Total locations: ${finalCount}`);
console.log(`  In groups: ${groupedLocs}`);
console.log(`  Primary pins: ${primaryLocs}`);
console.log(`  Unique map pins (singletons + primaries): ${uniquePins}`);
console.log(`  Clutter reduction: ${groupedLocs - primaryLocs} fewer pins`);

db.close();
