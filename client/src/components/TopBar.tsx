import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  BarChart3,
  PanelLeftOpen,
  ChevronDown,
  MapPin,
  X,
  Clock,
} from 'lucide-react';
import type { Trip, Location } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';

interface TopBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Location[] | null;
  onSelectSearchResult: (location: Location) => void;
  selectedTrip: Trip | null;
  trips: Trip[];
  onSelectTrip: (trip: Trip | null) => void;
  onToggleStats: () => void;
  onToggleSidebar: () => void;
  locationCount: number;
}

export default function TopBar({
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearch,
  searchResults,
  onSelectSearchResult,
  selectedTrip,
  trips,
  onSelectTrip,
  onToggleStats,
  onToggleSidebar,
  locationCount,
}: TopBarProps) {
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('trailcamp_recent_searches') || '[]'); } catch { return []; }
  });
  const tripDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const addRecentSearch = (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setRecentSearches(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, 5);
      localStorage.setItem('trailcamp_recent_searches', JSON.stringify(next));
      return next;
    });
  };

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

  // Cmd+K keyboard shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showSearchDropdown = searchFocused && searchQuery.length > 0 && searchResults !== null;
  const showRecentDropdown = searchFocused && searchQuery.length === 0 && recentSearches.length > 0;

  // Group search results by category
  const grouped = (searchResults || []).reduce((acc, loc) => {
    if (!acc[loc.category]) acc[loc.category] = [];
    acc[loc.category].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  // Extract state from description (e.g. "Located in Colorado" or "State: CA")
  const extractState = (description: string | null): string | null => {
    if (!description) return null;
    const match = description.match(/\b([A-Z]{2})\b/) || description.match(/(?:in|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[1] : null;
  };

  return (
    <div
      className="h-[52px] flex items-center px-3 gap-2 border-b flex-shrink-0 z-30 transition-colors duration-200 bg-dark-900 border-dark-700/50 [.light_&]:bg-white [.light_&]:border-gray-200"
    >
      {/* ---- Left: Sidebar toggle ---- */}
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg transition-colors duration-150 hover:bg-dark-700 text-gray-400 hover:text-gray-200 [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-500 [.light_&]:hover:text-gray-700"
        title="Toggle sidebar"
      >
        <PanelLeftOpen size={18} />
      </button>

      {/* ---- Logo ---- */}
      <div className="flex items-center gap-1.5 select-none flex-shrink-0">
        <span className="text-lg">&#9978;</span>
        <span className="font-bold text-base tracking-tight text-orange-500 hidden sm:inline">
          TrailCamp
        </span>
      </div>

      {/* ---- Divider ---- */}
      <div className="w-px h-5 mx-1 bg-dark-700/50 [.light_&]:bg-gray-200 hidden sm:block" />

      {/* ---- Trip Selector ---- */}
      <div className="relative flex-shrink-0" ref={tripDropdownRef}>
        <button
          onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 bg-dark-700 hover:bg-dark-600 text-gray-200 [.light_&]:bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-700"
        >
          <MapPin size={14} className="opacity-60" />
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
          <div className="absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl overflow-hidden z-50 glass animate-slide-down [.light_&]:bg-white [.light_&]:border [.light_&]:border-gray-200">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                  ? 'bg-gray-500/15 text-gray-300 [.light_&]:bg-gray-100 [.light_&]:text-gray-600'
                  : 'text-gray-400 hover:bg-dark-600 [.light_&]:text-gray-500 [.light_&]:hover:bg-gray-50'
              }`}
            >
              <X size={13} className="opacity-40" />
              <span>No Trip</span>
            </button>
            <div className="border-t my-1 border-dark-700/50 [.light_&]:border-gray-200" />
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  onSelectTrip(trip);
                  setTripDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-100 flex items-center gap-2 ${
                  selectedTrip?.id === trip.id
                    ? 'bg-orange-500/15 text-orange-400 [.light_&]:bg-orange-50 [.light_&]:text-orange-600'
                    : 'text-gray-300 hover:bg-dark-600 [.light_&]:text-gray-700 [.light_&]:hover:bg-gray-50'
                }`}
              >
                <MapPin
                  size={13}
                  className={selectedTrip?.id === trip.id ? 'text-orange-400' : 'opacity-40'}
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{trip.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {trip.start_date && (
                      <span className="text-[10px] text-gray-500 [.light_&]:text-gray-400">{new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    )}
                    {trip.stop_count != null && (
                      <span className="text-[10px] text-gray-500 [.light_&]:text-gray-400">{trip.stop_count} stops</span>
                    )}
                    {trip.total_nights != null && trip.total_nights > 0 && (
                      <span className="text-[10px] text-gray-500 [.light_&]:text-gray-400">{trip.total_nights}n</span>
                    )}
                  </div>
                </div>
                {trip.status && (
                  <span
                    className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
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
              <div className="px-3 py-4 text-sm text-center text-gray-500">
                No trips yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Search Bar (centered, flex-1) ---- */}
      <div className="relative flex-1 max-w-xl mx-auto" ref={searchRef}>
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-colors duration-150 ${
            searchFocused
              ? 'border-orange-500/50 bg-dark-700 [.light_&]:border-orange-400 [.light_&]:bg-white'
              : 'border-dark-700/50 bg-dark-700/50 [.light_&]:border-gray-200 [.light_&]:bg-gray-50'
          }`}
        >
          <Search
            size={15}
            className={`flex-shrink-0 ${
              searchFocused
                ? 'text-orange-400'
                : 'text-gray-500 [.light_&]:text-gray-400'
            }`}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSearchFocused(false); }}
            placeholder={`Search ${locationCount.toLocaleString()} locations...`}
            className="w-full bg-transparent text-sm outline-none text-gray-100 placeholder-gray-500 [.light_&]:text-gray-800 [.light_&]:placeholder-gray-400"
          />
          {!searchFocused && !searchQuery && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-dark-700/80 border border-dark-700/50 [.light_&]:bg-gray-100 [.light_&]:border-gray-200 [.light_&]:text-gray-400">
              <span className="text-[11px]">&#8984;</span>K
            </kbd>
          )}
          {searchResults && searchResults.length > 0 && searchQuery.length > 0 && (
            <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 [.light_&]:bg-orange-50 [.light_&]:text-orange-600">
              {searchResults.length}
            </span>
          )}
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="flex-shrink-0 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto glass animate-slide-down [.light_&]:bg-white [.light_&]:border [.light_&]:border-gray-200">
            {searchResults && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400 [.light_&]:text-gray-500 mb-1">No locations found</p>
                <p className="text-xs text-gray-600 [.light_&]:text-gray-400">Try a different search term or check your filters</p>
              </div>
            )}
            {Object.entries(grouped).map(([category, locations]) => (
              <div key={category}>
                {/* Category section header */}
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-dark-800/50 border-b border-dark-700/30 flex items-center gap-1.5 [.light_&]:bg-gray-50 [.light_&]:border-gray-100 [.light_&]:text-gray-400">
                  <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                  <span>{category}</span>
                  <span className="ml-auto text-gray-600 [.light_&]:text-gray-300">{locations.length}</span>
                </div>
                {locations.map((location) => {
                  const diffColor = location.difficulty ? DIFFICULTY_COLORS[location.difficulty] : null;
                  const trailTypes = location.category === 'riding' ? parseTrailTypes(location.trail_types) : [];
                  const stateInfo = extractState(location.description);
                  return (
                    <button
                      key={location.id}
                      onClick={() => {
                        addRecentSearch(searchQuery);
                        onSelectSearchResult(location);
                        setSearchFocused(false);
                      }}
                      className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors duration-100 hover:bg-dark-600 [.light_&]:hover:bg-gray-50"
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
                        <div className="text-sm font-medium truncate text-gray-100 [.light_&]:text-gray-800">
                          {location.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {location.sub_type && (
                            <span className="text-[10px] text-gray-500 [.light_&]:text-gray-400">
                              {location.sub_type}
                            </span>
                          )}
                          {stateInfo && (
                            <span className="text-[10px] text-gray-400 [.light_&]:text-gray-500">
                              {stateInfo}
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
                          {location.distance_miles != null && (
                            <span className="text-[9px] text-gray-500">{Math.round(location.distance_miles)} mi</span>
                          )}
                          {location.scenery_rating != null && location.scenery_rating >= 8 && (
                            <span className="text-[9px]" title={`Scenery: ${location.scenery_rating}/10`}>🏔️</span>
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
                            <span className="text-[9px] text-gray-600 [.light_&]:text-gray-400">
                              +{trailTypes.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        {showRecentDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl overflow-hidden z-50 glass animate-slide-down [.light_&]:bg-white [.light_&]:border [.light_&]:border-gray-200">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 [.light_&]:text-gray-400">Recent Searches</div>
            {recentSearches.map((q) => (
              <button
                key={q}
                onClick={() => { onSearch(q); setSearchFocused(true); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 [.light_&]:text-gray-600 hover:bg-dark-600 [.light_&]:hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Clock size={12} className="text-gray-500 flex-shrink-0" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---- Divider ---- */}
      <div className="w-px h-5 mx-1 bg-dark-700/50 [.light_&]:bg-gray-200" />

      {/* ---- Stats Button ---- */}
      <button
        onClick={onToggleStats}
        className="p-2 rounded-lg transition-colors duration-150 hover:bg-dark-700 text-gray-400 hover:text-orange-400 [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-500 [.light_&]:hover:text-orange-500 hidden sm:block"
        title="Trip Statistics"
      >
        <BarChart3 size={18} />
      </button>

      {/* ---- Dark/Light Mode Toggle ---- */}
      <button
        onClick={onToggleDarkMode}
        className="p-2 rounded-lg transition-colors duration-150 hover:bg-dark-700 text-gray-400 hover:text-yellow-400 [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-500 [.light_&]:hover:text-yellow-500 hidden sm:block"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
