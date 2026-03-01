import { useState } from 'react';
import { MapPin, Bike, Tent, Sliders, PackageCheck } from 'lucide-react';
import type { Location, Trip, TripStop, Filters, WeatherData, CampsiteSubType } from '../../types';
import TripTab from './TripTab';
import RidingTab from './RidingTab';
import CampsiteTab from './CampsiteTab';
import FiltersTab from './FiltersTab';
import PackingList from './PackingList';

export type SidebarTab = 'trip' | 'riding' | 'camp' | 'filters' | 'packing';

interface LeftSidebarProps {
  selectedTrip: Trip | null;
  trips: Trip[];
  stops: TripStop[];
  onSelectTrip: (trip: Trip | null) => void;
  onCreateTrip: (trip: Partial<Trip>) => Promise<Trip>;
  onUpdateTrip: (id: number, data: Partial<Trip>) => Promise<Trip>;
  onDeleteTrip: (id: number) => Promise<void>;
  onAddStop: (stop: Partial<TripStop>) => Promise<TripStop | undefined>;
  onUpdateStop: (stopId: number, data: Partial<TripStop>) => Promise<TripStop | undefined>;
  onDeleteStop: (stopId: number) => Promise<void>;
  onReorderStops: (stopIds: number[]) => Promise<void>;
  onFlyTo: (lng: number, lat: number) => void;
  locations: Location[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  weatherCache: Record<string, WeatherData>;
  fetchWeather: (lat: number, lng: number, date: string) => Promise<WeatherData | null>;
  routeGeoJSON: GeoJSON.GeoJsonObject | null;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  onLocationClick?: (location: Location) => void;
  onToggleFavorite?: (id: number) => void;
  filterMode: 'all' | 'visited' | 'highly_rated' | 'favorites';
  onFilterMode: (mode: 'all' | 'visited' | 'highly_rated' | 'favorites') => void;
  homeLat?: number | null;
  homeLon?: number | null;
  defaultTab?: SidebarTab;
  hideTabs?: boolean;
  forceTab?: SidebarTab;
}

export default function LeftSidebar({
  selectedTrip,
  trips,
  stops,
  onSelectTrip,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onReorderStops,
  onFlyTo,
  locations,
  filters,
  setFilters,
  weatherCache,
  fetchWeather,
  routeGeoJSON,
  mapBounds,
  onLocationClick,
  onToggleFavorite,
  filterMode,
  onFilterMode,
  homeLat,
  homeLon,
  defaultTab,
  hideTabs,
  forceTab,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>(defaultTab || 'trip');
  const currentTab = forceTab || activeTab;

  const ridingCount = locations.filter((l) => l.category === 'riding').length;
  const campsiteCount = locations.filter((l) => l.category === 'campsite').length;
  const stopCount = stops.length;

  // Calculate active filter count
  const ALL_CATEGORIES = ['campsite', 'riding', 'water', 'dump', 'scenic'];
  const ALL_CAMPSITE_SUBTYPES = ['boondocking', 'campground', 'parking'];
  const activeFilterCount = [
    filterMode !== 'all',
    filters.difficulty !== null,
    filters.hideOutOfSeason,
    filters.nearRoute,
    filters.waterNearby,
    filters.dumpNearby,
    filters.categories.size < ALL_CATEGORIES.length,
    filters.campsiteSubTypes.size < ALL_CAMPSITE_SUBTYPES.length,
  ].filter(Boolean).length;

  // Pill tabs for mobile hideTabs mode (Explore tab)
  const mobilePillTabs: { id: SidebarTab; label: string }[] = [
    { id: 'riding', label: 'Rides' },
    { id: 'camp', label: 'Camp' },
    { id: 'filters', label: 'Filters' },
  ];

  return (
    <div className="w-full lg:w-80 h-full flex flex-col bg-dark-950 border-r border-dark-700/50 overflow-hidden">
      {/* Full Tab Bar (desktop or when hideTabs is false) */}
      {!hideTabs && (
        <div className="flex-shrink-0 flex border-b border-dark-700/50">
          {(
            [
              { id: 'trip' as SidebarTab, label: 'Trip', icon: MapPin, count: stopCount },
              { id: 'riding' as SidebarTab, label: 'Rides', icon: Bike, count: ridingCount },
              { id: 'camp' as SidebarTab, label: 'Camp', icon: Tent, count: campsiteCount },
              { id: 'filters' as SidebarTab, label: 'Filters', icon: Sliders, count: activeFilterCount > 0 ? activeFilterCount : undefined },
              { id: 'packing' as SidebarTab, label: 'Pack', icon: PackageCheck, count: undefined },
            ] as const
          ).map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={count ? `${label} (${count.toLocaleString()})` : label}
              className={`flex-1 flex items-center justify-center gap-1.5 px-1 h-10 text-xs font-medium transition-all ${
                currentTab === id
                  ? 'text-orange-400 border-b-[3px] border-orange-400 bg-dark-800/70 font-semibold'
                  : 'text-gray-500 hover:text-gray-300 border-b-[3px] border-transparent'
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Compact pill switcher (mobile only, when hideTabs + no forceTab) */}
      {hideTabs && !forceTab && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-dark-700/50">
          {mobilePillTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentTab === id
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-dark-800 text-gray-400 border border-dark-700/50 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Riding Tab */}
      {currentTab === 'riding' && (
        <div className="flex-1 overflow-hidden animate-fade-in">
          <RidingTab locations={locations} onFlyTo={onFlyTo} mapBounds={mapBounds} onLocationClick={onLocationClick} onToggleFavorite={onToggleFavorite} homeLat={homeLat} homeLon={homeLon} />
        </div>
      )}

      {/* Campsite Tab */}
      {currentTab === 'camp' && (
        <div className="flex-1 overflow-hidden animate-fade-in">
          <CampsiteTab locations={locations} allLocations={locations} onFlyTo={onFlyTo} mapBounds={mapBounds} onLocationClick={onLocationClick} onToggleFavorite={onToggleFavorite} homeLat={homeLat} homeLon={homeLon} />
        </div>
      )}

      {/* Filters Tab */}
      {currentTab === 'filters' && (
        <div className="flex-1 overflow-y-auto animate-fade-in">
          <FiltersTab filters={filters} setFilters={setFilters} routeGeoJSON={routeGeoJSON} filterMode={filterMode} onFilterMode={onFilterMode} />
        </div>
      )}

      {/* Trip Tab */}
      {currentTab === 'trip' && (
        <div className="animate-fade-in flex-1 overflow-hidden flex flex-col">
          <TripTab
            selectedTrip={selectedTrip}
            trips={trips}
            stops={stops}
            onSelectTrip={onSelectTrip}
            onCreateTrip={onCreateTrip}
            onUpdateTrip={onUpdateTrip}
            onDeleteTrip={onDeleteTrip}
            onAddStop={onAddStop}
            onUpdateStop={onUpdateStop}
            onDeleteStop={onDeleteStop}
            onReorderStops={onReorderStops}
            onFlyTo={onFlyTo}
            locations={locations}
            weatherCache={weatherCache}
            fetchWeather={fetchWeather}
          />
        </div>
      )}
      {/* Packing List Tab */}
      {currentTab === 'packing' && (
        <div className="animate-fade-in flex-1 overflow-hidden flex flex-col">
          <PackingList />
        </div>
      )}
    </div>
  );
}
