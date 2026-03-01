import 'dotenv/config';
import { db } from '../src/db/index.js';
import { locations } from '../src/db/schema.js';
import { eq, and, like, isNull } from 'drizzle-orm';

const BATCH = 20;
const DELAY = 100;

async function check(id: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.recreation.gov/camping/campgrounds/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(7000),
    });
    const html = await res.text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] || '';
    return title.length > 0 && !title.includes('Recreation.gov - Camping');
  } catch { return false; }
}

async function main() {
  const rows = await db.select().from(locations).where(
    and(
      eq(locations.source, 'recreation_gov'),
      like(locations.sourceId, 'rec-%'),
      isNull(locations.externalLinks)
    )
  );
  console.log(`Resuming: ${rows.length} left to validate`);
  
  let ok = 0, bad = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async r => {
      const id = r.sourceId!.replace('rec-', '');
      const valid = await check(id);
      return { r, id, valid };
    }));
    
    for (const { r, id, valid } of results) {
      if (valid) {
        await db.update(locations).set({ externalLinks: `https://www.recreation.gov/camping/campgrounds/${id}` }).where(eq(locations.id, r.id));
        ok++;
      } else {
        bad++;
      }
    }
    const done = i + batch.length;
    if (done % 200 === 0 || done === rows.length) {
      console.log(`${done}/${rows.length} | OK: ${ok} | Bad: ${bad}`);
    }
    await new Promise(r => setTimeout(r, DELAY));
  }
  console.log(`DONE: ${ok} valid, ${bad} invalid`);
}

main();
