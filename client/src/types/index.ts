export interface Trip {
  id: number;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'completed';
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stop_count?: number;
  total_nights?: number;
  total_distance?: number;
}

export interface TripStop {
  id: number;
  trip_id: number;
  location_id: number | null;
  name: string | null;
  latitude: number;
  longitude: number;
  sort_order: number;
  planned_arrival: string | null;
  planned_departure: string | null;
  actual_arrival: string | null;
  actual_departure: string | null;
  nights: number | null;
  notes: string | null;
  drive_time_mins: number | null;
  drive_distance_miles: number | null;
  location_name?: string;
  location_category?: string;
}

export interface Location {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: LocationCategory;
  sub_type: string | null;
  source: string | null;
  source_id: string | null;
  cell_signal: string | null;
  shade: number | null;
  level_ground: number | null;
  water_nearby: number | null;
  dump_nearby: number | null;
  max_vehicle_length: number | null;
  stay_limit_days: number | null;
  season: string | null;
  crowding: string | null;
  trail_types: string | null;
  difficulty: string | null;
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  permit_required: number | null;
  permit_info: string | null;
  scenery_rating: number | null;
  best_season: string | null;
  photos: string | null;
  external_links: string | null;
  notes: string | null;
  hours: string | null;
  user_rating: number | null;
  user_notes: string | null;
  visited: number;
  visited_date: string | null;
  want_to_visit: number;
  created_at: string;
  updated_at: string;
}

export type LocationCategory = 'campsite' | 'riding' | 'water' | 'dump' | 'gas' | 'grocery' | 'scenic' | 'laundromat';

export interface MapStyle {
  id: string;
  name: string;
  url: string;
}

export const MAP_STYLES: MapStyle[] = [
  { id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'outdoors', name: 'Topo', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'hybrid', name: 'Hybrid', url: 'mapbox://styles/mapbox/satellite-v9' },
  { id: 'streets', name: 'Street', url: 'mapbox://styles/mapbox/dark-v11' },
];

export const CATEGORY_COLORS: Record<LocationCategory, string> = {
  campsite: '#f97316',
  riding: '#ef4444',
  water: '#3b82f6',
  dump: '#92400e',
  gas: '#6b7280',
  grocery: '#eab308',
  scenic: '#a855f7',
  laundromat: '#14b8a6',
};

export const CATEGORY_LABELS: Record<LocationCategory, string> = {
  campsite: 'Campsites',
  riding: 'Riding Areas',
  water: 'Water Stations',
  dump: 'Dump Stations',
  gas: 'Gas Stations',
  grocery: 'Grocery / Resupply',
  scenic: 'Scenic Viewpoints',
  laundromat: 'Laundromat',
};

export const CATEGORY_ICONS: Record<LocationCategory, string> = {
  campsite: '🏕️',
  riding: '🏍️',
  water: '💧',
  dump: '🚽',
  gas: '⛽',
  grocery: '🛒',
  scenic: '📸',
  laundromat: '🧺',
};

export interface Stats {
  totalLocations: number;
  visitedCount: number;
  ridingAreas: number;
  ridingVisited: number;
  campsites: number;
  tripCount: number;
  totalNights: number;
  totalMiles: number;
  topRated: Location[];
  visitedLocations: { latitude: number; longitude: number }[];
}
