import { toSnakeCase } from '../utils/caseTransform';
import { Router, Request, Response } from 'express';
import { eq, and, or, sql, isNull, gte, asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { locations } from '../db/schema';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();


// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullish(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().min(1, 'Category is required'),
  sub_type: z.string().nullish(),
  source: z.string().nullish(),
  cell_signal: z.string().nullish(),
  shade: z.number().int().nullish(),
  level_ground: z.number().int().nullish(),
  water_nearby: z.number().int().nullish(),
  dump_nearby: z.number().int().nullish(),
  max_vehicle_length: z.number().int().nullish(),
  stay_limit_days: z.number().int().nullish(),
  season: z.string().nullish(),
  crowding: z.string().nullish(),
  trail_types: z.union([z.string(), z.array(z.string())]).nullish(),
  difficulty: z.string().nullish(),
  distance_miles: z.number().nullish(),
  elevation_gain_ft: z.number().int().nullish(),
  permit_required: z.number().int().nullish(),
  permit_info: z.string().nullish(),
  scenery_rating: z.number().int().nullish(),
  best_season: z.string().nullish(),
  photos: z.union([z.string(), z.array(z.string())]).nullish(),
  external_links: z.union([z.string(), z.array(z.string())]).nullish(),
  notes: z.string().nullish(),
  hours: z.string().nullish(),
  want_to_visit: z.number().int().nullish(),
  visibility: z.enum(['public', 'private']).default('public'),
});

