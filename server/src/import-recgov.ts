/**
 * Import federal campgrounds from Recreation.gov RIDB API
 */
import { getDb } from './database';

const API_KEY = process.env.RECREATION_GOV_API_KEY;
const BASE_URL = 'https://ridb.recreation.gov/api/v1';

// US states to query
const STATES = [
  'AZ', 'CA', 'CO', 'ID', 'MT', 'NM', 'NV', 'OR', 'UT', 'WA', 'WY',
  'AR', 'KS', 'MO', 'NE', 'ND', 'OK', 'SD', 'TX',
  'AL', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV',
  'CT', 'DE', 'IL', 'IN', 'IA', 'MA', 'MD', 'ME', 'MI', 'MN', 'NH',
  'NJ', 'NY', 'OH', 'PA', 'RI', 'VT', 'WI',
  'AK', 'HI',
];

interface RecFacility {
  FacilityID: string;
  FacilityName: string;
  FacilityDescription: string;
  FacilityLatitude: number;
  FacilityLongitude: number;
  FacilityTypeDescription: string;
  FacilityPhone: string;
  FacilityEmail: string;
  FacilityReservationURL: string;
  GEOJSON?: any;
}

async function fetchFacilities(state: string, offset: number = 0): Promise<{ data: RecFacility[]; total: number }> {
  const url = `${BASE_URL}/facilities?limit=50&offset=${offset}&state=${state}&activity=CAMPING&full=true`;
  try {
    const resp = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'apikey': API_KEY || '',
      },
    });
    if (!resp.ok) {
      console.log(`  HTTP ${resp.status} for ${state} offset ${offset}`);
      return { data: [], total: 0 };
    }
    const json: any = await resp.json();
    return {
      data: json.RECDATA || [],
      total: json.METADATA?.RESULTS?.TOTAL_COUNT || 0,
    };
  } catch (err: any) {
    console.log(`  Error fetching ${state}: ${err.message}`);
    return { data: [], total: 0 };
  }
}

function getSubType(desc: string): string {
  const lower = (desc || '').toLowerCase();
  if (lower.includes('blm') || lower.includes('bureau of land')) return 'BLM';
  if (lower.includes('national forest') || lower.includes('usfs')) return 'National Forest';
  if (lower.includes('national park')) return 'National Park';
  if (lower.includes('army corps')) return 'Army Corps';
  if (lower.includes('state')) return 'State';
  return 'Federal';
}

async function importRecGov() {
  if (!API_KEY) {
    console.error('RECREATION_GOV_API_KEY not set!');
    return;
  }

  const db = getDb();
  
  console.log(`Recreation.gov Import: fetching campgrounds for ${STATES.length} states...`);
  
  let totalImported = 0;
  let totalSkipped = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO locations (
      name, description, latitude, longitude, category, sub_type, source, source_id,
      notes, visited, want_to_visit
    ) VALUES (?, ?, ?, ?, 'campsite', ?, 'recreation_gov', ?, ?, 0, 0)
  `);

  for (const state of STATES) {
    let offset = 0;
    let total = 1;
    let stateCount = 0;

    while (offset < total) {
      const result = await fetchFacilities(state, offset);
      total = result.total;

      for (const fac of result.data) {
        if (!fac.FacilityLatitude || !fac.FacilityLongitude) {
          totalSkipped++;
          continue;
        }
        // Skip non-US coords
        if (fac.FacilityLatitude < 18 || fac.FacilityLatitude > 72) {
          totalSkipped++;
          continue;
        }
        if (fac.FacilityLongitude < -180 || fac.FacilityLongitude > -60) {
          totalSkipped++;
          continue;
        }

        const subType = getSubType(fac.FacilityDescription || fac.FacilityName);
        
        // Clean description (strip HTML)
        let desc = (fac.FacilityDescription || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (desc.length > 500) desc = desc.substring(0, 500) + '...';

        try {
          insertStmt.run(
            fac.FacilityName || 'Unnamed',
            desc,
            fac.FacilityLatitude,
            fac.FacilityLongitude,
            subType,
            `rec-${fac.FacilityID}`,
            fac.FacilityReservationURL ? `Book: ${fac.FacilityReservationURL}` : null,
          );
          totalImported++;
          stateCount++;
        } catch (err: any) {
          if (!err.message?.includes('UNIQUE')) {
            console.log(`  Error inserting ${fac.FacilityName}: ${err.message}`);
          }
          totalSkipped++;
        }
      }

      offset += 50;
      await new Promise(r => setTimeout(r, 100));
    }

    if (stateCount > 0) {
      console.log(`  ${state}: ${stateCount} campgrounds imported`);
    }
  }

  console.log(`\nRecreation.gov Import Complete!`);
  console.log(`  Imported: ${totalImported}`);
  console.log(`  Skipped: ${totalSkipped}`);
}

importRecGov().catch(console.error);
