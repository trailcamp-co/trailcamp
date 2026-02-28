import { useState } from 'react';
import { MapPin, Bike, Sliders } from 'lucide-react';
import type { Location, Trip, TripStop, Filters, WeatherData, CampsiteSubType } from '../../types';
import TripTab from './TripTab';
import RidingTab from './RidingTab';
import FiltersTab from './FiltersTab';

type SidebarTab = 'trip' | 'riding' | 'filters';

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
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('trip');

  return (
    <div className="w-80 h-full flex flex-col bg-dark-900 dark:bg-dark-900 border-r border-gray-700 dark:border-gray-700 light:bg-gray-50 light:border-gray-200 overflow-hidden [.light_&]:bg-gray-50 [.light_&]:border-gray-200">
      {/* Tab Bar */}
      <div className="flex-shrink-0 flex border-b border-gray-700/50 [.light_&]:border-gray-200">
        {(
          [
            { id: 'trip' as SidebarTab, label: 'Trip', icon: MapPin },
            { id: 'riding' as SidebarTab, label: 'Riding', icon: Bike },
            { id: 'filters' as SidebarTab, label: 'Filters', icon: Sliders },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-all ${
              activeTab === id
                ? 'text-orange-400 border-b-2 border-orange-400 bg-dark-800/50 [.light_&]:bg-orange-50/50'
                : 'text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Riding Tab */}
      {activeTab === 'riding' && (
        <div className="flex-1 overflow-hidden">
          <RidingTab locations={locations} onFlyTo={onFlyTo} mapBounds={mapBounds} onLocationClick={onLocationClick} />
        </div>
      )}

      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <div className="flex-1 overflow-y-auto">
          <FiltersTab filters={filters} setFilters={setFilters} routeGeoJSON={routeGeoJSON} />
        </div>
      )}

      {/* Trip Tab */}
      {activeTab === 'trip' && (
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
      )}
    </div>
  );
}