const updateLocationSchema = createLocationSchema.partial();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonifyField(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

interface SeasonalLoc {
  best_season?: string | null;
  latitude?: number | null;
  elevation_gain_ft?: number | null;
}

function computeSeasonalStatus(loc: SeasonalLoc, month: number): 'great' | 'shoulder' | 'bad' {
  if (loc.best_season) {
    const bs = loc.best_season.toLowerCase();
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const currentMonthName = monthNames[month - 1];

    if (bs.includes(currentMonthName) || bs.includes('year-round') || bs.includes('all year')) {
      return 'great';
    }
    if (bs.includes('spring') && [3, 4, 5].includes(month)) return 'great';
    if (bs.includes('summer') && [6, 7, 8].includes(month)) return 'great';
    if (bs.includes('fall') && [9, 10, 11].includes(month)) return 'great';
    if (bs.includes('winter') && [12, 1, 2].includes(month)) return 'great';

    if (bs.includes('spring') && [2, 6].includes(month)) return 'shoulder';
    if (bs.includes('summer') && [5, 9].includes(month)) return 'shoulder';
    if (bs.includes('fall') && [8, 12].includes(month)) return 'shoulder';
    if (bs.includes('winter') && [11, 3].includes(month)) return 'shoulder';

    return 'bad';
  }

  const lat = loc.latitude || 0;
  const elevation = loc.elevation_gain_ft || 0;

  if (lat > 42 || elevation > 7000) {
    if (month >= 5 && month <= 10) return 'great';
    if (month === 4 || month === 11) return 'shoulder';
    return 'bad';
  }

  if (lat < 33) {
    if (month >= 10 || month <= 4) return 'great';
    if (month === 5 || month === 9) return 'shoulder';
    return 'bad';
  }

  return 'great';
}

// ─── GET /api/locations ──────────────────────────────────────────────────────

// ─── GET /api/locations/slim ─────────────────────────────────────────────────
// Returns lightweight location data for map markers + sidebar cards.
// ~90% smaller than full endpoint. Full details fetched on click via GET /:id.

router.get('/slim', optionalAuth, async (req: Request, res: Response) => {
  try {
    const conditions: ReturnType<typeof eq>[] = [];

    // Visibility filter
    conditions.push(or(eq(locations.visibility, 'public'), isNull(locations.visibility))!);

    // Bounding box filter (critical for performance)
    if (req.query.sw_lat && req.query.sw_lng && req.query.ne_lat && req.query.ne_lng) {
      conditions.push(gte(locations.latitude, Number(req.query.sw_lat)));
      conditions.push(sql`${locations.latitude} <= ${Number(req.query.ne_lat)}`);
      conditions.push(gte(locations.longitude, Number(req.query.sw_lng)));
      conditions.push(sql`${locations.longitude} <= ${Number(req.query.ne_lng)}`);
    }

    // Category filter (comma-separated list)
    if (req.query.categories) {
      const cats = String(req.query.categories).split(',');
      conditions.push(sql`${locations.category} IN (${sql.join(cats.map(c => sql`${c}`), sql`,`)})`);
    }

    const queryLimit = req.query.limit ? Math.min(Number(req.query.limit), 10000) : 5000;

    const rows = await db.select({
      id: locations.id,
      name: locations.name,
      latitude: locations.latitude,
      longitude: locations.longitude,
      category: locations.category,
      subType: locations.subType,
      city: locations.city,
      state: locations.state,
      costPerNight: locations.costPerNight,
      waterNearby: locations.waterNearby,
      waterAvailable: locations.waterAvailable,
      dumpNearby: locations.dumpNearby,
      difficulty: locations.difficulty,
      trailTypes: locations.trailTypes,
      distanceMiles: locations.distanceMiles,
      elevationGainFt: locations.elevationGainFt,
      bestSeason: locations.bestSeason,
      operatorName: locations.operatorName,
      feeInfo: locations.feeInfo,
      hasToilets: locations.hasToilets,
      petFriendly: locations.petFriendly,
      vehiclesAllowed: locations.vehiclesAllowed,
      surfaceType: locations.surfaceType,
      elevationFt: locations.elevationFt,
      sacScale: locations.sacScale,
      mtbScale: locations.mtbScale,
      numSites: locations.numSites,
      isReservable: locations.isReservable,
      isBackcountry: locations.isBackcountry,
      hasShowers: locations.hasShowers,
      hasElectric: locations.hasElectric,
      hasFireRing: locations.hasFireRing,
      brandName: locations.brandName,
      googleRating: locations.googleRating,
      googleReviewCount: locations.googleReviewCount,
      groupId: locations.groupId,
      isGroupPrimary: locations.isGroupPrimary,
      externalLinks: locations.externalLinks,
      source: locations.source,
      visibility: locations.visibility,
      userId: locations.userId,
    }).from(locations).where(and(...conditions)).orderBy(asc(locations.name)).limit(queryLimit);

    // Group filtering - only show primary from groups
    const filtered = rows.filter(r => !r.groupId || r.isGroupPrimary === 1);

    // Precompute group counts
    const groupIds = [...new Set(filtered.map(r => r.groupId).filter(Boolean))] as number[];
    const groupCountMap = new Map<number, number>();
    if (groupIds.length > 0) {
      const groupCounts = await db.select({
        groupId: locations.groupId,
        cnt: sql<number>`count(*)`,
      }).from(locations).where(sql`${locations.groupId} IN ${groupIds}`).groupBy(locations.groupId);
      for (const gc of groupCounts) {
        if (gc.groupId) groupCountMap.set(gc.groupId, gc.cnt);
      }
    }

    const result = filtered.map(r => {
      const obj: Record<string, unknown> = {
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        category: r.category,
        sub_type: r.subType,
      };
      // Only include non-null optional fields to minimize payload
      if (r.city) obj.city = r.city;
      if (r.state) obj.state = r.state;
      if (r.costPerNight != null) obj.cost_per_night = r.costPerNight;
      if (r.waterNearby != null) obj.water_nearby = r.waterNearby;
      if (r.waterAvailable) obj.water_available = r.waterAvailable;
      if (r.dumpNearby != null) obj.dump_nearby = r.dumpNearby;
      if (r.difficulty) obj.difficulty = r.difficulty;
      if (r.trailTypes) obj.trail_types = r.trailTypes;
      if (r.distanceMiles != null) obj.distance_miles = r.distanceMiles;
      if (r.elevationGainFt != null) obj.elevation_gain_ft = r.elevationGainFt;
      if (r.bestSeason) obj.best_season = r.bestSeason;
      if (r.operatorName) obj.operator_name = r.operatorName;
      if (r.feeInfo) obj.fee_info = r.feeInfo;
      if (r.hasToilets != null) obj.has_toilets = r.hasToilets;
      if (r.petFriendly != null) obj.pet_friendly = r.petFriendly;
      if (r.vehiclesAllowed) obj.vehicles_allowed = r.vehiclesAllowed;
      if (r.surfaceType) obj.surface_type = r.surfaceType;
      if (r.elevationFt != null) obj.elevation_ft = r.elevationFt;
      if (r.sacScale) obj.sac_scale = r.sacScale;
      if (r.mtbScale) obj.mtb_scale = r.mtbScale;
      if (r.numSites != null) obj.num_sites = r.numSites;
      if (r.isReservable != null) obj.is_reservable = r.isReservable;
      if (r.isBackcountry != null) obj.is_backcountry = r.isBackcountry;
      if (r.hasShowers != null) obj.has_showers = r.hasShowers;
      if (r.hasElectric != null) obj.has_electric = r.hasElectric;
      if (r.hasFireRing != null) obj.has_fire_ring = r.hasFireRing;
      if (r.brandName) obj.brand_name = r.brandName;
      if (r.googleRating != null) obj.google_rating = r.googleRating;
      if (r.googleReviewCount != null) obj.google_review_count = r.googleReviewCount;
      if (r.externalLinks) obj.external_links = r.externalLinks;
      if (r.source) obj.source = r.source;
      if (r.groupId) {
        obj.group_id = r.groupId;
        obj.group_count = groupCountMap.get(r.groupId) ?? 1;
      }
      return obj;
    });

    res.json(result);
  } catch (err) {
    console.error('Failed to fetch slim locations:', err);
    res.status(500).json({ error: 'Failed to fetch locations', code: 'INTERNAL_ERROR' });
  }
});

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const conditions: ReturnType<typeof eq>[] = [];

    // Visibility: public + user's own private locations
    if (req.user) {
      conditions.push(
        or(
          eq(locations.visibility, 'public'),
          isNull(locations.visibility),
          eq(locations.userId, req.user.id)
        )!
      );
    } else {
      conditions.push(
        or(eq(locations.visibility, 'public'), isNull(locations.visibility))!
      );
    }

    // Group filtering
    if (req.query.show_all !== '1') {
      conditions.push(
        or(isNull(locations.groupId), eq(locations.isGroupPrimary, 1))!
      );
    }

    if (req.query.category) {
      conditions.push(eq(locations.category, String(req.query.category)));
    }
    if (req.query.want_to_visit === '1') {
      conditions.push(eq(locations.wantToVisit, 1));
    }
    if (req.query.favorited === '1') {
      conditions.push(eq(locations.favorited, 1));
    }
    if (req.query.difficulty) {
      conditions.push(eq(locations.difficulty, String(req.query.difficulty)));
    }
    if (req.query.sub_type) {
      conditions.push(eq(locations.subType, String(req.query.sub_type)));
    }

    // Bounding box
    if (req.query.sw_lat && req.query.sw_lng && req.query.ne_lat && req.query.ne_lng) {
      conditions.push(gte(locations.latitude, Number(req.query.sw_lat)));
      conditions.push(sql`${locations.latitude} <= ${Number(req.query.ne_lat)}`);
      conditions.push(gte(locations.longitude, Number(req.query.sw_lng)));
      conditions.push(sql`${locations.longitude} <= ${Number(req.query.ne_lng)}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Distance sort
    if (req.query.sort_by === 'distance' && req.query.from_lat && req.query.from_lng) {
      const fromLat = Number(req.query.from_lat);
      const fromLng = Number(req.query.from_lng);
      const distanceExpr = sql`(3959 * acos(
        cos(radians(${fromLat})) * cos(radians(${locations.latitude})) * cos(radians(${locations.longitude}) - radians(${fromLng})) +
        sin(radians(${fromLat})) * sin(radians(${locations.latitude}))
      ))`;

      const rows = await db
        .select({ location: locations, distanceFrom: distanceExpr.as('distance_from') })
        .from(locations)
        .where(whereClause)
        .orderBy(sql`distance_from`);

      // Precompute group counts in one query
      const groupIds = [...new Set(rows.map(r => r.location.groupId).filter(Boolean))] as number[];
      const groupCountMap = new Map<number, number>();
      if (groupIds.length > 0) {
        const groupCounts = await db.select({
          groupId: locations.groupId,
          cnt: sql<number>`count(*)`,
        }).from(locations).where(sql`${locations.groupId} IN ${groupIds}`).groupBy(locations.groupId);
        for (const gc of groupCounts) {
          if (gc.groupId) groupCountMap.set(gc.groupId, gc.cnt);
        }
      }

      const result = rows.map((r) => ({
        ...r.location,
        distance_from: r.distanceFrom,
        group_count: r.location.groupId ? (groupCountMap.get(r.location.groupId) ?? 1) : 1,
      }));

      if (req.query.trip_month) {
        const month = Number(req.query.trip_month);
        for (const loc of result) {
          (loc as Record<string, unknown>).seasonal_status = computeSeasonalStatus(
            { best_season: loc.bestSeason, latitude: loc.latitude, elevation_gain_ft: loc.elevationGainFt }, month
          );
        }
      }

      res.json(result.map(r => toSnakeCase(r as Record<string, unknown>)));
      return;
    }

    const queryLimit = req.query.limit ? Math.min(Number(req.query.limit), 50000) : 50000;
    const rows = await db.select().from(locations).where(whereClause).orderBy(asc(locations.name)).limit(queryLimit);

    // Precompute group counts in one query
    const groupIds2 = [...new Set(rows.map(r => r.groupId).filter(Boolean))] as number[];
    const groupCountMap2 = new Map<number, number>();
    if (groupIds2.length > 0) {
      const groupCounts = await db.select({
        groupId: locations.groupId,
        cnt: sql<number>`count(*)`,
      }).from(locations).where(sql`${locations.groupId} IN ${groupIds2}`).groupBy(locations.groupId);
      for (const gc of groupCounts) {
        if (gc.groupId) groupCountMap2.set(gc.groupId, gc.cnt);
      }
    }

    const result: (typeof rows[number] & { group_count: number; seasonal_status?: string })[] =
      rows.map((r) => ({ ...r, group_count: r.groupId ? (groupCountMap2.get(r.groupId) ?? 1) : 1 }));

    if (req.query.trip_month) {
      const month = Number(req.query.trip_month);
      for (const loc of result) {
        loc.seasonal_status = computeSeasonalStatus(
          { best_season: loc.bestSeason, latitude: loc.latitude, elevation_gain_ft: loc.elevationGainFt }, month
        );
      }
    }

    res.json(result.map(r => toSnakeCase(r as Record<string, unknown>)));
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Failed to fetch locations', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/locations/group/:groupId ───────────────────────────────────────

router.get('/group/:groupId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    if (!groupId) { res.json([]); return; }
    const members = await db.select().from(locations)
      .where(eq(locations.groupId, groupId))
      .orderBy(desc(locations.isGroupPrimary), asc(locations.name));
    res.json(members.map(m => toSnakeCase(m as Record<string, unknown>)));
  } catch (err) {
    console.error('Error fetching group:', err);
    res.status(500).json({ error: 'Failed to fetch group', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/locations/featured ─────────────────────────────────────────────

router.get('/featured', async (req: Request, res: Response) => {
  try {
    const conditions: ReturnType<typeof eq>[] = [eq(locations.featured, 1)];
    if (req.query.category) {
      conditions.push(eq(locations.category, String(req.query.category)));
    }
    const rows = await db.select().from(locations)
      .where(and(...conditions))
      .orderBy(desc(locations.sceneryRating), asc(locations.name));
    res.json(rows.map(r => toSnakeCase(r as Record<string, unknown>)));
  } catch (err) {
    console.error('Error fetching featured:', err);
    res.status(500).json({ error: 'Failed to fetch featured locations', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/locations/search ───────────────────────────────────────────────

router.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    if (!q) { res.json([]); return; }

    const pattern = `%${q}%`;
    const visibilityCondition = req.user
      ? or(eq(locations.visibility, 'public'), isNull(locations.visibility), eq(locations.userId, req.user.id))
      : or(eq(locations.visibility, 'public'), isNull(locations.visibility));

    const rows = await db
      .select({
        location: locations,
        relevance: sql<number>`CASE
          WHEN LOWER(${locations.name}) = LOWER(${q}) THEN 3
          WHEN LOWER(${locations.name}) LIKE LOWER(${q} || '%') THEN 2
          WHEN LOWER(${locations.state}) = LOWER(${q}) THEN 2
          WHEN LOWER(${locations.city}) = LOWER(${q}) THEN 2
          ELSE 1
        END`.as('relevance'),
      })
      .from(locations)
      .where(
        and(
          visibilityCondition,
          or(
            sql`${locations.name} ILIKE ${pattern}`,
            sql`${locations.description} ILIKE ${pattern}`,
            sql`${locations.notes} ILIKE ${pattern}`,
            sql`${locations.subType} ILIKE ${pattern}`,
            sql`${locations.trailTypes} ILIKE ${pattern}`,
            sql`${locations.difficulty} ILIKE ${pattern}`,
            sql`${locations.city} ILIKE ${pattern}`,
            sql`${locations.state} ILIKE ${pattern}`,
            sql`${locations.county} ILIKE ${pattern}`
          )
        )
      )
      .orderBy(sql`relevance DESC`, asc(locations.name))
      .limit(50);

    res.json(rows.map((r) => toSnakeCase({ ...r.location, relevance: r.relevance } as Record<string, unknown>)));
  } catch (err) {
    console.error('Error searching locations:', err);
    res.status(500).json({ error: 'Failed to search locations', code: 'INTERNAL_ERROR' });
  }
});


// ─── GET /api/locations/:id/google-rating ────────────────────────────────────
// Lazy Google Places enrichment: fetch rating on first view, cache forever.

router.get('/:id/google-rating', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) { res.status(400).json({ error: 'Invalid id' }); return; }

    // Check if already enriched
    const [loc] = await db.select({
      googleRating: locations.googleRating,
      googleReviewCount: locations.googleReviewCount,
      googleEnrichedAt: locations.googleEnrichedAt,
      name: locations.name,
      city: locations.city,
      state: locations.state,
      latitude: locations.latitude,
      longitude: locations.longitude,
    }).from(locations).where(eq(locations.id, id)).limit(1);

    if (!loc) { res.status(404).json({ error: 'Not found' }); return; }

    // If already checked, return cached result
    if (loc.googleEnrichedAt) {
      res.json({ google_rating: loc.googleRating, google_review_count: loc.googleReviewCount });
      return;
    }

    // Fetch from Google Places API
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_API_KEY) {
      res.json({ google_rating: null, google_review_count: null });
      return;
    }

    const query = `${loc.name} ${loc.city || ''} ${loc.state || ''}`.trim();
    const body = JSON.stringify({
      textQuery: query,
      locationBias: { circle: { center: { latitude: loc.latitude, longitude: loc.longitude }, radius: 5000 } },
      maxResultCount: 1,
    });

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.rating,places.userRatingCount,places.id,places.googleMapsUri',
      },
      body,
    });

    const data = await response.json() as { places?: Array<{ rating?: number; userRatingCount?: number; id?: string; googleMapsUri?: string }> };
    const place = data.places?.[0];

    if (place?.rating) {
      await db.update(locations).set({
        googleRating: place.rating,
        googleReviewCount: place.userRatingCount ?? null,
        googlePlaceId: place.id ?? null,
        googleMapsUrl: place.googleMapsUri ?? null,
        googleEnrichedAt: new Date(),
      }).where(eq(locations.id, id));

      res.json({ google_rating: place.rating, google_review_count: place.userRatingCount ?? null });
    } else {
      // Mark as checked (no result)
      await db.update(locations).set({ googleEnrichedAt: new Date() }).where(eq(locations.id, id));
      res.json({ google_rating: null, google_review_count: null });
    }
  } catch (err) {
    console.error('Google rating fetch error:', err);
    res.json({ google_rating: null, google_review_count: null });
  }
});

// ─── GET /api/locations/nearby-riding ────────────────────────────────────────

router.get('/nearby-riding', async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 20;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng are required', code: 'VALIDATION_ERROR' });
      return;
    }

    const distanceExpr = sql`(3959 * acos(LEAST(1, GREATEST(-1,
      cos(radians(${lat})) * cos(radians(${locations.latitude})) * cos(radians(${locations.longitude}) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${locations.latitude}))
    ))))`;

    const rows = await db
      .select({ location: locations, distanceFrom: distanceExpr.as('distance_from') })
      .from(locations)
      .where(and(eq(locations.category, 'riding'), sql`${distanceExpr} <= ${radius}`))
      .orderBy(sql`distance_from`);

    res.json(rows.map((r) => toSnakeCase({ ...r.location, distance_from: r.distanceFrom } as Record<string, unknown>)));
  } catch (err) {
    console.error('Error fetching nearby riding:', err);
    res.status(500).json({ error: 'Failed to fetch nearby riding', code: 'INTERNAL_ERROR' });
  }
});


// ─── GET /api/locations/nearby ───────────────────────────────────────────────
// Returns nearby locations of ALL categories (excluding the same location).
// Used for "Nearby Activities & Services" section on location detail.

router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 20;
    const excludeId = Number(req.query.exclude_id) || 0;
    const excludeCategory = String(req.query.exclude_category || '');

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng are required', code: 'VALIDATION_ERROR' });
      return;
    }

    const distanceExpr = sql`(3959 * acos(LEAST(1, GREATEST(-1,
      cos(radians(${lat})) * cos(radians(${locations.latitude})) * cos(radians(${locations.longitude}) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${locations.latitude}))
    ))))`;

    const conditions = [
      sql`${distanceExpr} <= ${radius}`,
      or(eq(locations.visibility, 'public'), isNull(locations.visibility))!,
    ];
    
    // Exclude same category (we don't need to show nearby campsites on a campsite)
    if (excludeCategory) {
      conditions.push(sql`${locations.category} != ${excludeCategory}`);
    }
    if (excludeId) {
      conditions.push(sql`${locations.id} != ${excludeId}`);
    }

    const rows = await db
      .select({
        id: locations.id,
        name: locations.name,
        latitude: locations.latitude,
        longitude: locations.longitude,
        category: locations.category,
        subType: locations.subType,
        difficulty: locations.difficulty,
        distanceMiles: locations.distanceMiles,
        distanceFrom: distanceExpr.as('distance_from'),
      })
      .from(locations)
      .where(and(...conditions))
      .orderBy(sql`distance_from`)
      .limit(50);

    res.json(rows.map((r) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      category: r.category,
      sub_type: r.subType,
      difficulty: r.difficulty,
      distance_miles: r.distanceMiles,
      distance_from: r.distanceFrom,
    })));
  } catch (err) {
    console.error('Error fetching nearby:', err);
    res.status(500).json({ error: 'Failed to fetch nearby', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/locations/seasonal ─────────────────────────────────────────────

// Seasonal endpoint removed (loaded all 34K locations, never called by frontend)

// ─── GET /api/locations/stats ────────────────────────────────────────────────

router.get('/stats', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { trips, tripStops } = await import('../db/schema');

    const { userLocationData } = await import('../db/schema');

    const [totalRes] = await db.select({ count: sql<number>`count(*)` }).from(locations);
    const [ridingRes] = await db.select({ count: sql<number>`count(*)` }).from(locations).where(eq(locations.category, 'riding'));
    const [campsiteRes] = await db.select({ count: sql<number>`count(*)` }).from(locations).where(eq(locations.category, 'campsite'));
    const [tripCountRes] = await db.select({ count: sql<number>`count(*)` }).from(trips);
    const [totalNightsRes] = await db.select({ total: sql<number>`COALESCE(SUM(${tripStops.nights}), 0)` }).from(tripStops);
    const [totalMilesRes] = await db.select({ total: sql<number>`COALESCE(SUM(${tripStops.driveDistanceMiles}), 0)` }).from(tripStops);

    // User-specific stats from user_location_data (multi-tenant)
    const userId = req.user?.id;
    let visitedCount = 0;
    let ridingVisited = 0;
    const topRated: unknown[] = [];
    let visitedLocations: { latitude: number; longitude: number }[] = [];

    if (userId) {
      const [visitedRes] = await db.select({ count: sql<number>`count(*)` }).from(userLocationData)
        .where(and(eq(userLocationData.userId, userId), eq(userLocationData.visited, 1)));
      visitedCount = visitedRes.count;

      // Visited riding areas
      const [rvRes] = await db.select({ count: sql<number>`count(*)` }).from(userLocationData)
        .innerJoin(locations, eq(userLocationData.locationId, locations.id))
        .where(and(eq(userLocationData.userId, userId), eq(userLocationData.visited, 1), eq(locations.category, 'riding')));
      ridingVisited = rvRes.count;

      // Visited location coordinates for map
      visitedLocations = await db
        .select({ latitude: locations.latitude, longitude: locations.longitude })
        .from(userLocationData)
        .innerJoin(locations, eq(userLocationData.locationId, locations.id))
        .where(and(eq(userLocationData.userId, userId), eq(userLocationData.visited, 1)));
    }

    res.json({
      totalLocations: totalRes.count,
      visitedCount,
      ridingAreas: ridingRes.count,
      ridingVisited,
      campsites: campsiteRes.count,
      tripCount: tripCountRes.count,
      totalNights: totalNightsRes.total,
      totalMiles: Math.round(Number(totalMilesRes.total) * 10) / 10,
      topRated,
      visitedLocations,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/locations/export ───────────────────────────────────────────────

router.get('/export', requireAuth, async (req: Request, res: Response) => {
  // Admin-only
  const adminId = process.env.ADMIN_USER_ID;
  if (!adminId || req.user!.id !== adminId) {
    res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    return;
  }
  try {
    const rows = await db.select().from(locations).orderBy(asc(locations.category), asc(locations.name));
    res.setHeader('Content-Disposition', 'attachment; filename="trailcamp-locations.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({ exported: new Date().toISOString(), count: rows.length, locations: rows });
  } catch (err) {
    console.error('Error exporting locations:', err);
    res.status(500).json({ error: 'Failed to export locations', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/locations/:id ──────────────────────────────────────────────────

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    if (!location) {
      res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      return;
    }
    if (location.visibility === 'private' && location.userId !== req.user?.id) {
      res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      return;
    }
    res.json(toSnakeCase(location as Record<string, unknown>));
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).json({ error: 'Failed to fetch location', code: 'INTERNAL_ERROR' });
  }
});

// Legacy PUT /:id/favorite removed — use POST/DELETE /api/favorites/:locationId

// ─── POST /api/locations ─────────────────────────────────────────────────────

router.post('/', requireAuth, validate(createLocationSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const now = new Date();
    const [created] = await db.insert(locations).values({
      name: body.name,
      description: body.description ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      category: body.category,
      subType: body.sub_type ?? null,
      source: body.source ?? 'user',
      cellSignal: body.cell_signal ?? null,
      shade: body.shade ?? null,
      levelGround: body.level_ground ?? null,
      waterNearby: body.water_nearby ?? null,
      dumpNearby: body.dump_nearby ?? null,
      maxVehicleLength: body.max_vehicle_length ?? null,
      stayLimitDays: body.stay_limit_days ?? null,
      season: body.season ?? null,
      crowding: body.crowding ?? null,
      trailTypes: jsonifyField(body.trail_types),
      difficulty: body.difficulty ?? null,
      distanceMiles: body.distance_miles ?? null,
      elevationGainFt: body.elevation_gain_ft ?? null,
      permitRequired: body.permit_required ?? null,
      permitInfo: body.permit_info ?? null,
      sceneryRating: body.scenery_rating ?? null,
      bestSeason: body.best_season ?? null,
      photos: jsonifyField(body.photos),
      externalLinks: jsonifyField(body.external_links),
      notes: body.notes ?? null,
      hours: body.hours ?? null,
      userRating: body.user_rating ?? null,
      userNotes: body.user_notes ?? null,
      visited: body.visited ?? 0,
      visitedDate: body.visited_date ?? null,
      wantToVisit: body.want_to_visit ?? 0,
      visibility: body.visibility ?? 'public',
      userId: req.user!.id,
      createdAt: now,
      updatedAt: now,
    }).returning();
    res.status(201).json(toSnakeCase(created as Record<string, unknown>));
  } catch (err) {
    console.error('Error creating location:', err);
    res.status(500).json({ error: 'Failed to create location', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/locations/:id ──────────────────────────────────────────────────

router.put('/:id', requireAuth, validate(updateLocationSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(locations).where(eq(locations.id, id));
    if (!existing) {
      res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      return;
    }
    if (!existing.userId || existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to update this location', code: 'FORBIDDEN' });
      return;
    }

    const body = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    const fieldMap: Record<string, string> = {
      name: 'name', description: 'description', latitude: 'latitude', longitude: 'longitude',
      category: 'category', sub_type: 'subType', source: 'source',
      cell_signal: 'cellSignal', shade: 'shade', level_ground: 'levelGround',
      water_nearby: 'waterNearby', dump_nearby: 'dumpNearby', max_vehicle_length: 'maxVehicleLength',
      stay_limit_days: 'stayLimitDays', season: 'season', crowding: 'crowding',
      difficulty: 'difficulty', distance_miles: 'distanceMiles',
      elevation_gain_ft: 'elevationGainFt', permit_required: 'permitRequired',
      permit_info: 'permitInfo', scenery_rating: 'sceneryRating', best_season: 'bestSeason',
      notes: 'notes', hours: 'hours', user_rating: 'userRating', user_notes: 'userNotes',
      visited: 'visited', visited_date: 'visitedDate', want_to_visit: 'wantToVisit',
      favorited: 'favorited', visibility: 'visibility',
    };

    const jsonFields = ['trail_types', 'photos', 'external_links'];
    const jsonSchemaKeys: Record<string, string> = {
      trail_types: 'trailTypes', photos: 'photos', external_links: 'externalLinks',
    };

    for (const [bodyKey, schemaKey] of Object.entries(fieldMap)) {
      if (bodyKey in body) {
        updateData[schemaKey] = body[bodyKey];
      }
    }
    for (const field of jsonFields) {
      if (field in body) {
        updateData[jsonSchemaKeys[field]] = jsonifyField(body[field]);
      }
    }

    if (Object.keys(updateData).length <= 1) {
      res.status(400).json({ error: 'No fields to update', code: 'VALIDATION_ERROR' });
      return;
    }

    const [updated] = await db.update(locations).set(updateData).where(eq(locations.id, id)).returning();
    res.json(toSnakeCase(updated as Record<string, unknown>));
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update location', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/locations/:id ───────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(locations).where(eq(locations.id, id));
    if (!existing) {
      res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      return;
    }
    if (!existing.userId || existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to delete this location', code: 'FORBIDDEN' });
      return;
    }
    await db.delete(locations).where(eq(locations.id, id));
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ error: 'Failed to delete location', code: 'INTERNAL_ERROR' });
  }
});

export default router;
