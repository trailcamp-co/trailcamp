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
  location_sub_type?: string;
  location_difficulty?: string;
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
  water_available: number | null;
  cost_per_night: number | null;
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
  favorited: number;
  featured: number;
  created_at: string;
  updated_at: string;
  distance_from?: number;
  seasonal_status?: 'great' | 'shoulder' | 'bad';
  group_id?: number | null;
  is_group_primary?: number;
  group_count?: number;
  user_id?: string | null;
  visibility?: string;
}

export type LocationCategory = 'campsite' | 'riding' | 'water' | 'dump' | 'gas' | 'grocery' | 'scenic' | 'laundromat';

export type CampsiteSubType = 'boondocking' | 'campground' | 'parking' | 'other';

export const CAMPSITE_SUBTYPE_ICONS: Record<CampsiteSubType, string> = {
  boondocking: '⛺',
  campground: '🏕️',
  parking: '🅿️',
  other: '🏕️',
};

export const CAMPSITE_SUBTYPE_COLORS: Record<CampsiteSubType, string> = {
  boondocking: '#8b5cf6',
  campground: '#22c55e',
  parking: '#64748b',
  other: '#14b8a6',
};

export const CAMPSITE_SUBTYPE_LABELS: Record<CampsiteSubType, string> = {
  boondocking: 'Boondocking',
  campground: 'Campgrounds',
  parking: 'Overnight Parking',
  other: 'Other Camps',
};

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
  campsite: '#22c55e',
  riding: '#f97316',
  water: '#3b82f6',
  dump: '#a16207',
  gas: '#6b7280',
  grocery: '#eab308',
  scenic: '#ec4899',
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

export interface JournalEntry {
  id: number;
  trip_id: number;
  stop_id: number | null;
  content: string;
  entry_date: string | null;
  created_at: string;
  stop_name?: string | null;
}

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

export interface WeatherData {
  date: string;
  high: number;
  low: number;
  precipitation: number;
  weathercode: number;
  icon: string;
  label: string;
}

export interface Filters {
  categories: Set<LocationCategory>;
  campsiteSubTypes: Set<CampsiteSubType>;
  waterNearby: boolean;
  dumpNearby: boolean;
  difficulty: string | null;
  visitedStatus: 'all' | 'visited' | 'highly_rated' | 'favorites';
  minScenery: number;
  nearRoute: boolean;
  nearRouteDistance: number;
  hideOutOfSeason: boolean;
  seasonMonth: number | null;
}

export const DEFAULT_FILTERS: Filters = {
  categories: new Set(['campsite', 'riding', 'water', 'dump', 'scenic'] as LocationCategory[]),
  campsiteSubTypes: new Set(['boondocking', 'campground', 'parking'] as CampsiteSubType[]),
  waterNearby: false,
  dumpNearby: false,
  difficulty: null,
  visitedStatus: 'all',
  minScenery: 0,
  nearRoute: false,
  nearRouteDistance: 25,
  hideOutOfSeason: false,
  seasonMonth: null,
};

export const WEATHER_CODES: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: 'Clear' },
  1: { icon: '🌤️', label: 'Mostly Clear' },
  2: { icon: '⛅', label: 'Partly Cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Rime Fog' },
  51: { icon: '🌦️', label: 'Light Drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy Drizzle' },
  61: { icon: '🌧️', label: 'Light Rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy Rain' },
  71: { icon: '🌨️', label: 'Light Snow' },
  73: { icon: '🌨️', label: 'Snow' },
  75: { icon: '❄️', label: 'Heavy Snow' },
  80: { icon: '🌦️', label: 'Rain Showers' },
  81: { icon: '🌧️', label: 'Rain Showers' },
  82: { icon: '⛈️', label: 'Heavy Showers' },
  85: { icon: '🌨️', label: 'Snow Showers' },
  86: { icon: '❄️', label: 'Heavy Snow' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm + Hail' },
  99: { icon: '⛈️', label: 'Severe Storm' },
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Moderate: '#f59e0b',
  Hard: '#ef4444',
  Expert: '#7c3aed',
};

export const TRAIL_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Single Track': { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  'Fire Road': { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  'Motocross': { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  'Enduro': { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  'Desert': { bg: 'rgba(234,179,8,0.15)', text: '#facc15' },
  'Ridge Riding': { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  'Technical': { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  'Dual Sport': { bg: 'rgba(6,182,212,0.15)', text: '#22d3ee' },
  'Sand Dunes': { bg: 'rgba(234,179,8,0.15)', text: '#facc15' },
  'Rock Crawling': { bg: 'rgba(168,162,158,0.15)', text: '#a8a29e' },
  'Beginner': { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  'Sand': { bg: 'rgba(234,179,8,0.15)', text: '#facc15' },
  'Scenic Road': { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
};

export function parseTrailTypes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(s => s.trim()).filter(Boolean);
  } catch {
    // not JSON
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
