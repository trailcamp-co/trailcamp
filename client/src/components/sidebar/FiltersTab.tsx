import {
  Filter,
  Mountain,
  Route,
  Sliders,
  Thermometer,
} from 'lucide-react';
import type { LocationCategory, CampsiteSubType, Filters } from '../../types';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CAMPSITE_SUBTYPE_ICONS,
  CAMPSITE_SUBTYPE_COLORS,
  CAMPSITE_SUBTYPE_LABELS,
  DEFAULT_FILTERS,
  DIFFICULTY_COLORS,
} from '../../types';

const NON_CAMPSITE_CATEGORIES: LocationCategory[] = [
  'riding', 'hiking', 'mtb', 'fishing', 'boating', 'kayaking',
  'hunting', 'horseback', 'climbing', 'swimming', 'offroad',
  'water', 'dump', 'scenic',
];

const ALL_CAMPSITE_SUBTYPES: CampsiteSubType[] = ['campground', 'boondocking', 'parking'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'favorites' as const, label: '\u2764\uFE0F Favs' },
  { value: 'visited' as const, label: '\u2705 Visited' },
  { value: 'highly_rated' as const, label: '\u2B50 Top Rated' },
];

interface FiltersTabProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  routeGeoJSON: GeoJSON.GeoJsonObject | null;
  filterMode: 'all' | 'visited' | 'highly_rated' | 'favorites';
  onFilterMode: (mode: 'all' | 'visited' | 'highly_rated' | 'favorites') => void;
}

