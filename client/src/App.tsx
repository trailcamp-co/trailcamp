import { useState, useEffect, useCallback } from 'react';
import { useTrips, useTripStops, useLocations, getMapboxToken } from './hooks/useApi';
import { useFilters } from './hooks/useFilters';
import { useSearch } from './hooks/useSearch';
import { useRoute } from './hooks/useRoute';
import { useWeather } from './hooks/useWeather';
import { useMapInteraction } from './hooks/useMapInteraction';
import Map from './components/map';
import TopBar from './components/TopBar';
import LeftSidebar from './components/sidebar';
import RightPanel from './components/RightPanel';
import StatsPanel from './components/StatsPanel';
import AddLocationModal from './components/AddLocationModal';
import type { Location, MapStyle } from './types';
import { MAP_STYLES } from './types';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>(MAP_STYLES[0]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<ReturnType<typeof useTrips>['trips'][number] | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { trips, createTrip, updateTrip, deleteTrip } = useTrips();
  const { stops, addStop, updateStop, reorderStops, deleteStop } = useTripStops(selectedTrip?.id ?? null);
  const { locations, searchLocations, createLocation, updateLocation, deleteLocation, toggleFavorite } = useLocations();

  const { routeGeoJSON } = useRoute(stops, updateStop);
  const { weatherCache, fetchWeather } = useWeather();
  const { filters, setFilters, filteredLocations, handleToggleLayer, handleToggleCampsiteSubType } = useFilters(locations, routeGeoJSON);
  const { searchQuery, searchResults, handleSearch, clearSearch } = useSearch(searchLocations);
  const {
    selectedLocation,
    showRightPanel,
    showStats,
    setShowStats,
    flyToLocation,
    mapBounds,
    setMapBounds,
    handleLocationClick,
    handleCloseRightPanel,
    handleFlyTo,
    handleToggleStats,
  } = useMapInteraction();

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

  if (!mapboxToken) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-950">
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
        searchQuery={searchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        onSelectSearchResult={(loc) => {
          handleLocationClick(loc);
          handleFlyTo(loc.longitude, loc.latitude);
          clearSearch();
        }}
        selectedTrip={selectedTrip}
        trips={trips}
        onSelectTrip={setSelectedTrip}
        onToggleStats={handleToggleStats}
        onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        locationCount={locations.length}
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
            mapBounds={mapBounds}
            onLocationClick={handleLocationClick}
            onToggleFavorite={toggleFavorite}
            filterMode={filters.visitedStatus}
            onFilterMode={(mode: 'all' | 'visited' | 'want_to_visit' | 'highly_rated' | 'favorites') =>
              setFilters(prev => ({ ...prev, visitedStatus: mode }))
            }
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
            onBoundsChange={setMapBounds}
            campsiteSubTypes={filters.campsiteSubTypes}
            onToggleCampsiteSubType={handleToggleCampsiteSubType}
            mapStyle={mapStyle}
            onChangeMapStyle={setMapStyle}
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
              onFlyTo={handleFlyTo}
              onLocationClick={handleLocationClick}
            />
          )}
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="absolute right-0 top-0 bottom-0 z-20">
            <StatsPanel onClose={() => setShowStats(false)} darkMode={darkMode} selectedTrip={selectedTrip} stops={stops} />
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
