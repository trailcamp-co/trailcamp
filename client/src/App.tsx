import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useTrips, useTripStops, useLocations, getMapboxToken } from './hooks/useApi';
import { useFilters } from './hooks/useFilters';
import { useSearch } from './hooks/useSearch';
import { useRoute } from './hooks/useRoute';
import { useWeather } from './hooks/useWeather';
import { useMapInteraction } from './hooks/useMapInteraction';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Map from './components/map';
import TopBar from './components/TopBar';
import LeftSidebar from './components/sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import MobileBottomTabs from './components/MobileBottomTabs';
import OnboardingOverlay from './components/OnboardingOverlay';
import MobileFAB from './components/MobileFAB';
import MobileSearchBar from './components/MobileSearchBar';
import BottomSheet from './components/BottomSheet';
import type { SnapPoint } from './components/BottomSheet';
import MobileLocationDetail from './components/MobileLocationDetail';
import LoadingSpinner from './components/LoadingSpinner';
import type { MobileTab } from './components/MobileBottomTabs';
import type { Location, MapStyle, Filters } from './types';
import { MAP_STYLES } from './types';
import { useUserData } from './hooks/useUserData';
import { useFavorites } from './hooks/useFavorites';
import { useProfile } from './hooks/useProfile';
import { useNavigate } from 'react-router-dom';

