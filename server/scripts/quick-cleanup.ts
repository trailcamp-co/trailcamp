import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`UPDATE locations SET name = 'RV Dump Station' WHERE category = 'dump' AND name LIKE 'RV Dump Station —%'`);
  console.log('Dump "— City" suffix stripped');
  
  await db.execute(sql`UPDATE locations SET name = 'RV Dump Station' WHERE category = 'dump' AND length(name) > 60`);
  console.log('Dump long names fixed');

  await db.execute(sql`UPDATE locations SET name = 'RV Dump Station' WHERE category = 'dump' AND (name LIKE '$%' OR name LIKE 'Accessible%' OR name LIKE 'Appears%' OR name LIKE 'boat %')`);
  console.log('Dump descriptive fixed');

  await db.execute(sql`UPDATE locations SET name = 'Water Fill Station' WHERE category = 'water' AND name IN ('Bulk Water Fill Station', 'Bulk Water Point', 'Bulk Water Station', 'water', 'Water')`);
  console.log('Water standardized');

  // Count
  const dumps = await db.execute(sql`SELECT name, count(*) as c FROM locations WHERE category='dump' GROUP BY name ORDER BY c DESC LIMIT 10`);
  console.log('\nTop dump names:', dumps.rows);

  const waters = await db.execute(sql`SELECT name, count(*) as c FROM locations WHERE category='water' GROUP BY name ORDER BY c DESC LIMIT 10`);
  console.log('\nTop water names:', waters.rows);

  const cityStats = await db.execute(sql`
    SELECT category, count(*) as total, count(city) as has_city
    FROM locations WHERE category IN ('dump','water','riding','scenic','campsite')
    GROUP BY category ORDER BY category`);
  console.log('\nCity coverage:', cityStats.rows);
  
  process.exit(0);
}
run();
