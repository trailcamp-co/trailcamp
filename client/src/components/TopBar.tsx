import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Map,
  BarChart3,
  PanelLeftOpen,
  Filter,
  ChevronDown,
  MapPin,
  X,
} from 'lucide-react';
import type { Trip, Location, MapStyle, Filters } from '../types';
import { MAP_STYLES, CATEGORY_ICONS, CATEGORY_COLORS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';

interface TopBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  mapStyle: { id: string; name: string; url: string };
  onChangeMapStyle: (style: MapStyle) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Location[] | null;
  onSelectSearchResult: (location: Location) => void;
  selectedTrip: Trip | null;
  trips: Trip[];
  onSelectTrip: (trip: Trip | null) => void;
  onToggleStats: () => void;
  onToggleSidebar: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filterMode: 'all' | 'visited' | 'want_to_visit' | 'highly_rated';
  onFilterMode: (mode: 'all' | 'visited' | 'want_to_visit' | 'highly_rated') => void;
}

const FILTER_OPTIONS: { value: TopBarProps['filterMode']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'visited', label: 'Visited' },
  { value: 'want_to_visit', label: 'Want to Visit' },
  { value: 'highly_rated', label: 'Highly Rated' },
];

export default function TopBar({
  darkMode,
  onToggleDarkMode,
  mapStyle,
  onChangeMapStyle,
  searchQuery,
  onSearch,
  searchResults,
  onSelectSearchResult,
  selectedTrip,
  trips,
  onSelectTrip,
  onToggleStats,
  onToggleSidebar,
  filters,
  setFilters,
  filterMode,
  onFilterMode,
}: TopBarProps) {
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const tripDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tripDropdownRef.current && !tripDropdownRef.current.contains(e.target as Node)) {
        setTripDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSearchDropdown = searchFocused && searchResults && searchResults.length > 0;

  return (
    <div
      className={`h-14 flex items-center px-3 gap-2 border-b flex-shrink-0 z-30 transition-colors duration-200 ${
        darkMode
          ? 'bg-dark-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* ---- Left: Sidebar toggle + Logo ---- */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg transition-colors duration-150 ${
            darkMode
              ? 'hover:bg-dark-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title="Toggle sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>

        <div className="flex items-center gap-1.5 select-none">
          <span className="text-lg">⛺</span>
          <span
            className="font-bold text-base tracking-tight"
            style={{ color: '#f97316' }}
          >
            TrailCamp
          </span>
        </div>
      </div>

      {/* ---- Divider ---- */}
      <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

      {/* ---- Trip Selector ---- */}
      <div className="relative flex-shrink-0" ref={tripDropdownRef}>
        <button
          onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            darkMode
              ? 'bg-dark-700 hover:bg-dark-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Map size={14} className="opacity-60" />
          <span className="max-w-[140px] truncate">
            {selectedTrip?.name ?? 'Select Trip'}
          </span>
          <ChevronDown
            size={14}
            className={`opacity-50 transition-transform duration-150 ${
              tripDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {tripDropdownOpen && (
          <div
            className={`absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl border overflow-hidden z-50 ${
              darkMode
                ? 'bg-dark-700 border-gray-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Trips
            </div>
            {/* No trip / deselect option */}
            <button
              onClick={() => {
                onSelectTrip(null);
                setTripDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors duration-100 flex items-center gap-2 ${
                !selectedTrip
                  ? darkMode
                    ? 'bg-gray-500/15 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                  : darkMode
                    ? 'text-gray-400 hover:bg-dark-600'
                    : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <X size={13} className="opacity-40" />
              <span>No Trip</span>
            </button>
            <div className={`border-t my-1 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} />
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  onSelectTrip(trip);
                  setTripDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-100 flex items-center gap-2 ${
                  selectedTrip?.id === trip.id
                    ? darkMode
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'bg-orange-50 text-orange-600'
                    : darkMode
                      ? 'text-gray-300 hover:bg-dark-600'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MapPin
                  size={13}
                  className={selectedTrip?.id === trip.id ? 'text-orange-400' : 'opacity-40'}
                />
                <span className="truncate">{trip.name}</span>
                {trip.status && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      trip.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : trip.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {trip.status}
                  </span>
                )}
              </button>
            ))}
            {trips.length === 0 && (
              <div className={`px-3 py-4 text-sm text-center ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No trips yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Divider ---- */}
      <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

      {/* ---- Map Style Buttons ---- */}
      <div
        className={`flex items-center rounded-lg p-0.5 flex-shrink-0 ${
          darkMode ? 'bg-dark-900/50' : 'bg-gray-100'
        }`}
      >
        {MAP_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onChangeMapStyle(style)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
              mapStyle.id === style.id
                ? darkMode
                  ? 'bg-orange-500/20 text-orange-400 shadow-sm'
                  : 'bg-white text-orange-600 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>

      {/* ---- Divider ---- */}
      <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

      {/* ---- Filter Mode Buttons ---- */}
      <div
        className={`flex items-center rounded-lg p-0.5 flex-shrink-0 ${
          darkMode ? 'bg-dark-900/50' : 'bg-gray-100'
        }`}
      >
        <Filter
          size={13}
          className={`mx-1.5 flex-shrink-0 ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterMode(opt.value)}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all duration-150 whitespace-nowrap ${
              filterMode === opt.value
                ? darkMode
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-white text-orange-600 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ---- Spacer ---- */}
      <div className="flex-1" />

      {/* ---- Search Bar with Location Count ---- */}
      <div className="relative flex-shrink-0 w-64" ref={searchRef}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors duration-150 ${
            searchFocused
              ? darkMode
                ? 'border-orange-500/50 bg-dark-700'
                : 'border-orange-400 bg-white'
              : darkMode
                ? 'border-gray-700 bg-dark-700/50'
                : 'border-gray-200 bg-gray-50'
          }`}
        >
          <Search
            size={15}
            className={`flex-shrink-0 ${
              searchFocused
                ? 'text-orange-400'
                : darkMode
                  ? 'text-gray-500'
                  : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search locations..."
            className={`w-full bg-transparent text-sm outline-none placeholder-gray-500 ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}
          />
          {searchResults && searchResults.length > 0 && searchQuery.length > 0 && (
            <span
              className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                darkMode
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'bg-orange-50 text-orange-600'
              }`}
            >
              {searchResults.length}
            </span>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div
            className={`absolute top-full left-0 right-0 mt-1.5 rounded-lg shadow-xl border overflow-hidden z-50 max-h-80 overflow-y-auto ${
              darkMode
                ? 'bg-dark-700 border-gray-600'
                : 'bg-white border-gray-200'
            }`}
          >
            {searchResults.map((location) => {
              const diffColor = location.difficulty ? DIFFICULTY_COLORS[location.difficulty] : null;
              const trailTypes = location.category === 'riding' ? parseTrailTypes(location.trail_types) : [];
              return (
                <button
                  key={location.id}
                  onClick={() => {
                    onSelectSearchResult(location);
                    setSearchFocused(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors duration-100 ${
                    darkMode
                      ? 'hover:bg-dark-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="text-xs flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[location.category]}20`,
                    }}
                  >
                    {CATEGORY_ICONS[location.category]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      {location.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {location.sub_type && (
                        <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {location.sub_type}
                        </span>
                      )}
                      {diffColor && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: diffColor + '22', color: diffColor }}
                        >
                          {location.difficulty}
                        </span>
                      )}
                      {trailTypes.slice(0, 2).map((tt) => {
                        const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
                        return (
                          <span
                            key={tt}
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {tt}
                          </span>
                        );
                      })}
                      {trailTypes.length > 2 && (
                        <span className={`text-[9px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          +{trailTypes.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[location.category]}20`,
                      color: CATEGORY_COLORS[location.category],
                    }}
                  >
                    {location.category}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Divider ---- */}
      <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

      {/* ---- Stats Button ---- */}
      <button
        onClick={onToggleStats}
        className={`p-2 rounded-lg transition-colors duration-150 ${
          darkMode
            ? 'hover:bg-dark-700 text-gray-400 hover:text-orange-400'
            : 'hover:bg-gray-100 text-gray-500 hover:text-orange-500'
        }`}
        title="Trip Statistics"
      >
        <BarChart3 size={18} />
      </button>

      {/* ---- Dark/Light Mode Toggle ---- */}
      <button
        onClick={onToggleDarkMode}
        className={`p-2 rounded-lg transition-colors duration-150 ${
          darkMode
            ? 'hover:bg-dark-700 text-gray-400 hover:text-yellow-400'
            : 'hover:bg-gray-100 text-gray-500 hover:text-yellow-500'
        }`}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
