import {
  Filter,
  Mountain,
  Star,
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
} from '../../types';

const ALL_CATEGORIES: LocationCategory[] = [
  'campsite', 'riding', 'water', 'dump', 'gas', 'grocery', 'scenic', 'laundromat',
];

const ALL_CAMPSITE_SUBTYPES: CampsiteSubType[] = ['boondocking', 'campground', 'parking', 'other'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface FiltersTabProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  routeGeoJSON: GeoJSON.GeoJsonObject | null;
}

export default function FiltersTab({ filters, setFilters, routeGeoJSON }: FiltersTabProps) {
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
      return { ...prev, campsiteSubTypes: next };
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
            <div key={cat}>
              <label
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

              {/* Campsite sub-types */}
              {cat === 'campsite' && filters.categories.has('campsite') && (
                <div className="ml-6 space-y-0.5 mt-0.5">
                  {ALL_CAMPSITE_SUBTYPES.map((st) => (
                    <label
                      key={st}
                      className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-dark-700 [.light_&]:hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.campsiteSubTypes.has(st)}
                        onChange={() => toggleCampsiteSubType(st)}
                        className="rounded border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 bg-dark-900 [.light_&]:bg-white"
                      />
                      <span className="text-xs">{CAMPSITE_SUBTYPE_ICONS[st]}</span>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CAMPSITE_SUBTYPE_COLORS[st] }}
                      />
                      <span className="text-xs text-gray-400 [.light_&]:text-gray-600">
                        {CAMPSITE_SUBTYPE_LABELS[st]}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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

      {/* Seasonal filter */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Thermometer size={12} className="text-orange-400" />
          Season
        </h4>
        <div className="space-y-2 px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                filters.hideOutOfSeason ? 'bg-orange-500' : 'bg-gray-700 [.light_&]:bg-gray-300'
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
            <span className="text-sm text-gray-300 [.light_&]:text-gray-700">
              Hide out-of-season
            </span>
          </label>
          {filters.hideOutOfSeason && (
            <select
              value={filters.seasonMonth ?? new Date().getMonth() + 1}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, seasonMonth: Number(e.target.value) }))
              }
              className="w-full bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
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
        onClick={() => setFilters({
          ...DEFAULT_FILTERS,
          categories: new Set(DEFAULT_FILTERS.categories),
          campsiteSubTypes: new Set(DEFAULT_FILTERS.campsiteSubTypes),
        })}
        className="w-full text-center text-xs text-gray-500 hover:text-orange-400 py-2 transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );
}
