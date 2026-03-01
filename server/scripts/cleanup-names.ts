import 'dotenv/config';
import { db } from '../src/db/index.js';
import { locations } from '../src/db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function main() {
  // 1. Clean dump station names — remove "— City, ST" suffix since city/state now shown separately
  console.log('Cleaning dump station names...');
  const dumps = await db.select().from(locations).where(eq(locations.category, 'dump'));
  let dumpFixed = 0;
  
  for (const d of dumps) {
    let newName = d.name;
    
    // Strip " — City, ST" suffix from renamed dump stations
    if (newName.includes(' — ') && newName.startsWith('RV Dump Station —')) {
      newName = 'RV Dump Station';
    }
    
    // Fix descriptive text used as names (>60 chars or starts with special chars)
    if (newName.length > 60 || newName.startsWith('$') || newName.startsWith('A ') && newName.length > 30) {
      newName = 'RV Dump Station';
    }
    
    // Fix names that are just lowercase descriptions
    if (newName.startsWith('boat ') || newName.startsWith('Accessible') || newName.startsWith('Appears')) {
      newName = 'RV Dump Station';
    }
    
    if (newName !== d.name) {
      await db.update(locations).set({ name: newName }).where(eq(locations.id, d.id));
      dumpFixed++;
    }
  }
  console.log(`Fixed ${dumpFixed} dump station names`);

  // 2. Clean water station names — fix generic/descriptive ones
  console.log('\nCleaning water station names...');
  const waters = await db.select().from(locations).where(eq(locations.category, 'water'));
  let waterFixed = 0;
  
  for (const w of waters) {
    let newName = w.name;
    
    // Fix overly generic names
    if (['Bulk Water Fill Station', 'Bulk Water Point', 'Bulk Water Station', 'water'].includes(newName)) {
      newName = 'Water Fill Station';
    }
    
    // Fix names that are descriptions (>80 chars)
    if (newName.length > 80) {
      newName = 'Water Fill Station';
    }
    
    if (newName !== w.name) {
      await db.update(locations).set({ name: newName }).where(eq(locations.id, w.id));
      waterFixed++;
    }
  }
  console.log(`Fixed ${waterFixed} water station names`);

  // 3. Fix parking names with "— City" suffix too
  console.log('\nChecking parking names...');
  const parkings = await db.select().from(locations).where(sql`sub_type = 'parking'`);
  let parkingFixed = 0;
  for (const p of parkings) {
    // Some parking might have "— City" suffix from earlier renames, strip it
    if (p.name.includes(' — ') && (p.name.includes('Pilot') || p.name.includes('Flying J') || p.name.includes("Love's") || p.name.includes('TA '))) {
      const newName = p.name.split(' — ')[0].trim();
      if (newName !== p.name) {
        await db.update(locations).set({ name: newName }).where(eq(locations.id, p.id));
        parkingFixed++;
      }
    }
  }
  console.log(`Fixed ${parkingFixed} parking names`);

  console.log('\nDone!');
  process.exit(0);
}

main().catch(console.error);
