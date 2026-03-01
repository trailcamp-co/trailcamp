/**
 * Validates recreation.gov links for all rec- sourced locations.
 * Sets external_links to the valid URL for working links,
 * or clears it for broken ones.
 * 
 * Recreation.gov is an SPA — always returns 200.
 * Valid pages have the campground name in <title>.
 * Invalid pages have a generic title.
 */
import 'dotenv/config';
import { db } from '../src/db/index.js';
import { locations } from '../src/db/schema.js';
import { eq, like } from 'drizzle-orm';

const GENERIC_TITLE = 'Recreation.gov - Camping, Cabins, RVs, Permits, Passes & More';
const BATCH_SIZE = 10;  // concurrent requests
const DELAY_MS = 200;   // between batches to avoid rate limiting

async function checkUrl(facilityId: string): Promise<boolean> {
  const url = `https://www.recreation.gov/camping/campgrounds/${facilityId}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrailCamp/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch?.[1]?.trim() || '';
    // Valid if title is NOT the generic one
    return title !== '' && title !== GENERIC_TITLE && title !== 'Recreation.gov';
  } catch {
    return false;
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Fetching recreation.gov locations...');
  const rows = await db.select({
    id: locations.id,
    name: locations.name,
    sourceId: locations.sourceId,
    externalLinks: locations.externalLinks,
  }).from(locations).where(like(locations.sourceId, 'rec-%'));

  console.log(`Found ${rows.length} recreation.gov locations to validate`);

  let valid = 0;
  let invalid = 0;
  let processed = 0;

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
        const url = `https://www.recreation.gov/camping/campgrounds/${facilityId}`;
        await db.update(locations)
          .set({ externalLinks: url })
          .where(eq(locations.id, row.id));
        valid++;
      } else {
        // Clear any existing external_links for broken ones
        if (row.externalLinks) {
          await db.update(locations)
            .set({ externalLinks: null })
            .where(eq(locations.id, row.id));
        }
        invalid++;
      }
    }

    processed += batch.length;
    if (processed % 100 === 0 || processed === rows.length) {
      console.log(`Progress: ${processed}/${rows.length} | Valid: ${valid} | Invalid: ${invalid}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Valid: ${valid} | Invalid: ${invalid} | Total: ${rows.length}`);
  console.log(`${((valid / rows.length) * 100).toFixed(1)}% of recreation.gov links are valid`);
  process.exit(0);
}

main().catch(console.error);