export default function FiltersTab({ filters, setFilters, routeGeoJSON, filterMode, onFilterMode }: FiltersTabProps) {
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

  const toggleCampsiteSubType = (st: CampsiteSubType) => {
    setFilters((prev) => {
      const next = new Set(prev.campsiteSubTypes);
      if (next.has(st)) {
        next.delete(st);
      } else {
        next.add(st);
      }
      // Keep 'campsite' category in sync — on if any sub-type is on
      const nextCategories = new Set(prev.categories);
      if (next.size > 0) {
        nextCategories.add('campsite');
      } else {
        nextCategories.delete('campsite');
      }
      return { ...prev, campsiteSubTypes: next, categories: nextCategories };
    });
  };

  const toggleBoolean = (key: 'waterNearby' | 'dumpNearby') => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Count active filters
  const activeCount = [
    filterMode !== 'all',
    filters.difficulty !== null,
    filters.hideOutOfSeason,
    filters.nearRoute,
    filters.waterNearby,
    filters.dumpNearby,
    filters.categories.size < NON_CAMPSITE_CATEGORIES.length + 1, // +1 for 'campsite'
    filters.campsiteSubTypes.size < ALL_CAMPSITE_SUBTYPES.length,
  ].filter(Boolean).length;

  return (
    <div className="p-4 space-y-4">
      {/* Header with active filter count */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-orange-400 font-medium">
            {activeCount} filter{activeCount > 1 ? 's' : ''} active
          </span>
          <button
            onClick={() => {
              setFilters({
                ...DEFAULT_FILTERS,
                categories: new Set(DEFAULT_FILTERS.categories),
                campsiteSubTypes: new Set(DEFAULT_FILTERS.campsiteSubTypes),
              });
              onFilterMode('all');
            }}
            className="text-[10px] px-2 py-0.5 rounded-md bg-dark-800 text-gray-500 hover:text-orange-400 border border-dark-700/50 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Mode Buttons */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilterMode(value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                filterMode === value
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-dark-800 text-gray-400 border border-dark-700/50 hover:text-gray-300 hover:border-dark-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          ⚡ Quick Presets
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '🏕️ Free camping', fn: () => {
              setFilters(prev => ({ ...prev, categories: new Set(['campsite']), campsiteSubTypes: new Set(['boondocking']) }));
            }},
            { label: '🏍️ Single track', fn: () => {
              setFilters(prev => ({ ...prev, categories: new Set(['riding']), difficulty: null }));
            }},

            { label: '🌿 In season', fn: () => {
              setFilters(prev => ({ ...prev, hideOutOfSeason: true, seasonMonth: new Date().getMonth() + 1 }));
            }},
            { label: '🏔️ Hard rides', fn: () => {
              setFilters(prev => ({ ...prev, categories: new Set(['riding']), difficulty: 'Hard' }));
            }},
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn}
              className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-dark-800 text-gray-400 border border-dark-700/50 hover:border-orange-500/30 hover:text-orange-400 hover:bg-orange-500/5 transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dark-700/50" />

      {/* Category filters */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Filter size={12} className="text-orange-400" />
          Categories
        </h4>
        <div className="space-y-1.5">
          {/* Camp sub-types shown flat (matching Layers panel) */}
          {ALL_CAMPSITE_SUBTYPES.map((st) => {
            const isOn = filters.campsiteSubTypes.has(st);
            return (
              <div
                key={st}
                className="flex items-center justify-between rounded-lg bg-dark-800 p-2.5 cursor-pointer hover:bg-dark-700 transition-colors"
                onClick={() => toggleCampsiteSubType(st)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CAMPSITE_SUBTYPE_ICONS[st]}</span>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CAMPSITE_SUBTYPE_COLORS[st] }}
                  />
                  <span className="text-sm text-gray-100">
                    {CAMPSITE_SUBTYPE_LABELS[st]}
                  </span>
                </div>
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                    isOn ? 'bg-orange-500' : 'bg-dark-700'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    isOn ? 'translate-x-4' : ''
                  }`} />
                </div>
              </div>
            );
          })}

          {/* Non-campsite categories */}
          {NON_CAMPSITE_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between rounded-lg bg-dark-800 p-2.5 cursor-pointer hover:bg-dark-700 transition-colors"
              onClick={() => toggleCategory(cat)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: CATEGORY_COLORS[cat] }}>
                  {CATEGORY_ICONS[cat]}
                </span>
                <span className="text-sm text-gray-100">
                  {CATEGORY_LABELS[cat]}
                </span>
              </div>
              <div
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                  filters.categories.has(cat) ? 'bg-orange-500' : 'bg-dark-700'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  filters.categories.has(cat) ? 'translate-x-4' : ''
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dark-700/50" />

      {/* Amenity toggles */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sliders size={12} className="text-orange-400" />
          Amenities
        </h4>
        <div className="space-y-1.5">
          {[
            { key: 'waterNearby' as const, label: 'Water Nearby', icon: '\uD83D\uDCA7' },
            { key: 'dumpNearby' as const, label: 'Dump Nearby', icon: '\uD83D\uDEBD' },
          ].map(({ key, label, icon }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg bg-dark-800 p-2.5 cursor-pointer hover:bg-dark-700 transition-colors"
              onClick={() => toggleBoolean(key)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-sm text-gray-100">{label}</span>
              </div>
              <div
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                  filters[key] ? 'bg-orange-500' : 'bg-dark-700'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  filters[key] ? 'translate-x-4' : ''
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dark-700/50" />

      {/* Difficulty chips */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Mountain size={12} className="text-orange-400" />
          Difficulty
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {['Easy', 'Moderate', 'Hard', 'Expert'].map((diff) => {
            const isActive = filters.difficulty === diff;
            const color = DIFFICULTY_COLORS[diff];
            return (
              <button
                key={diff}
                onClick={() => setFilters(prev => ({ ...prev, difficulty: isActive ? null : diff }))}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${isActive ? '' : 'opacity-50 hover:opacity-80'}`}
                style={{ backgroundColor: color + (isActive ? '33' : '15'), color }}
              >
                {diff}
              </button>
            );
          })}
        </div>
      </div>



      {/* Divider */}
      <div className="border-t border-dark-700/50" />

      {/* Seasonal filter */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Thermometer size={12} className="text-orange-400" />
          Season
        </h4>
        <div className="space-y-2 px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                filters.hideOutOfSeason ? 'bg-orange-500' : 'bg-dark-700'
              }`}
              onClick={() =>
                setFilters((prev) => ({ ...prev, hideOutOfSeason: !prev.hideOutOfSeason }))
              }
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  filters.hideOutOfSeason ? 'translate-x-4' : ''
                }`}
              />
            </div>
            <span className="text-sm text-gray-100">
              Hide out-of-season
            </span>
          </label>
          {filters.hideOutOfSeason && (
            <select
              value={filters.seasonMonth ?? new Date().getMonth() + 1}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, seasonMonth: Number(e.target.value) }))
              }
              className="w-full bg-dark-800 border border-dark-700/50 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Near Route */}
      {routeGeoJSON && (
        <>
          {/* Divider */}
          <div className="border-t border-dark-700/50" />

          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Route size={12} className="text-orange-400" />
              Near Route
            </h4>
            <div className="space-y-2 px-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    filters.nearRoute ? 'bg-orange-500' : 'bg-dark-700'
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
                <span className="text-sm text-gray-100">
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
        </>
      )}

      {/* Divider */}
      <div className="border-t border-dark-700/50" />

      {/* Reset filters */}
      <button
        onClick={() => {
          setFilters({
            ...DEFAULT_FILTERS,
            categories: new Set(DEFAULT_FILTERS.categories),
            campsiteSubTypes: new Set(DEFAULT_FILTERS.campsiteSubTypes),
          });
          onFilterMode('all');
        }}
        className="w-full text-center text-xs text-gray-500 hover:text-orange-400 py-2.5 rounded-lg bg-dark-800/50 hover:bg-dark-800 border border-dark-700/30 transition-all"
      >
        Reset All Filters
      </button>
    </div>
  );
}
