import {
  Filter,
  Mountain,
  Star,
  Route,
  Sliders,
} from 'lucide-react';
import type { LocationCategory, Filters } from '../../types';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DEFAULT_FILTERS,
} from '../../types';

const ALL_CATEGORIES: LocationCategory[] = [
  'campsite', 'riding', 'water', 'dump', 'gas', 'grocery', 'scenic', 'laundromat',
];

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
