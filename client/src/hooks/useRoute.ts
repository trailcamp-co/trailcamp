import { useState, useEffect } from 'react';
import type { TripStop } from '../types';

export function useRoute(
  stops: TripStop[],
  updateStop: (stopId: number, data: Partial<TripStop>) => Promise<TripStop | undefined>,
) {
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.GeoJsonObject | null>(null);

  useEffect(() => {
    if (stops.length < 2) {
      setRouteGeoJSON(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        const stopsParam = stops.map(s => `${s.latitude},${s.longitude}`).join(';');
        const res = await fetch(`/api/directions?stops=${stopsParam}`);
        const data = await res.json();
        if (data.geometry) {
          setRouteGeoJSON(data.geometry);
          if (data.legs) {
            data.legs.forEach((leg: { duration_mins: number; distance_miles: number }, i: number) => {
              if (stops[i + 1]) {
                updateStop(stops[i + 1].id, {
                  drive_time_mins: leg.duration_mins,
                  drive_distance_miles: leg.distance_miles,
                });
              }
            });
          }
        }
      } catch {
        // Route fetch failed silently
      }
    };

    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, stops.map(s => `${s.latitude},${s.longitude}`).join(';')]);

  return { routeGeoJSON };
}
