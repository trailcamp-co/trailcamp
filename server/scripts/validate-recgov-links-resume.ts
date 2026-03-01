import 'dotenv/config';
import { db } from '../src/db/index.js';
import { locations } from '../src/db/schema.js';
import { eq, like, isNull } from 'drizzle-orm';

const BATCH_SIZE = 20;
const DELAY_MS = 100;

async function checkUrl(facilityId: string): Promise<boolean> {
  const url = `https://www.recreation.gov/camping/campgrounds/${facilityId}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1]?.trim() || '';
    const generic = title === 'Recreation.gov - Camping, Cabins, RVs, Permits, Passes & More' || title === '';
    return !generic;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Fetching unvalidated recreation.gov locations...');
  const rows = await db.select({
    id: locations.id,
    name: locations.name,
    sourceId: locations.sourceId,
  }).from(locations)
    .where(like(locations.sourceId, 'rec-%'))
    .where(isNull(locations.externalLinks));

  console.log(`Found ${rows.length} unvalidated locations`);
  
  let valid = 0, invalid = 0, processed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (row) => {
        const facilityId = row.sourceId!.replace('rec-', '');
        const isValid = await checkUrl(facilityId);
        return { row, facilityId, isValid };
      })
    );

    for (const { row, facilityId, isValid } of results) {
      if (isValid) {
        await db.update(locations)
          .set({ externalLinks: `https://www.recreation.gov/camping/campgrounds/${facilityId}` })
          .where(eq(locations.id, row.id));
        valid++;
      } else {
        invalid++;
      }
    }

    processed += batch.length;
    if (processed % 200 === 0 || processed === rows.length) {
      console.log(`${processed}/${rows.length} | Valid: ${valid} | Invalid: ${invalid}`);
    }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`Done! Valid: ${valid} | Invalid: ${invalid}`);
  process.exit(0);
}

main().catch(console.error);
