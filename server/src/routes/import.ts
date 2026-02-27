import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// POST /api/import/ioverlander
router.post('/ioverlander', async (req: Request, res: Response) => {
  const { sw_lat, sw_lng, ne_lat, ne_lng } = req.body;

  if (!sw_lat || !sw_lng || !ne_lat || !ne_lng) {
    res.status(400).json({ error: 'Bounding box required: sw_lat, sw_lng, ne_lat, ne_lng' });
    return;
  }

  try {
    const url = `https://www.ioverlander.com/api/places?sw_lat=${sw_lat}&sw_lng=${sw_lng}&ne_lat=${ne_lat}&ne_lng=${ne_lng}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      res.status(502).json({ error: `iOverlander API returned ${response.status}` });
      return;
    }

    const places = await response.json();
    const db = getDb();
    let imported = 0;
    let skipped = 0;

    const insertOrSkip = db.prepare(`
      INSERT OR IGNORE INTO locations (name, description, latitude, longitude, category, source, source_id, notes, water_nearby)
      VALUES (?, ?, ?, ?, ?, 'ioverlander', ?, ?, ?)
    `);

    const categoryMap: Record<string, string> = {
      'Wild Camping': 'campsite',
      'Established Campground': 'campsite',
      'Informal Campsite': 'campsite',
      'Water': 'water',
      'Drinking Water': 'water',
      'Potable Water': 'water',
      'Dump Station': 'dump',
      'Gas Station': 'gas',
      'Fuel Station': 'gas',
      'Propane': 'gas',
      'Grocery Store': 'grocery',
      'Supermarket': 'grocery',
      'Laundry': 'laundromat',
      'Scenic/Interesting Place': 'scenic',
    };

    const importAll = db.transaction((data: any[]) => {
      for (const place of data) {
        const category = categoryMap[place.category] || categoryMap[place.type] || 'campsite';
        const existing = db.prepare('SELECT id FROM locations WHERE source = ? AND source_id = ?').get('ioverlander', String(place.id));

        if (existing) {
          skipped++;
          continue;
        }

        try {
          insertOrSkip.run(
            place.name,
            place.description || null,
            place.latitude,
            place.longitude,
            category,
            String(place.id),
            place.description || null,
            place.water ? 1 : 0
          );
          imported++;
        } catch {
          skipped++;
        }
      }
    });

    if (Array.isArray(places)) {
      importAll(places);
    }

    res.json({ imported, skipped, total: Array.isArray(places) ? places.length : 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from iOverlander', details: String(error) });
  }
});

// POST /api/import/recreation
router.post('/recreation', async (req: Request, res: Response) => {
  const { state, query: searchQuery, limit } = req.body;
  const apiKey = process.env.RECREATION_GOV_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'RECREATION_GOV_API_KEY not configured' });
    return;
  }

  try {
    let url = `https://ridb.recreation.gov/api/v1/facilities?limit=${limit || 50}&offset=0&apikey=${apiKey}`;
    if (state) url += `&state=${state}`;
    if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      res.status(502).json({ error: `Recreation.gov API returned ${response.status}` });
      return;
    }

    const data: any = await response.json();
    const facilities = data.RECDATA || [];
    const db = getDb();
    let imported = 0;
    let skipped = 0;

    const importAll = db.transaction((facilities: any[]) => {
      for (const facility of facilities) {
        if (!facility.FacilityLatitude || !facility.FacilityLongitude) {
          skipped++;
          continue;
        }

        const existing = db.prepare('SELECT id FROM locations WHERE source = ? AND source_id = ?').get('recreation_gov', String(facility.FacilityID));
        if (existing) {
          skipped++;
          continue;
        }

        try {
          db.prepare(`
            INSERT INTO locations (name, description, latitude, longitude, category, source, source_id, notes)
            VALUES (?, ?, ?, ?, 'campsite', 'recreation_gov', ?, ?)
          `).run(
            facility.FacilityName,
            facility.FacilityDescription?.replace(/<[^>]*>/g, '') || null,
            facility.FacilityLatitude,
            facility.FacilityLongitude,
            String(facility.FacilityID),
            facility.FacilityDirections || null
          );
          imported++;
        } catch {
          skipped++;
        }
      }
    });

    importAll(facilities);
    res.json({ imported, skipped, total: facilities.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Recreation.gov', details: String(error) });
  }
});

// GET /api/import/status
router.get('/status', (_req: Request, res: Response) => {
  const db = getDb();
  const counts = {
    total: (db.prepare('SELECT COUNT(*) as c FROM locations').get() as any).c,
    ioverlander: (db.prepare("SELECT COUNT(*) as c FROM locations WHERE source = 'ioverlander'").get() as any).c,
    recreation_gov: (db.prepare("SELECT COUNT(*) as c FROM locations WHERE source = 'recreation_gov'").get() as any).c,
    agent_curated: (db.prepare("SELECT COUNT(*) as c FROM locations WHERE source = 'agent_curated'").get() as any).c,
    user: (db.prepare("SELECT COUNT(*) as c FROM locations WHERE source = 'user'").get() as any).c,
  };
  res.json(counts);
});

export default router;
