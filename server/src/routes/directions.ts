import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/directions?stops=lat1,lng1;lat2,lng2;...
router.get('/', async (req: Request, res: Response) => {
  const stops = req.query.stops as string;
  if (!stops) {
    res.status(400).json({ error: 'stops parameter required (format: lat1,lng1;lat2,lng2)' });
    return;
  }

  const coords = stops.split(';').map(s => {
    const [lat, lng] = s.split(',');
    return `${lng},${lat}`; // Mapbox wants lng,lat
  }).join(';');

  const mapboxToken = process.env.MAPBOX_SECRET_KEY;

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&steps=false&access_token=${mapboxToken}`
    );
    const data: any = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      res.json({
        distance_miles: Math.round(route.distance * 0.000621371 * 10) / 10,
        duration_mins: Math.round(route.duration / 60),
        geometry: route.geometry,
        legs: route.legs?.map((leg: any) => ({
          distance_miles: Math.round(leg.distance * 0.000621371 * 10) / 10,
          duration_mins: Math.round(leg.duration / 60),
        })),
      });
    } else {
      res.json({ error: 'No route found', data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch directions' });
  }
});

export default router;
