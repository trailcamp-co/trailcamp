import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/directions?stops=lat1,lng1;lat2,lng2;...
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const stops = req.query.stops as string;
  if (!stops) {
    res.status(400).json({ error: 'stops parameter required (format: lat1,lng1;lat2,lng2)' });
    return;
  }

  const points = stops.split(';');
  if (points.length < 2 || points.length > 25) {
    res.status(400).json({ error: 'Between 2 and 25 waypoints required' });
    return;
  }

  // Validate coordinate format
  const coords = points.map(s => {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    const [lat, lng] = parts.map(Number);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return `${lng},${lat}`; // Mapbox wants lng,lat
  });

  if (coords.some(c => c === null)) {
    res.status(400).json({ error: 'Invalid coordinate format. Expected: lat,lng' });
    return;
  }

  const mapboxToken = process.env.MAPBOX_PUBLIC_KEY || process.env.MAPBOX_SECRET_KEY;
  if (!mapboxToken) {
    res.status(500).json({ error: 'Mapbox not configured' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords.join(';')}?geometries=geojson&overview=full&steps=false&access_token=${mapboxToken}`
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