// Lazy-loaded heavy components
const RightPanel = lazy(() => import('./components/RightPanel'));
const StatsPanel = lazy(() => import('./components/StatsPanel'));
const AddLocationModal = lazy(() => import('./components/AddLocationModal'));

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('trailcamp_dark_mode') !== 'false'; }
    catch { return true; }
  });
  const [mapStyle, setMapStyle] = useState<MapStyle>(MAP_STYLES[0]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<ReturnType<typeof useTrips>['trips'][number] | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');
  const [mobileSheetSnap, setMobileSheetSnap] = useState<SnapPoint>('half');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [forceCloseLayerPanel, setForceCloseLayerPanel] = useState(0);
  const navigate = useNavigate();

  const isMobile = useCallback(() => window.innerWidth < 1024, []);

  const handleMobileTabChange = useCallback((tab: MobileTab) => {
    if (tab === 'profile') {
      navigate('/settings');
      return;
    }
    setMobileTab(tab);
    // Dismiss bottom sheet when switching away from map
    if (tab !== 'map') {
      setMobileSheetOpen(false);
    }
  }, [navigate]);

  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('trailcamp-layers'));

  const { trips, createTrip, updateTrip, deleteTrip } = useTrips();
  const { stops, addStop, updateStop, reorderStops, deleteStop } = useTripStops(selectedTrip?.id ?? null);
  const { locations, loading: locationsLoading, fetchLocations, searchLocations, createLocation, updateLocation, deleteLocation, toggleFavorite } = useLocations();
  const { toasts, showToast, removeToast } = useToast();
  const { getLocationData, updateLocationData, dataMap } = useUserData();
  const { isFavorited, toggleFavorite: toggleFav, favoriteIds } = useFavorites();
  const { profile } = useProfile();
  const homeLat = profile?.home_lat ?? null;
  const homeLon = profile?.home_lon ?? null;

  const { routeGeoJSON } = useRoute(stops, updateStop);
  const { weatherCache, fetchWeather } = useWeather();
  // Derive visited IDs from user data
  const visitedIds = useMemo(() => {
    const set = new Set<number>();
    for (const [locId, data] of Object.entries(dataMap)) {
      if (data.visited) set.add(Number(locId));
    }
    return set;
  }, [dataMap]);

  const { filters, setFilters, filteredLocations, handleToggleLayer, handleToggleCampsiteSubType } = useFilters(locations, routeGeoJSON, favoriteIds, visitedIds);

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

  // Viewport-based location fetching — debounced on map move
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!mapBounds) return;
    if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
    boundsTimerRef.current = setTimeout(() => {
      const cats = Array.from(filters.categories).join(',');
      fetchLocations({
        sw_lat: String(mapBounds.south),
        sw_lng: String(mapBounds.west),
        ne_lat: String(mapBounds.north),
        ne_lng: String(mapBounds.east),
        categories: cats,
        limit: '5000',
      });
    }, 300); // 300ms debounce
    return () => { if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current); };
  }, [mapBounds, filters.categories, fetchLocations]);

  const handleOnboardingComplete = useCallback((selected: Set<import('./types').LocationCategory>) => {
    setFilters(prev => ({ ...prev, categories: selected }));
    localStorage.setItem('trailcamp-layers', JSON.stringify([...selected]));
    setShowOnboarding(false);
  }, [setFilters]);

  // Load mapbox token
  useEffect(() => {
    getMapboxToken().then(t => { setMapboxToken(t); (window as any).__mapboxToken = t; }).catch(() => {});
  }, []);

  // Expose locations globally for nearby lookups
  useEffect(() => {
    (window as any).__tcAllLocations = locations;
  }, [locations]);

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
    localStorage.setItem('trailcamp_dark_mode', String(darkMode));
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

  // Wrap handleLocationClick to open bottom sheet on mobile
  const handleLocationClickWrapped = useCallback((location: Location) => {
    handleLocationClick(location);
    if (isMobile()) {
      setMobileSheetSnap('half');
      setMobileSheetOpen(true);
      // Ensure we're on map tab
      setMobileTab('map');
    }
  }, [handleLocationClick, isMobile]);

  const handleDismissMobileSheet = useCallback(() => {
    setMobileSheetOpen(false);
    handleCloseRightPanel();
  }, [handleCloseRightPanel]);

  // Tap on map background when sheet is expanded → snap to peek
  const handleMapBackgroundTap = useCallback(() => {
    if (mobileSheetOpen && (mobileSheetSnap === 'half' || mobileSheetSnap === 'full')) {
      setMobileSheetSnap('peek');
    }
  }, [mobileSheetOpen, mobileSheetSnap]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileSheetOpen) { handleDismissMobileSheet(); return; }
        if (showRightPanel) { handleCloseRightPanel(); return; }
        if (showStats) { setShowStats(false); return; }
        if (showAddLocation) { setShowAddLocation(false); return; }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showRightPanel, showStats, showAddLocation, handleCloseRightPanel, setShowStats, mobileSheetOpen, handleDismissMobileSheet]);

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

  // Sidebar content (shared between desktop sidebar and mobile overlays)
  const sidebarContent = (
    <ErrorBoundary fallbackLabel="Sidebar error">
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
        onFlyTo={(lng, lat) => { handleFlyTo(lng, lat); setMobileTab('map'); }}
        locations={locations}
        filters={filters}
        setFilters={setFilters}
        weatherCache={weatherCache}
        fetchWeather={fetchWeather}
        routeGeoJSON={routeGeoJSON}
        mapBounds={mapBounds}
        onLocationClick={(loc) => { handleLocationClickWrapped(loc); setMobileTab('map'); }}
        onToggleFavorite={toggleFavorite}
        filterMode={filters.visitedStatus}
        onFilterMode={(mode: Filters['visitedStatus']) =>
          setFilters(prev => ({ ...prev, visitedStatus: mode }))
        }
        homeLat={homeLat}
        homeLon={homeLon}
      />
    </ErrorBoundary>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* TopBar — hidden on mobile, shown on desktop */}
      <div className="hidden lg:block">
        <TopBar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          searchResults={searchResults}
          onSelectSearchResult={(loc) => {
            handleLocationClickWrapped(loc);
            handleFlyTo(loc.longitude, loc.latitude);
            clearSearch();
          }}
          selectedTrip={selectedTrip}
          trips={trips}
          onSelectTrip={setSelectedTrip}
          onCreateTrip={createTrip}
          onToggleStats={handleToggleStats}
          onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          locationCount={locations.length}
        />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ===== DESKTOP: Left Sidebar (unchanged) ===== */}
        <div className={`
          hidden lg:block transition-all duration-300 flex-shrink-0 overflow-hidden
          ${leftSidebarOpen ? 'w-80' : 'w-0'}
        `}>
          {sidebarContent}
        </div>

        {/* ===== Map (always rendered, full-screen on mobile) ===== */}
        <div className="flex-1 relative mobile-map-container lg:!h-auto">
          <Map
            token={mapboxToken}
            style={mapStyle}
            locations={filteredLocations}
            stops={stops}
            routeGeoJSON={routeGeoJSON}
            onLocationClick={handleLocationClickWrapped}
            onMapClick={handleMapClick}
            onMapBackgroundTap={handleMapBackgroundTap}
            visibleLayers={filters.categories}
            onToggleLayer={handleToggleLayer}
            flyToLocation={flyToLocation}
            darkMode={darkMode}
            onBoundsChange={setMapBounds}
            campsiteSubTypes={filters.campsiteSubTypes}
            onToggleCampsiteSubType={handleToggleCampsiteSubType}
            mapStyle={mapStyle}
            onChangeMapStyle={setMapStyle}
            homeLat={homeLat}
            homeLon={homeLon}
            forceCloseLayerPanel={forceCloseLayerPanel}
            hideOnDesktop={showRightPanel}
            minGoogleRating={filters.minGoogleRating}
            onChangeMinRating={(r) => setFilters(prev => ({ ...prev, minGoogleRating: r }))}
          />
        </div>

        {/* ===== DESKTOP: Right Panel (slide from right) ===== */}
        <div
          className={`slide-panel absolute right-0 top-0 bottom-0 z-20 hidden lg:block ${
            showRightPanel ? 'lg:translate-x-0' : 'lg:translate-x-full'
          }`}
        >
          {selectedLocation && (
            <Suspense fallback={<div className="w-96 h-full flex items-center justify-center bg-dark-950"><LoadingSpinner text="Loading..." /></div>}>
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
                showToast={showToast}
                getUserData={getLocationData}
                onUpdateUserData={updateLocationData}
                isFavorited={isFavorited}
                onToggleFavorite={toggleFav}
                homeLat={homeLat}
                homeLon={homeLon}
              />
            </Suspense>
          )}
        </div>

        {/* ===== DESKTOP: Stats Panel ===== */}
        {showStats && (
          <div className="absolute right-0 top-0 bottom-0 z-20 hidden lg:block">
            <Suspense fallback={<div className="w-96 h-full flex items-center justify-center bg-dark-950"><LoadingSpinner text="Loading stats..." /></div>}>
              <StatsPanel onClose={() => setShowStats(false)} darkMode={darkMode} selectedTrip={selectedTrip} stops={stops} />
            </Suspense>
          </div>
        )}

        {/* ===== MOBILE: Full-screen overlay panels ===== */}
        {mobileTab === 'explore' && (
          <div className="mobile-panel-overlay bg-dark-950 lg:hidden animate-fade-in pb-20">
            <ErrorBoundary fallbackLabel="Explore error">
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
                onFlyTo={(lng, lat) => { handleFlyTo(lng, lat); setMobileTab('map'); }}
                locations={locations}
                filters={filters}
                setFilters={setFilters}
                weatherCache={weatherCache}
                fetchWeather={fetchWeather}
                routeGeoJSON={routeGeoJSON}
                mapBounds={mapBounds}
                onLocationClick={(loc) => { handleLocationClickWrapped(loc); setMobileTab('map'); }}
                onToggleFavorite={toggleFavorite}
                filterMode={filters.visitedStatus}
                onFilterMode={(mode: Filters['visitedStatus']) =>
                  setFilters(prev => ({ ...prev, visitedStatus: mode }))
                }
                homeLat={homeLat}
                homeLon={homeLon}
                hideTabs
                defaultTab="camp"
              />
            </ErrorBoundary>
          </div>
        )}

        {mobileTab === 'trips' && (
          <div className="mobile-panel-overlay bg-dark-950 lg:hidden animate-fade-in pb-20">
            <ErrorBoundary fallbackLabel="Trips error">
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
                onFlyTo={(lng, lat) => { handleFlyTo(lng, lat); setMobileTab('map'); }}
                locations={locations}
                filters={filters}
                setFilters={setFilters}
                weatherCache={weatherCache}
                fetchWeather={fetchWeather}
                routeGeoJSON={routeGeoJSON}
                mapBounds={mapBounds}
                onLocationClick={(loc) => { handleLocationClickWrapped(loc); setMobileTab('map'); }}
                onToggleFavorite={toggleFavorite}
                filterMode={filters.visitedStatus}
                onFilterMode={(mode: Filters['visitedStatus']) =>
                  setFilters(prev => ({ ...prev, visitedStatus: mode }))
                }
                homeLat={homeLat}
                homeLon={homeLon}
                hideTabs
                forceTab="trip"
              />
            </ErrorBoundary>
          </div>
        )}

        {mobileTab === 'saved' && (
          <div className="mobile-panel-overlay bg-dark-950 lg:hidden animate-fade-in pb-20">
            <ErrorBoundary fallbackLabel="Saved error">
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
                onFlyTo={(lng, lat) => { handleFlyTo(lng, lat); setMobileTab('map'); }}
                locations={locations}
                filters={filters}
                setFilters={setFilters}
                weatherCache={weatherCache}
                fetchWeather={fetchWeather}
                routeGeoJSON={routeGeoJSON}
                mapBounds={mapBounds}
                onLocationClick={(loc) => { handleLocationClickWrapped(loc); setMobileTab('map'); }}
                onToggleFavorite={toggleFavorite}
                filterMode="favorites"
                onFilterMode={(mode: Filters['visitedStatus']) =>
                  setFilters(prev => ({ ...prev, visitedStatus: mode }))
                }
                homeLat={homeLat}
                homeLon={homeLon}
                hideTabs
                forceTab="camp"
              />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Mobile Search Bar — only on map tab */}
      {mobileTab === 'map' && (
        <MobileSearchBar
          searchQuery={searchQuery}
          onSearch={handleSearch}
          searchResults={searchResults}
          onSelectResult={(loc) => {
            handleLocationClickWrapped(loc);
            handleFlyTo(loc.longitude, loc.latitude);
            clearSearch();
          }}
          locationCount={locations.length}
          onExpandChange={(expanded) => {
            if (expanded) setForceCloseLayerPanel(c => c + 1);
          }}
        />
      )}

      {/* Mobile Bottom Sheet for location details */}
      {selectedLocation && (
        <BottomSheet
          open={mobileSheetOpen}
          snapPoint={mobileSheetSnap}
          onSnapChange={setMobileSheetSnap}
          onDismiss={handleDismissMobileSheet}
        >
          <MobileLocationDetail
            location={selectedLocation}
            snapPoint={mobileSheetSnap}
            onAddToTrip={handleAddStopFromLocation}
            hasActiveTrip={!!selectedTrip}
            showToast={showToast}
            getUserData={getLocationData}
            onUpdateUserData={updateLocationData}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFav}
            homeLat={homeLat}
            homeLon={homeLon}
            allLocations={locations}
            onFlyTo={handleFlyTo}
          />
        </BottomSheet>
      )}

      {/* Mobile FAB — only on map tab */}
      {mobileTab === 'map' && (
        <MobileFAB onClick={() => {
          const center = mapBounds
            ? { lat: (mapBounds.north + mapBounds.south) / 2, lng: (mapBounds.east + mapBounds.west) / 2 }
            : { lat: 39.5, lng: -98.35 };
          setAddLocationCoords(center);
          setShowAddLocation(true);
        }} />
      )}

      {/* Mobile Bottom Tabs */}
      {showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}
      <MobileBottomTabs activeTab={mobileTab} onTabChange={handleMobileTabChange} />

      {/* Add Location Modal */}
      {showAddLocation && addLocationCoords && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><LoadingSpinner text="Loading..." /></div>}>
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
        </Suspense>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
