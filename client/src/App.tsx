import { useState, useEffect, useCallback } from 'react';
import { useTrips, useTripStops, useLocations, getMapboxToken } from './hooks/useApi';
import Map from './components/Map';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightPanel from './components/RightPanel';
import StatsPanel from './components/StatsPanel';
import AddLocationModal from './components/AddLocationModal';
import type { Location, Trip, TripStop, LocationCategory } from './types';
import { MAP_STYLES } from './types';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<LocationCategory>>(
    new Set(['campsite', 'riding', 'water', 'dump', 'gas', 'grocery', 'scenic', 'laundromat'])
  );
  const [filterMode, setFilterMode] = useState<'all' | 'visited' | 'want_to_visit' | 'highly_rated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[] | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [flyToLocation, setFlyToLocation] = useState<{ lng: number; lat: number } | null>(null);

  const { trips, createTrip, updateTrip, deleteTrip } = useTrips();
  const { stops, addStop, updateStop, reorderStops, deleteStop } = useTripStops(selectedTrip?.id ?? null);
  const { locations, fetchLocations, searchLocations, createLocation, updateLocation, deleteLocation } = useLocations();

  // Load mapbox token
  useEffect(() => {
    getMapboxToken().then(setMapboxToken).catch(console.error);
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
      } catch (e) {
        console.error('Failed to fetch route', e);
      }
    };

    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, stops.map(s => `${s.latitude},${s.longitude}`).join(';')]);

  const handleLocationClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowRightPanel(true);
    setShowStats(false);
  }, []);

  const handleCloseRightPanel = useCallback(() => {
    setShowRightPanel(false);
    setSelectedLocation(null);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await searchLocations(query);
    setSearchResults(results);
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
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    setFlyToLocation({ lng, lat });
    setTimeout(() => setFlyToLocation(null), 100);
  }, []);

  // Filter locations for display
  const filteredLocations = locations.filter(l => {
    if (!visibleLayers.has(l.category)) return false;
    if (filterMode === 'visited' && !l.visited) return false;
    if (filterMode === 'want_to_visit' && !l.want_to_visit) return false;
    if (filterMode === 'highly_rated' && (!l.user_rating || l.user_rating < 4)) return false;
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
        filterMode={filterMode}
        onFilterMode={setFilterMode}
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
            visibleLayers={visibleLayers}
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
