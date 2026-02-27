import { useState, useEffect, useCallback, useRef } from 'react';
import * as turf from '@turf/turf';
import { useTrips, useTripStops, useLocations, getMapboxToken } from './hooks/useApi';
import Map from './components/Map';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightPanel from './components/RightPanel';
import StatsPanel from './components/StatsPanel';
import AddLocationModal from './components/AddLocationModal';
import type { Location, Trip, TripStop, LocationCategory, MapStyle, Filters, WeatherData } from './types';
import { MAP_STYLES, DEFAULT_FILTERS, WEATHER_CODES } from './types';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>(MAP_STYLES[0]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    categories: new Set(DEFAULT_FILTERS.categories),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[] | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [flyToLocation, setFlyToLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherData>>({});

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { trips, createTrip, updateTrip, deleteTrip } = useTrips();
  const { stops, addStop, updateStop, reorderStops, deleteStop } = useTripStops(selectedTrip?.id ?? null);
  const { locations, fetchLocations, searchLocations, createLocation, updateLocation, deleteLocation } = useLocations();

  // Load mapbox token
  useEffect(() => {
    getMapboxToken().then(setMapboxToken).catch(() => {});
  }, []);

  // Select first trip by default (only on initial load)
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  useEffect(() => {
    if (trips.length > 0 && !selectedTrip && !hasAutoSelected) {
      setSelectedTrip(trips[0]);
      setHasAutoSelected(true);
    }
  }, [trips, selectedTrip, hasAutoSelected]);

  // Dark mode class
  useEffect(() => {
    document.documentElement.className = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  // Fetch route when stops change
  useEffect(() => {
    if (stops.length < 2) {
      setRouteGeoJSON(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        const stopsParam = stops.map(s => `${s.latitude},${s.longitude}`).join(';');
        const res = await fetch(`/api/directions?stops=${stopsParam}`);
        const data = await res.json();
        if (data.geometry) {
          setRouteGeoJSON(data.geometry);
          // Update stop drive times
          if (data.legs) {
            data.legs.forEach((leg: any, i: number) => {
              if (stops[i + 1]) {
                updateStop(stops[i + 1].id, {
                  drive_time_mins: leg.duration_mins,
                  drive_distance_miles: leg.distance_miles,
                });
              }
            });
          }
        }
      } catch {
        // Route fetch failed silently
      }
    };

    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, stops.map(s => `${s.latitude},${s.longitude}`).join(';')]);

  // Weather fetching
  const fetchWeather = useCallback(async (lat: number, lng: number, date: string): Promise<WeatherData | null> => {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;

    // Check cache first
    const cached = weatherCache[cacheKey];
    if (cached) return cached;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=America/Denver&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 0) {
        const weathercode = data.daily.weathercode[0];
        const codeInfo = WEATHER_CODES[weathercode] || { icon: '?', label: 'Unknown' };
        const weather: WeatherData = {
          date,
          high: Math.round(data.daily.temperature_2m_max[0] * 9 / 5 + 32),
          low: Math.round(data.daily.temperature_2m_min[0] * 9 / 5 + 32),
          precipitation: data.daily.precipitation_sum[0],
          weathercode,
          icon: codeInfo.icon,
          label: codeInfo.label,
        };

        setWeatherCache(prev => ({ ...prev, [cacheKey]: weather }));

        return weather;
      }
      return null;
    } catch {
      return null;
    }
  }, [weatherCache]);

  const handleLocationClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowRightPanel(true);
    setShowStats(false);
  }, []);

  const handleCloseRightPanel = useCallback(() => {
    setShowRightPanel(false);
    setSelectedLocation(null);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchLocations(query);
      setSearchResults(results);
    }, 300);
  }, [searchLocations]);

  const handleAddStopFromLocation = useCallback(async (location: Location) => {
    if (!selectedTrip) return;
    await addStop({
      location_id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }, [selectedTrip, addStop]);

  const handleMapClick = useCallback((e: { lng: number; lat: number }) => {
    setAddLocationCoords({ lat: e.lat, lng: e.lng });
    setShowAddLocation(true);
  }, []);

  const handleToggleLayer = useCallback((category: LocationCategory) => {
    setFilters(prev => {
      const nextCategories = new Set(prev.categories);
      if (nextCategories.has(category)) nextCategories.delete(category);
      else nextCategories.add(category);
      return { ...prev, categories: nextCategories };
    });
  }, []);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    setFlyToLocation({ lng, lat });
    setTimeout(() => setFlyToLocation(null), 100);
  }, []);

  // Filter locations for display
  const filteredLocations = locations.filter(l => {
    // Category filter
    if (!filters.categories.has(l.category)) return false;

    // Visited status filter
    if (filters.visitedStatus === 'visited' && !l.visited) return false;
    if (filters.visitedStatus === 'want_to_visit' && !l.want_to_visit) return false;
    if (filters.visitedStatus === 'highly_rated' && (!l.user_rating || l.user_rating < 4)) return false;

    // Boolean amenity filters
    if (filters.waterNearby && !l.water_nearby) return false;
    if (filters.dumpNearby && !l.dump_nearby) return false;
    if (filters.shade && !l.shade) return false;
    if (filters.levelGround && !l.level_ground) return false;

    // Difficulty filter (for riding locations)
    if (filters.difficulty && l.category === 'riding' && l.difficulty !== filters.difficulty) return false;

    // Minimum scenery filter
    if (filters.minScenery > 0 && (!l.scenery_rating || l.scenery_rating < filters.minScenery)) return false;

    // Near route filter
    if (filters.nearRoute && routeGeoJSON) {
      try {
        const point = turf.point([l.longitude, l.latitude]);
        const line = turf.lineString(routeGeoJSON.coordinates || routeGeoJSON.geometry?.coordinates || []);
        const nearest = turf.nearestPointOnLine(line, point);
        const dist = turf.distance(point, nearest, { units: 'miles' });
        if (dist > filters.nearRouteDistance) return false;
      } catch {
        // If route geometry is invalid, skip this filter
      }
    }

    return true;
  });

  if (!mapboxToken) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading TrailCamp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        mapStyle={mapStyle}
        onChangeMapStyle={setMapStyle}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        onSelectSearchResult={(loc) => {
          handleLocationClick(loc);
          handleFlyTo(loc.longitude, loc.latitude);
          setSearchResults(null);
          setSearchQuery('');
        }}
        selectedTrip={selectedTrip}
        trips={trips}
        onSelectTrip={setSelectedTrip}
        onToggleStats={() => { setShowStats(!showStats); setShowRightPanel(false); }}
        onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        filters={filters}
        setFilters={setFilters}
        filterMode={filters.visitedStatus}
        onFilterMode={(mode: 'all' | 'visited' | 'want_to_visit' | 'highly_rated') =>
          setFilters(prev => ({ ...prev, visitedStatus: mode }))
        }
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <div className={`transition-all duration-300 ${leftSidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 overflow-hidden`}>
          <LeftSidebar
            selectedTrip={selectedTrip}
            trips={trips}
            stops={stops}
            onSelectTrip={setSelectedTrip}
            onCreateTrip={createTrip}
            onUpdateTrip={updateTrip}
            onDeleteTrip={deleteTrip}
            onAddStop={addStop}
            onUpdateStop={updateStop}
            onDeleteStop={deleteStop}
            onReorderStops={reorderStops}
            onFlyTo={handleFlyTo}
            locations={locations}
            filters={filters}
            setFilters={setFilters}
            weatherCache={weatherCache}
            fetchWeather={fetchWeather}
            routeGeoJSON={routeGeoJSON}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            token={mapboxToken}
            style={mapStyle}
            locations={filteredLocations}
            stops={stops}
            routeGeoJSON={routeGeoJSON}
            onLocationClick={handleLocationClick}
            onMapClick={handleMapClick}
            visibleLayers={filters.categories}
            onToggleLayer={handleToggleLayer}
            flyToLocation={flyToLocation}
            darkMode={darkMode}
          />
        </div>

        {/* Right Panel */}
        <div
          className={`slide-panel absolute right-0 top-0 bottom-0 z-20 ${
            showRightPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedLocation && (
            <RightPanel
              location={selectedLocation}
              onClose={handleCloseRightPanel}
              onUpdate={updateLocation}
              onDelete={deleteLocation}
              onAddToTrip={handleAddStopFromLocation}
              hasActiveTrip={!!selectedTrip}
              darkMode={darkMode}
            />
          )}
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="absolute right-0 top-0 bottom-0 z-20">
            <StatsPanel onClose={() => setShowStats(false)} darkMode={darkMode} />
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddLocation && addLocationCoords && (
        <AddLocationModal
          coords={addLocationCoords}
          onClose={() => { setShowAddLocation(false); setAddLocationCoords(null); }}
          onCreate={async (loc) => {
            await createLocation(loc);
            setShowAddLocation(false);
            setAddLocationCoords(null);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
