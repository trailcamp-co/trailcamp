import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, MapPin, Loader2 } from 'lucide-react';
import type { Location } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';

interface MobileSearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Location[] | null;
  onSelectResult: (location: Location) => void;
  locationCount: number;
  onExpandChange?: (expanded: boolean) => void;
}

export default function MobileSearchBar({
  searchQuery,
  onSearch,
  searchResults,
  onSelectResult,
  locationCount,
  onExpandChange,
}: MobileSearchBarProps) {
  const [expanded, setExpandedRaw] = useState(false);
  const setExpanded = useCallback((val: boolean) => {
    setExpandedRaw(val);
    onExpandChange?.(val);
  }, [onExpandChange]);
  const [recentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('trailcamp_recent_searches') || '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearMeLoading, setNearMeLoading] = useState(false);

  const handleNearMe = useCallback(async () => {
    if (!navigator.geolocation) return;
    setNearMeLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: false });
      });
      const { latitude: lat, longitude: lng } = pos.coords;
      // ~25mi bounding box
      const offset = 0.36; // ~25mi in degrees
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const params = new URLSearchParams({
        sw_lat: String(lat - offset),
        sw_lng: String(lng - offset),
        ne_lat: String(lat + offset),
        ne_lng: String(lng + offset),
        limit: '30',
      });
      const res = await fetch(`${API_BASE}/locations/slim?${params}`);
      if (res.ok) {
        const data: Location[] = await res.json();
        // Sort by distance from user
        const sorted = data.map(loc => {
          const dLat = (loc.latitude - lat) * 69;
          const dLng = (loc.longitude - lng) * 69 * Math.cos(lat * Math.PI / 180);
          return { ...loc, _dist: Math.sqrt(dLat * dLat + dLng * dLng) };
        }).sort((a, b) => a._dist - b._dist);
        onSearch('__nearme__');
        // Hack: override search results via parent — instead, select first result to fly there
        // Better: show as results list
        if (sorted.length > 0) {
          onSelectResult(sorted[0]);
          setExpanded(false);
        }
      }
    } catch {
      // GPS denied or failed — silently fail
    }
    setNearMeLoading(false);
  }, [onSelectResult, onSearch, setExpanded]);

  // Focus input when expanding
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [expanded]);

  // Close on outside tap
  useEffect(() => {
    if (!expanded) return;
    const handleTap = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleTap);
    return () => document.removeEventListener('mousedown', handleTap);
  }, [expanded]);

  const handleSelect = (loc: Location) => {
    // Save to recent searches
    const q = searchQuery.trim();
    if (q.length >= 2) {
      try {
        const prev: string[] = JSON.parse(localStorage.getItem('trailcamp_recent_searches') || '[]');
        const next = [q, ...prev.filter(s => s !== q)].slice(0, 5);
        localStorage.setItem('trailcamp_recent_searches', JSON.stringify(next));
      } catch {}
    }
    onSelectResult(loc);
    setExpanded(false);
    onSearch('');
  };

  const showResults = expanded && searchQuery.length > 0 && searchResults !== null;
  const showRecent = expanded && searchQuery.length === 0 && recentSearches.length > 0;

  // Group results by category
  const grouped = (searchResults || []).reduce((acc, loc) => {
    if (!acc[loc.category]) acc[loc.category] = [];
    acc[loc.category].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed top-3 left-3 right-3 z-40 lg:hidden flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-dark-900/90 backdrop-blur-md border border-dark-700/50 shadow-lg touch-manipulation"
        style={{ top: 'calc(env(safe-area-inset-top, 8px) + 4px)' }}
      >
        <Search size={16} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-500 truncate">Search {locationCount.toLocaleString()} locations...</span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-50 lg:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 8px)' }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 -z-10" onClick={() => setExpanded(false)} />

      <div className="mx-3 mt-1">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-dark-700/60 shadow-2xl">
          <Search size={16} className="text-orange-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={`Search ${locationCount.toLocaleString()} locations...`}
            className="w-full bg-transparent text-base lg:text-sm outline-none text-gray-100 placeholder-gray-500"
            autoComplete="off"
            autoCorrect="off"
          />
          {searchQuery && (
            <button onClick={() => onSearch('')} className="text-gray-500 p-1 touch-manipulation">
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => { setExpanded(false); onSearch(''); }}
            className="text-xs text-gray-400 font-medium flex-shrink-0 pl-2 touch-manipulation"
          >
            Cancel
          </button>
        </div>

        {/* Results dropdown */}
        {showResults && (
          <div className="mt-1.5 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-dark-700/60 shadow-2xl max-h-[60vh] overflow-y-auto overscroll-contain">
            {searchResults && searchResults.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No locations found</p>
                <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
              </div>
            )}
            {Object.entries(grouped).map(([category, locs]) => (
              <div key={category}>
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-dark-800/50 border-b border-dark-700/30 flex items-center gap-1.5 sticky top-0">
                  <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                  <span>{category}</span>
                  <span className="ml-auto text-gray-600">{locs.length}</span>
                </div>
                {locs.map((loc) => {
                  const diffColor = loc.difficulty ? DIFFICULTY_COLORS[loc.difficulty] : null;
                  const trailTypes = loc.category === 'riding' ? parseTrailTypes(loc.trail_types) : [];
                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleSelect(loc)}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 active:bg-dark-700/60 touch-manipulation"
                    >
                      <span
                        className="text-xs flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: `${CATEGORY_COLORS[loc.category]}20` }}
                      >
                        {CATEGORY_ICONS[loc.category]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-gray-100">{loc.name}</div>
                        {(loc.city || loc.state) && (
                          <div className="text-[10px] text-gray-500 truncate">{[loc.city, loc.state].filter(Boolean).join(', ')}</div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {loc.sub_type && (
                            <span className="text-[10px] text-gray-500 capitalize">{loc.sub_type}</span>
                          )}
                          {diffColor && (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: diffColor + '22', color: diffColor }}
                            >
                              {loc.difficulty}
                            </span>
                          )}
                          {loc.distance_miles != null && (
                            <span className="text-[9px] text-gray-500">{Math.round(loc.distance_miles)} mi</span>
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
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Near Me + Recent searches */}
        {expanded && searchQuery.length === 0 && (
          <div className="mt-1.5 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-dark-700/60 shadow-2xl">
            <button
              onClick={handleNearMe}
              disabled={nearMeLoading}
              className="w-full text-left px-4 py-3.5 text-sm text-orange-400 font-medium active:bg-dark-700/60 flex items-center gap-2.5 touch-manipulation border-b border-dark-700/30"
            >
              {nearMeLoading ? <Loader2 size={16} className="animate-spin flex-shrink-0" /> : <MapPin size={16} className="flex-shrink-0" />}
              {nearMeLoading ? 'Finding nearby...' : 'Near Me'}
              <span className="text-xs text-gray-500 ml-auto">Uses GPS</span>
            </button>
            {recentSearches.length > 0 && (
              <>
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recent Searches</div>
                {recentSearches.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSearch(q)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 active:bg-dark-700/60 flex items-center gap-2.5 touch-manipulation"
                  >
                    <Clock size={13} className="text-gray-500 flex-shrink-0" />
                    {q}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Results only when actively searching */}
        {false && showRecent && (
          <div className="mt-1.5 rounded-2xl bg-dark-900/95 backdrop-blur-xl border border-dark-700/60 shadow-2xl">
            <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recent Searches</div>
            {recentSearches.map((q) => (
              <button
                key={q}
                onClick={() => onSearch(q)}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 active:bg-dark-700/60 flex items-center gap-2.5 touch-manipulation"
              >
                <Clock size={13} className="text-gray-500 flex-shrink-0" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
