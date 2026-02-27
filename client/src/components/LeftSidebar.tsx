import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Clock,
  Route,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
  Check,
  Navigation,
  Filter,
  Mountain,
  Star,
  Bike,
  Calendar,
  CloudSun,
  Sliders,
} from 'lucide-react';
import type { Location, Trip, TripStop, LocationCategory, Filters, WeatherData } from '../types';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DIFFICULTY_COLORS,
  DEFAULT_FILTERS,
  TRAIL_TYPE_COLORS,
  parseTrailTypes,
} from '../types';

// --------------- Types ---------------

interface LeftSidebarProps {
  selectedTrip: Trip | null;
  trips: Trip[];
  stops: TripStop[];
  onSelectTrip: (trip: Trip | null) => void;
  onCreateTrip: (trip: Partial<Trip>) => Promise<Trip>;
  onUpdateTrip: (id: number, data: Partial<Trip>) => Promise<Trip>;
  onDeleteTrip: (id: number) => Promise<void>;
  onAddStop: (stop: Partial<TripStop>) => Promise<TripStop | undefined>;
  onUpdateStop: (stopId: number, data: Partial<TripStop>) => Promise<TripStop | undefined>;
  onDeleteStop: (stopId: number) => Promise<void>;
  onReorderStops: (stopIds: number[]) => Promise<void>;
  onFlyTo: (lng: number, lat: number) => void;
  locations: Location[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  weatherCache: Record<string, WeatherData>;
  fetchWeather: (lat: number, lng: number, date: string) => Promise<WeatherData | null>;
  routeGeoJSON: any;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
}

type SidebarTab = 'trip' | 'riding' | 'filters';

type RidingSortField = 'name' | 'distance_miles' | 'difficulty' | 'scenery_rating';

// --------------- Constants ---------------

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const STATUS_STYLES_LIGHT: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700 border border-blue-200',
  active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  completed: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 1,
  Moderate: 2,
  Hard: 3,
  Expert: 4,
};

const ALL_CATEGORIES: LocationCategory[] = [
  'campsite',
  'riding',
  'water',
  'dump',
  'gas',
  'grocery',
  'scenic',
  'laundromat',
];

// --------------- Modifier ---------------

const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

// --------------- Utility functions ---------------

function formatDriveTime(mins: number | null): string {
  if (mins == null) return '';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDistance(miles: number | null): string {
  if (miles == null) return '';
  return `${Math.round(miles)} mi`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeatherCacheKey(lat: number, lng: number, date: string): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
}

function renderStars(count: number, max: number = 5): JSX.Element {
  const stars: JSX.Element[] = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <Star
        key={i}
        size={12}
        className={i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
      />,
    );
  }
  return <span className="inline-flex gap-0.5">{stars}</span>;
}

// --------------- Stop Date Calculator ---------------

interface StopDateInfo {
  arrivalDate: string;
  departureDate: string;
}

function calculateStopDates(
  stops: TripStop[],
  startDate: string | null,
): Map<number, StopDateInfo> {
  const dateMap = new Map<number, StopDateInfo>();
  if (!startDate) return dateMap;

  let currentDate = startDate;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const arrivalDate = currentDate;
    const nights = stop.nights ?? 0;
    const departureDate = addDays(arrivalDate, nights);

    dateMap.set(stop.id, { arrivalDate, departureDate });

    // Next stop arrives one day after departure (drive day)
    if (i < stops.length - 1) {
      currentDate = addDays(departureDate, 1);
    }
  }

  return dateMap;
}

// --------------- SortableStopCard ---------------

interface SortableStopCardProps {
  stop: TripStop;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFlyTo: (lng: number, lat: number) => void;
  onDeleteStop: (stopId: number) => void;
  onUpdateStop: (stopId: number, data: Partial<TripStop>) => Promise<TripStop | undefined>;
  dateInfo: StopDateInfo | null;
  weatherData: WeatherData | null;
  isForecastTooFar: boolean;
  driveTimeMins: number | null;
  driveDistanceMiles: number | null;
  showDriveConnector: boolean;
}

