import type { LocationCategory } from '../../types';

/** Categories shown in the map layer toggle panel */
export const MAP_LAYER_CATEGORIES: LocationCategory[] = [
  'campsite', 'riding', 'water', 'dump', 'scenic',
];

/** Default map center (continental US) */
export const DEFAULT_CENTER: [number, number] = [-98, 39];

/** Default map zoom level */
export const DEFAULT_ZOOM = 4;

/** Minimum zoom to show emoji markers */
export const EMOJI_MIN_ZOOM = 4;

/** Cluster max zoom level */
export const CLUSTER_MAX_ZOOM = 12;

/** Cluster radius in pixels */
export const CLUSTER_RADIUS = 50;

/** Fly-to animation zoom level */
export const FLY_TO_ZOOM = 13;

/** Fly-to animation duration in ms */
export const FLY_TO_DURATION = 1500;

/** BLM overlay colors */
export const BLM_FILL_COLOR = '#F59E0B';
export const BLM_BORDER_COLOR = '#D97706';

/** USFS overlay colors */
export const USFS_FILL_COLOR = '#22C55E';

/** Stop marker size */
export const STOP_MARKER_SIZE = 28;