function SortableStopCard({
  stop,
  index,
  isExpanded,
  onToggleExpand,
  onFlyTo,
  onDeleteStop,
  onUpdateStop,
  dateInfo,
  weatherData,
  isForecastTooFar,
  driveTimeMins,
  driveDistanceMiles,
  showDriveConnector,
}: SortableStopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const stopName = stop.name || stop.location_name || 'Unnamed Stop';

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drive time connector (between stops) */}
      {showDriveConnector && (driveTimeMins || driveDistanceMiles) && (
        <div className="flex items-center gap-2 px-4 py-1.5">
          <div className="w-6 flex justify-center">
            <div className="w-px h-4 bg-gray-700 [.light_&]:bg-gray-300" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Navigation size={10} className="text-orange-400/60" />
            <span>
              {formatDriveTime(driveTimeMins)}
              {driveTimeMins && driveDistanceMiles && ' | '}
              {formatDistance(driveDistanceMiles)}
            </span>
          </div>
        </div>
      )}

      {/* Stop card */}
      <div
        className={`group mx-2 mb-1 rounded-lg transition-all duration-150 cursor-pointer
          bg-dark-800 [.light_&]:bg-white
          border border-transparent
          hover:border-gray-600 [.light_&]:hover:border-gray-300
          ${isDragging ? 'border-orange-500 bg-orange-500/5 shadow-lg' : ''}
        `}
      >
        <div
          className="flex items-start gap-2 p-3"
          onClick={() => onFlyTo(stop.longitude, stop.latitude)}
        >
          {/* Drag handle */}
          <div
            className="drag-handle mt-0.5 text-gray-600 hover:text-gray-400 [.light_&]:text-gray-400 [.light_&]:hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </div>

          {/* Stop number */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>

          {/* Stop info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate">
                {stopName}
              </span>
              {/* Delete button (visible on hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStop(stop.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                title="Remove stop"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Nights + date info row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {stop.nights != null && stop.nights > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={10} />
                  <span>
                    {stop.nights} night{stop.nights !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {dateInfo && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={10} className="text-blue-400/70" />
                  <span>{formatShortDate(dateInfo.arrivalDate)}</span>
                </div>
              )}
            </div>

            {/* Weather inline */}
            {dateInfo && weatherData && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400" title={weatherData.label}>
                <span>{weatherData.icon}</span>
                <span>{Math.round(weatherData.high)}/{Math.round(weatherData.low)}</span>
              </div>
            )}
            {dateInfo && isForecastTooFar && !weatherData && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-600 italic">
                <CloudSun size={10} />
                <span>Too far for forecast</span>
              </div>
            )}

            {/* Category badge */}
            {stop.location_category && (
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400 [.light_&]:bg-gray-100 [.light_&]:text-gray-500 capitalize">
                {stop.location_category}
              </span>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="mt-0.5 p-1 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-gray-700/50 [.light_&]:border-gray-200 mx-3 mt-0">
            <div className="pt-2">
              <label className="text-[11px] uppercase tracking-wider text-gray-500 mb-1 block">
                Notes
              </label>
              <textarea
                value={stop.notes ?? ''}
                onChange={(e) => onUpdateStop(stop.id, { notes: e.target.value })}
                placeholder="Add notes for this stop..."
                rows={3}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1.5 text-xs text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
              />
              <div className="flex items-center gap-2 mt-2">
                <label className="text-[11px] text-gray-500">Nights:</label>
                <input
                  type="number"
                  min={0}
                  value={stop.nights ?? 0}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    onUpdateStop(stop.id, {
                      nights: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-16 bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------- Overlay Stop Card (for DragOverlay) ---------------

interface OverlayStopCardProps {
  stop: TripStop;
  index: number;
}

function OverlayStopCard({ stop, index }: OverlayStopCardProps) {
  const stopName = stop.name || stop.location_name || 'Unnamed Stop';
  return (
    <div className="mx-2 mb-1 rounded-lg bg-dark-800 [.light_&]:bg-white border border-orange-500 shadow-2xl shadow-orange-500/20">
      <div className="flex items-start gap-2 p-3">
        <div className="mt-0.5 text-gray-400">
          <GripVertical size={16} />
        </div>
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate block">
            {stopName}
          </span>
          {stop.nights != null && stop.nights > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Clock size={10} />
              <span>
                {stop.nights} night{stop.nights !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------- Filters Panel ---------------

interface FiltersPanelProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  routeGeoJSON: any;
}

function FiltersPanel({ filters, setFilters, routeGeoJSON }: FiltersPanelProps) {
  const toggleCategory = (cat: LocationCategory) => {
    setFilters((prev) => {
      const next = new Set(prev.categories);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return { ...prev, categories: next };
    });
  };

  const toggleBoolean = (key: 'waterNearby' | 'dumpNearby' | 'shade' | 'levelGround') => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-3 space-y-4">
      {/* Category filters */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Filter size={12} className="text-orange-400" />
          Categories
        </h4>
        <div className="space-y-1">
          {ALL_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-dark-700 [.light_&]:hover:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.categories.has(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 bg-dark-900 [.light_&]:bg-white"
              />
              <span className="text-sm" style={{ color: CATEGORY_COLORS[cat] }}>
                {CATEGORY_ICONS[cat]}
              </span>
              <span className="text-sm text-gray-300 [.light_&]:text-gray-700">
                {CATEGORY_LABELS[cat]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenity toggles */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sliders size={12} className="text-orange-400" />
          Amenities
        </h4>
        <div className="space-y-1">
          {[
            { key: 'waterNearby' as const, label: 'Water Nearby', icon: '💧' },
            { key: 'dumpNearby' as const, label: 'Dump Nearby', icon: '🚽' },
            { key: 'shade' as const, label: 'Shade', icon: '🌲' },
            { key: 'levelGround' as const, label: 'Level Ground', icon: '📐' },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-dark-700 [.light_&]:hover:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={() => toggleBoolean(key)}
                className="rounded border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 bg-dark-900 [.light_&]:bg-white"
              />
              <span className="text-sm">{icon}</span>
              <span className="text-sm text-gray-300 [.light_&]:text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty dropdown */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Mountain size={12} className="text-orange-400" />
          Difficulty
        </h4>
        <select
          value={filters.difficulty ?? 'all'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              difficulty: e.target.value === 'all' ? null : e.target.value,
            }))
          }
          className="w-full bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Moderate">Moderate</option>
          <option value="Hard">Hard</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      {/* Min scenery rating */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Star size={12} className="text-orange-400" />
          Min Scenery Rating
        </h4>
        <div className="flex items-center gap-1 px-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  minScenery: prev.minScenery === val ? 0 : val,
                }))
              }
              className="transition-colors"
            >
              <Star
                size={18}
                className={
                  val <= filters.minScenery
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600 [.light_&]:text-gray-400 hover:text-yellow-400/50'
                }
              />
            </button>
          ))}
          {filters.minScenery > 0 && (
            <span className="text-xs text-gray-500 ml-2">{filters.minScenery}+ stars</span>
          )}
        </div>
      </div>

      {/* Near Route */}
      {routeGeoJSON && (
        <div>
          <h4 className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Route size={12} className="text-orange-400" />
            Near Route
          </h4>
          <div className="space-y-2 px-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  filters.nearRoute ? 'bg-orange-500' : 'bg-gray-700 [.light_&]:bg-gray-300'
                }`}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, nearRoute: !prev.nearRoute }))
                }
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    filters.nearRoute ? 'translate-x-4' : ''
                  }`}
                />
              </div>
              <span className="text-sm text-gray-300 [.light_&]:text-gray-700">
                Show only near route
              </span>
            </label>
            {filters.nearRoute && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Distance: {filters.nearRouteDistance} mi</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={filters.nearRouteDistance}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      nearRouteDistance: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>5 mi</span>
                  <span>50 mi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset filters */}
      <button
        onClick={() => setFilters(DEFAULT_FILTERS)}
        className="w-full text-center text-xs text-gray-500 hover:text-orange-400 py-2 transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );
}

// --------------- Riding Areas Panel ---------------

interface RidingPanelProps {
  locations: Location[];
  onFlyTo: (lng: number, lat: number) => void;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
}

function RidingPanel({ locations, onFlyTo, mapBounds }: RidingPanelProps) {
  const [sortField, setSortField] = useState<RidingSortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterTrailType, setFilterTrailType] = useState<string>('');
  const [viewportFilter, setViewportFilter] = useState(false);

  const ridingLocations = useMemo(() => {
    let filtered = locations.filter((l) => l.category === 'riding');

    // Viewport filter
    if (viewportFilter && mapBounds) {
      filtered = filtered.filter(
        (l) =>
          l.latitude >= mapBounds.south &&
          l.latitude <= mapBounds.north &&
          l.longitude >= mapBounds.west &&
          l.longitude <= mapBounds.east,
      );
    }

    if (filterDifficulty) {
      filtered = filtered.filter((l) => l.difficulty === filterDifficulty);
    }

    if (filterTrailType.trim()) {
      const term = filterTrailType.toLowerCase();
      filtered = filtered.filter(
        (l) => l.trail_types && l.trail_types.toLowerCase().includes(term),
      );
    }

    filtered.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'distance_miles':
          return dir * ((a.distance_miles ?? 0) - (b.distance_miles ?? 0));
        case 'difficulty':
          return dir * ((DIFFICULTY_ORDER[a.difficulty ?? ''] ?? 0) - (DIFFICULTY_ORDER[b.difficulty ?? ''] ?? 0));
        case 'scenery_rating':
          return dir * ((a.scenery_rating ?? 0) - (b.scenery_rating ?? 0));
        default:
          return 0;
      }
    });

    return filtered;
  }, [locations, sortField, sortAsc, filterDifficulty, filterTrailType, viewportFilter, mapBounds]);

  const handleSortChange = (field: RidingSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sort + filter controls */}
      <div className="flex-shrink-0 p-3 border-b border-gray-700/50 [.light_&]:border-gray-200 space-y-2">
        {/* Sort buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">Sort:</span>
          {(
            [
              { field: 'name' as RidingSortField, label: 'Name' },
              { field: 'distance_miles' as RidingSortField, label: 'Miles' },
              { field: 'difficulty' as RidingSortField, label: 'Diff' },
              { field: 'scenery_rating' as RidingSortField, label: 'Scenery' },
            ] as const
          ).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortChange(field)}
              className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                sortField === field
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 border border-transparent'
              }`}
            >
              {label}
              {sortField === field && (sortAsc ? ' \u2191' : ' \u2193')}
            </button>
          ))}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <select
            value={filterDifficulty ?? 'all'}
            onChange={(e) =>
              setFilterDifficulty(e.target.value === 'all' ? null : e.target.value)
            }
            className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="all">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
          <input
            type="text"
            value={filterTrailType}
            onChange={(e) => setFilterTrailType(e.target.value)}
            placeholder="Trail type..."
            className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-600">
            {ridingLocations.length} riding area{ridingLocations.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setViewportFilter(!viewportFilter)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              viewportFilter
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 border border-transparent hover:border-gray-600 [.light_&]:hover:border-gray-300'
            }`}
          >
            {viewportFilter ? '📍 In view' : 'Show all'}
          </button>
        </div>
      </div>

      {/* Location list */}
      <div className="flex-1 overflow-y-auto">
        {ridingLocations.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <Bike size={32} className="mx-auto mb-2 opacity-40" />
            <p>No riding areas found.</p>
          </div>
        )}
        {ridingLocations.map((loc) => {
          const diffColor = DIFFICULTY_COLORS[loc.difficulty ?? ''] ?? '#6b7280';
          return (
            <button
              key={loc.id}
              onClick={() => onFlyTo(loc.longitude, loc.latitude)}
              className="w-full text-left px-3 py-2.5 border-b border-gray-700/30 [.light_&]:border-gray-100
                hover:bg-dark-700 [.light_&]:hover:bg-gray-50 transition-colors group flex gap-0"
            >
              {/* Colored left accent bar */}
              <div
                className="w-1 rounded-full flex-shrink-0 mr-2.5 self-stretch"
                style={{ backgroundColor: diffColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate">
                    {loc.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {loc.difficulty && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: diffColor + '22',
                        color: diffColor,
                      }}
                    >
                      {loc.difficulty}
                    </span>
                  )}
                  {loc.distance_miles != null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400 [.light_&]:bg-gray-100 [.light_&]:text-gray-500 flex items-center gap-0.5">
                      📏 {Math.round(loc.distance_miles)} mi
                    </span>
                  )}
                  {loc.elevation_gain_ft != null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400 [.light_&]:bg-gray-100 [.light_&]:text-gray-500 flex items-center gap-0.5">
                      ⛰️ {loc.elevation_gain_ft.toLocaleString()} ft
                    </span>
                  )}
                  {loc.scenery_rating != null && loc.scenery_rating > 0 && (
                    <span className="flex items-center">{renderStars(loc.scenery_rating)}</span>
                  )}
                </div>
                {loc.trail_types && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {parseTrailTypes(loc.trail_types).map((tt) => {
                      const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
                      return (
                        <span
                          key={tt}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {tt}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --------------- Main Component ---------------

export default function LeftSidebar({
  selectedTrip,
  trips,
  stops,
  onSelectTrip,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onReorderStops,
  onFlyTo,
  locations,
  filters,
  setFilters,
  weatherCache,
  fetchWeather,
  routeGeoJSON,
  mapBounds,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('trip');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [expandedStopId, setExpandedStopId] = useState<number | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalValue, setJournalValue] = useState('');
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showAddStop, setShowAddStop] = useState(false);
  const [addStopSearch, setAddStopSearch] = useState('');
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [editingStartDate, setEditingStartDate] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sort stops by sort_order
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.sort_order - b.sort_order),
    [stops],
  );

  // Calculate stop dates based on trip start_date
  const stopDates = useMemo(
    () => calculateStopDates(sortedStops, selectedTrip?.start_date ?? null),
    [sortedStops, selectedTrip?.start_date],
  );

  // Today's date string for weather comparison
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch weather for visible stops with dates
  useEffect(() => {
    if (!selectedTrip?.start_date) return;

    sortedStops.forEach((stop) => {
      const dateInfo = stopDates.get(stop.id);
      if (!dateInfo) return;

      const daysOut = daysBetween(todayStr, dateInfo.arrivalDate);
      if (daysOut < 0 || daysOut > 14) return;

      const cacheKey = getWeatherCacheKey(stop.latitude, stop.longitude, dateInfo.arrivalDate);
      if (cacheKey in weatherCache) return;

      fetchWeather(stop.latitude, stop.longitude, dateInfo.arrivalDate);
    });
  }, [sortedStops, stopDates, selectedTrip?.start_date, todayStr, weatherCache, fetchWeather]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ---------- Trip name editing ----------
  const startEditName = useCallback(() => {
    if (!selectedTrip) return;
    setNameValue(selectedTrip.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [selectedTrip]);

  const saveName = useCallback(async () => {
    if (!selectedTrip || !nameValue.trim()) {
      setEditingName(false);
      return;
    }
    await onUpdateTrip(selectedTrip.id, { name: nameValue.trim() });
    setEditingName(false);
  }, [selectedTrip, nameValue, onUpdateTrip]);

  const cancelEditName = useCallback(() => {
    setEditingName(false);
  }, []);

  // ---------- Drag and drop ----------
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedStops.findIndex((s) => s.id === active.id);
      const newIndex = sortedStops.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedStops, oldIndex, newIndex);
      onReorderStops(reordered.map((s) => s.id));
    },
    [sortedStops, onReorderStops],
  );

  // ---------- Add stop ----------
  const filteredLocations = addStopSearch.trim()
    ? locations.filter((l) =>
        l.name.toLowerCase().includes(addStopSearch.toLowerCase()),
      )
    : locations.slice(0, 20);

  const handleAddStopFromLocation = useCallback(
    async (loc: Location) => {
      await onAddStop({
        location_id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setShowAddStop(false);
      setAddStopSearch('');
    },
    [onAddStop],
  );

  // ---------- Journal ----------
  const handleJournalOpen = useCallback(() => {
    setJournalValue(selectedTrip?.notes ?? '');
    setJournalOpen(true);
  }, [selectedTrip]);

  const handleJournalBlur = useCallback(async () => {
    if (!selectedTrip) return;
    if (journalValue !== (selectedTrip.notes ?? '')) {
      await onUpdateTrip(selectedTrip.id, { notes: journalValue });
    }
  }, [selectedTrip, journalValue, onUpdateTrip]);

  // ---------- Create new trip ----------
  const handleCreateTrip = useCallback(async () => {
    const trip = await onCreateTrip({
      name: 'New Trip',
      status: 'planning',
    });
    onSelectTrip(trip);
  }, [onCreateTrip, onSelectTrip]);

  // ---------- Delete trip ----------
  const handleDeleteTrip = useCallback(async () => {
    if (!selectedTrip) return;
    if (!window.confirm(`Delete "${selectedTrip.name}"? This cannot be undone.`)) return;
    await onDeleteTrip(selectedTrip.id);
  }, [selectedTrip, onDeleteTrip]);

  // ---------- Start date ----------
  const handleStartDateChange = useCallback(
    async (dateStr: string) => {
      if (!selectedTrip) return;
      await onUpdateTrip(selectedTrip.id, {
        start_date: dateStr || null,
      });
      setEditingStartDate(false);
    },
    [selectedTrip, onUpdateTrip],
  );

  // ---------- Stats ----------
  const totalNights = sortedStops.reduce((sum, s) => sum + (s.nights ?? 0), 0);
  const totalDistance = sortedStops.reduce(
    (sum, s) => sum + (s.drive_distance_miles ?? 0),
    0,
  );

  // ---------- Active drag item for overlay ----------
  const activeDragStop = useMemo(() => {
    if (activeDragId == null) return null;
    return sortedStops.find((s) => s.id === activeDragId) ?? null;
  }, [activeDragId, sortedStops]);

  const activeDragIndex = useMemo(() => {
    if (activeDragId == null) return -1;
    return sortedStops.findIndex((s) => s.id === activeDragId);
  }, [activeDragId, sortedStops]);

  // ---------- Render ----------
  return (
    <div className="w-80 h-full flex flex-col bg-dark-900 dark:bg-dark-900 border-r border-gray-700 dark:border-gray-700 light:bg-gray-50 light:border-gray-200 overflow-hidden [.light_&]:bg-gray-50 [.light_&]:border-gray-200">
      {/* ===== Tab Bar ===== */}
      <div className="flex-shrink-0 flex border-b border-gray-700/50 [.light_&]:border-gray-200">
        {(
          [
            { id: 'trip' as SidebarTab, label: 'Trip', icon: MapPin },
            { id: 'riding' as SidebarTab, label: 'Riding', icon: Bike },
            { id: 'filters' as SidebarTab, label: 'Filters', icon: Sliders },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-all ${
              activeTab === id
                ? 'text-orange-400 border-b-2 border-orange-400 bg-dark-800/50 [.light_&]:bg-orange-50/50'
                : 'text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ===== Riding Tab ===== */}
      {activeTab === 'riding' && (
        <div className="flex-1 overflow-hidden">
          <RidingPanel locations={locations} onFlyTo={onFlyTo} mapBounds={mapBounds} />
        </div>
      )}

      {/* ===== Filters Tab ===== */}
      {activeTab === 'filters' && (
        <div className="flex-1 overflow-y-auto">
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            routeGeoJSON={routeGeoJSON}
          />
        </div>
      )}

      {/* ===== Trip Tab ===== */}
      {activeTab === 'trip' && (
        <>
          {/* Trip Header */}
          <div className="flex-shrink-0 p-4 border-b border-gray-700/50 [.light_&]:border-gray-200">
            {/* Trip selector toggle */}
            <button
              onClick={() => setShowTripSelector(!showTripSelector)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 mb-2 transition-colors"
            >
              {showTripSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>Switch Trip</span>
            </button>

            {/* Trip selector dropdown */}
            {showTripSelector && (
              <div className="mb-3 bg-dark-800 [.light_&]:bg-white rounded-lg border border-gray-700 [.light_&]:border-gray-200 overflow-hidden">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => {
                      onSelectTrip(trip);
                      setShowTripSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-dark-700 [.light_&]:hover:bg-gray-100 ${
                      selectedTrip?.id === trip.id
                        ? 'text-orange-400 bg-dark-700/50 [.light_&]:bg-orange-50 [.light_&]:text-orange-600'
                        : 'text-gray-300 [.light_&]:text-gray-700'
                    }`}
                  >
                    {trip.name}
                  </button>
                ))}
              </div>
            )}

            {selectedTrip ? (
              <>
                {/* Trip name */}
                <div className="flex items-center gap-2 mb-2">
                  {editingName ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        ref={nameInputRef}
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName();
                          if (e.key === 'Escape') cancelEditName();
                        }}
                        className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-600 [.light_&]:border-gray-300 rounded px-2 py-1 text-lg font-semibold text-white [.light_&]:text-gray-900 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={saveName}
                        className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditName}
                        className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2
                        className="flex-1 text-lg font-semibold text-white [.light_&]:text-gray-900 cursor-pointer hover:text-orange-400 transition-colors truncate"
                        onClick={startEditName}
                        title="Click to edit"
                      >
                        {selectedTrip.name}
                      </h2>
                      <button
                        onClick={startEditName}
                        className="p-1 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
                        title="Edit name"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={handleDeleteTrip}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete trip"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>

                {/* Status badge + dates */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      STATUS_STYLES[selectedTrip.status]
                    } [.light_&]:hidden`}
                  >
                    {selectedTrip.status}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize hidden [.light_&]:inline ${
                      STATUS_STYLES_LIGHT[selectedTrip.status]
                    }`}
                  >
                    {selectedTrip.status}
                  </span>
                  {(selectedTrip.start_date || selectedTrip.end_date) && (
                    <span className="text-xs text-gray-500">
                      {formatDate(selectedTrip.start_date)}
                      {selectedTrip.start_date && selectedTrip.end_date && ' - '}
                      {formatDate(selectedTrip.end_date)}
                    </span>
                  )}
                </div>

                {/* Start date picker */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={12} className="text-orange-400" />
                  {editingStartDate ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        defaultValue={selectedTrip.start_date ?? ''}
                        onBlur={(e) => handleStartDateChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleStartDateChange((e.target as HTMLInputElement).value);
                          }
                          if (e.key === 'Escape') {
                            setEditingStartDate(false);
                          }
                        }}
                        autoFocus
                        className="bg-dark-800 [.light_&]:bg-white border border-gray-600 [.light_&]:border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <button
                        onClick={() => setEditingStartDate(false)}
                        className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingStartDate(true)}
                      className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                    >
                      {selectedTrip.start_date
                        ? `Start: ${formatDate(selectedTrip.start_date)}`
                        : 'Set start date...'}
                    </button>
                  )}
                </div>

                {/* Trip stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 [.light_&]:text-gray-500">
                  <div className="flex items-center gap-1" title="Total stops">
                    <MapPin size={12} className="text-orange-400" />
                    <span>{sortedStops.length} stops</span>
                  </div>
                  <div className="flex items-center gap-1" title="Total nights">
                    <Clock size={12} className="text-orange-400" />
                    <span>{totalNights} nights</span>
                  </div>
                  <div className="flex items-center gap-1" title="Total distance">
                    <Route size={12} className="text-orange-400" />
                    <span>{formatDistance(totalDistance) || '0 mi'}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No trip selected</p>
            )}

            {/* Create new trip */}
            <button
              onClick={handleCreateTrip}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                bg-orange-500/10 text-orange-400 border border-orange-500/20
                hover:bg-orange-500/20 hover:border-orange-500/30 transition-all
                [.light_&]:bg-orange-50 [.light_&]:text-orange-600 [.light_&]:border-orange-200 [.light_&]:hover:bg-orange-100"
            >
              <Plus size={16} />
              Create New Trip
            </button>
          </div>

          {/* ===== Stops List ===== */}
          <div className="flex-1 overflow-y-auto">
            {selectedTrip && sortedStops.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">
                <MapPin size={32} className="mx-auto mb-2 opacity-40" />
                <p>No stops yet.</p>
                <p className="text-xs mt-1">Add your first stop below.</p>
              </div>
            )}

            {selectedTrip && sortedStops.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={sortedStops.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="py-1">
                    {sortedStops.map((stop, index) => {
                      const dateInfo = stopDates.get(stop.id) ?? null;
                      let weatherData: WeatherData | null = null;
                      let isForecastTooFar = false;

                      if (dateInfo) {
                        const daysOut = daysBetween(todayStr, dateInfo.arrivalDate);
                        if (daysOut >= 0 && daysOut <= 14) {
                          const cacheKey = getWeatherCacheKey(
                            stop.latitude,
                            stop.longitude,
                            dateInfo.arrivalDate,
                          );
                          weatherData = weatherCache[cacheKey] ?? null;
                        } else if (daysOut > 14) {
                          isForecastTooFar = true;
                        }
                      }

                      return (
                        <SortableStopCard
                          key={stop.id}
                          stop={stop}
                          index={index}
                          isExpanded={expandedStopId === stop.id}
                          onToggleExpand={() =>
                            setExpandedStopId(
                              expandedStopId === stop.id ? null : stop.id,
                            )
                          }
                          onFlyTo={onFlyTo}
                          onDeleteStop={onDeleteStop}
                          onUpdateStop={onUpdateStop}
                          dateInfo={dateInfo}
                          weatherData={weatherData}
                          isForecastTooFar={isForecastTooFar}
                          driveTimeMins={stop.drive_time_mins}
                          driveDistanceMiles={stop.drive_distance_miles}
                          showDriveConnector={
                            index > 0 &&
                            !!(stop.drive_time_mins || stop.drive_distance_miles)
                          }
                        />
                      );
                    })}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeDragStop && (
                    <OverlayStopCard stop={activeDragStop} index={activeDragIndex} />
                  )}
                </DragOverlay>
              </DndContext>
            )}

            {/* Add Stop button */}
            {selectedTrip && (
              <div className="p-3">
                {showAddStop ? (
                  <div className="bg-dark-800 [.light_&]:bg-white rounded-lg border border-gray-700 [.light_&]:border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider">
                        Add a Stop
                      </span>
                      <button
                        onClick={() => {
                          setShowAddStop(false);
                          setAddStopSearch('');
                        }}
                        className="text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={addStopSearch}
                      onChange={(e) => setAddStopSearch(e.target.value)}
                      placeholder="Search locations..."
                      autoFocus
                      className="w-full bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1.5 text-sm text-gray-200 [.light_&]:text-gray-800 placeholder-gray-600 [.light_&]:placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredLocations.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          No locations found.
                        </p>
                      )}
                      {filteredLocations.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => handleAddStopFromLocation(loc)}
                          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm
                            text-gray-300 [.light_&]:text-gray-700
                            hover:bg-dark-700 [.light_&]:hover:bg-gray-100 transition-colors"
                        >
                          <MapPin size={12} className="text-orange-400 flex-shrink-0" />
                          <span className="truncate">{loc.name}</span>
                          <span className="text-[10px] text-gray-500 capitalize ml-auto flex-shrink-0">
                            {loc.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddStop(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm
                      border border-dashed border-gray-700 [.light_&]:border-gray-300
                      text-gray-500 hover:text-orange-400 hover:border-orange-500/40
                      [.light_&]:text-gray-400 [.light_&]:hover:text-orange-500 [.light_&]:hover:border-orange-300
                      transition-all"
                  >
                    <Plus size={16} />
                    Add Stop
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ===== Trip Journal ===== */}
          {selectedTrip && (
            <div className="flex-shrink-0 border-t border-gray-700/50 [.light_&]:border-gray-200">
              <button
                onClick={() => {
                  if (!journalOpen) handleJournalOpen();
                  else setJournalOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 [.light_&]:text-gray-600 hover:text-gray-200 [.light_&]:hover:text-gray-800 transition-colors"
              >
                <span className="font-medium">Trip Journal</span>
                {journalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>

              {journalOpen && (
                <div className="px-4 pb-4">
                  <textarea
                    value={journalValue}
                    onChange={(e) => setJournalValue(e.target.value)}
                    onBlur={handleJournalBlur}
                    placeholder="Write your trip notes, memories, and journal entries here..."
                    rows={6}
                    className="w-full bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Auto-saves on blur</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
