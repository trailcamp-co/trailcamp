import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Plus,
  Trash2,
  MapPin,
  Clock,
  Route,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
  Check,
  Calendar,
  Shuffle,
} from 'lucide-react';
import type { Location, Trip, TripStop, WeatherData } from '../../types';
import { SortableStopCard, OverlayStopCard } from './StopCard';
import { optimizeTrip } from '../../hooks/useApi';

// --------------- Constants ---------------

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const STATUS_STYLES_LIGHT: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700 border border-blue-200',
  active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  completed: 'bg-gray-100 text-gray-600 border border-gray-200',
};

// --------------- Utility functions ---------------

function formatDistance(miles: number | null): string {
  if (miles == null) return '';
  return `${Math.round(miles)} mi`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeatherCacheKey(lat: number, lng: number, date: string): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
}

interface StopDateInfo {
  arrivalDate: string;
  departureDate: string;
}

function calculateStopDates(
  stops: TripStop[],
  startDate: string | null,
): Map<number, StopDateInfo> {
  const dateMap = new Map<number, StopDateInfo>();
  if (!startDate) return dateMap;

  let currentDate = startDate;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const arrivalDate = currentDate;
    const nights = stop.nights ?? 0;
    const departureDate = addDays(arrivalDate, nights);

    dateMap.set(stop.id, { arrivalDate, departureDate });

    if (i < stops.length - 1) {
      currentDate = addDays(departureDate, 1);
    }
  }

  return dateMap;
}

// --------------- Modifier ---------------

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

// --------------- Props ---------------

interface TripTabProps {
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
  weatherCache: Record<string, WeatherData>;
  fetchWeather: (lat: number, lng: number, date: string) => Promise<WeatherData | null>;
}

export default function TripTab({
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
  weatherCache,
  fetchWeather,
}: TripTabProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [expandedStopId, setExpandedStopId] = useState<number | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalValue, setJournalValue] = useState('');
  const [showAddStop, setShowAddStop] = useState(false);
  const [addStopSearch, setAddStopSearch] = useState('');
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [editingStartDate, setEditingStartDate] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.sort_order - b.sort_order),
    [stops],
  );

  const stopDates = useMemo(
    () => calculateStopDates(sortedStops, selectedTrip?.start_date ?? null),
    [sortedStops, selectedTrip?.start_date],
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch weather for visible stops with dates
  useEffect(() => {
    if (!selectedTrip?.start_date) return;

    sortedStops.forEach((stop) => {
      const dateInfo = stopDates.get(stop.id);
      if (!dateInfo) return;

      const daysOut = daysBetween(todayStr, dateInfo.arrivalDate);
      if (daysOut < 0 || daysOut > 14) return;

      const cacheKey = getWeatherCacheKey(stop.latitude, stop.longitude, dateInfo.arrivalDate);
      if (cacheKey in weatherCache) return;

      fetchWeather(stop.latitude, stop.longitude, dateInfo.arrivalDate);
    });
  }, [sortedStops, stopDates, selectedTrip?.start_date, todayStr, weatherCache, fetchWeather]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const startEditName = useCallback(() => {
    if (!selectedTrip) return;
    setNameValue(selectedTrip.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [selectedTrip]);

  const saveName = useCallback(async () => {
    if (!selectedTrip || !nameValue.trim()) {
      setEditingName(false);
      return;
    }
    await onUpdateTrip(selectedTrip.id, { name: nameValue.trim() });
    setEditingName(false);
  }, [selectedTrip, nameValue, onUpdateTrip]);

  const cancelEditName = useCallback(() => {
    setEditingName(false);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedStops.findIndex((s) => s.id === active.id);
      const newIndex = sortedStops.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedStops, oldIndex, newIndex);
      onReorderStops(reordered.map((s) => s.id));
    },
    [sortedStops, onReorderStops],
  );

  const filteredLocations = addStopSearch.trim()
    ? locations.filter((l) =>
        l.name.toLowerCase().includes(addStopSearch.toLowerCase()),
      )
    : locations.slice(0, 20);

  const handleAddStopFromLocation = useCallback(
    async (loc: Location) => {
      await onAddStop({
        location_id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setShowAddStop(false);
      setAddStopSearch('');
    },
    [onAddStop],
  );

  const handleJournalOpen = useCallback(() => {
    setJournalValue(selectedTrip?.notes ?? '');
    setJournalOpen(true);
  }, [selectedTrip]);

  const handleJournalBlur = useCallback(async () => {
    if (!selectedTrip) return;
    if (journalValue !== (selectedTrip.notes ?? '')) {
      await onUpdateTrip(selectedTrip.id, { notes: journalValue });
    }
  }, [selectedTrip, journalValue, onUpdateTrip]);

  const handleCreateTrip = useCallback(async () => {
    const trip = await onCreateTrip({ name: 'New Trip', status: 'planning' });
    onSelectTrip(trip);
  }, [onCreateTrip, onSelectTrip]);

  const handleDeleteTrip = useCallback(async () => {
    if (!selectedTrip) return;
    if (!window.confirm(`Delete "${selectedTrip.name}"? This cannot be undone.`)) return;
    await onDeleteTrip(selectedTrip.id);
  }, [selectedTrip, onDeleteTrip]);

  const handleStartDateChange = useCallback(
    async (dateStr: string) => {
      if (!selectedTrip) return;
      await onUpdateTrip(selectedTrip.id, { start_date: dateStr || null });
      setEditingStartDate(false);
    },
    [selectedTrip, onUpdateTrip],
  );

  const [optimizing, setOptimizing] = useState(false);
  const [savedMiles, setSavedMiles] = useState<number | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!selectedTrip) return;
    if (!window.confirm('Optimize stop order for minimum driving distance? The first stop will remain fixed.')) return;
    setOptimizing(true);
    setSavedMiles(null);
    try {
      const result = await optimizeTrip(selectedTrip.id);
      setSavedMiles(result.saved);
      // Reload stops
      await onReorderStops(result.stops.map((s: TripStop) => s.id));
    } catch { /* optimize failed */ }
    setOptimizing(false);
    setTimeout(() => setSavedMiles(null), 5000);
  }, [selectedTrip, onReorderStops]);

  const totalNights = sortedStops.reduce((sum, s) => sum + (s.nights ?? 0), 0);
  const totalDistance = sortedStops.reduce((sum, s) => sum + (s.drive_distance_miles ?? 0), 0);

  const activeDragStop = useMemo(() => {
    if (activeDragId == null) return null;
    return sortedStops.find((s) => s.id === activeDragId) ?? null;
  }, [activeDragId, sortedStops]);

  const activeDragIndex = useMemo(() => {
    if (activeDragId == null) return -1;
    return sortedStops.findIndex((s) => s.id === activeDragId);
  }, [activeDragId, sortedStops]);

  return (
    <>
      {/* Trip Header */}
      <div className="flex-shrink-0 p-4 border-b border-dark-700/50 [.light_&]:border-gray-200">
        {selectedTrip ? (
          <>
            {/* Trip name */}
            <div className="flex items-center gap-2 mb-2">
              {editingName ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') cancelEditName();
                    }}
                    className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-600 [.light_&]:border-gray-300 rounded px-2 py-1 text-lg font-semibold text-white [.light_&]:text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                  <button onClick={saveName} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEditName} className="p-1 text-gray-400 hover:text-gray-300 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <h2
                    className="flex-1 text-lg font-semibold text-white [.light_&]:text-gray-900 cursor-pointer hover:text-orange-400 transition-colors truncate"
                    onClick={startEditName}
                    title="Click to edit"
                  >
                    {selectedTrip.name}
                  </h2>
                  <button onClick={startEditName} className="p-1 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors" title="Edit name">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={handleDeleteTrip} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete trip">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Status badge + dates */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${STATUS_STYLES[selectedTrip.status]} [.light_&]:hidden`}>
                {selectedTrip.status}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium hidden [.light_&]:inline ${STATUS_STYLES_LIGHT[selectedTrip.status]}`}>
                {selectedTrip.status}
              </span>
              {(selectedTrip.start_date || selectedTrip.end_date) && (
                <span className="text-xs text-gray-500">
                  {formatDate(selectedTrip.start_date)}
                  {selectedTrip.start_date && selectedTrip.end_date && ' — '}
                  {formatDate(selectedTrip.end_date)}
                </span>
              )}
            </div>

            {/* Start date picker */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={12} className="text-orange-400" />
              {editingStartDate ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    defaultValue={selectedTrip.start_date ?? ''}
                    onBlur={(e) => handleStartDateChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartDateChange((e.target as HTMLInputElement).value);
                      if (e.key === 'Escape') setEditingStartDate(false);
                    }}
                    autoFocus
                    className="bg-dark-800 [.light_&]:bg-white border border-gray-600 [.light_&]:border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button onClick={() => setEditingStartDate(false)} className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStartDate(true)}
                  className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                >
                  {selectedTrip.start_date ? `Start: ${formatDate(selectedTrip.start_date)}` : 'Set start date...'}
                </button>
              )}
            </div>

            {/* Trip stats pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-gray-300" title="Total stops">
                <MapPin size={11} className="text-orange-400" />
                <span className="font-medium">{sortedStops.length}</span> stops
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-gray-300" title="Total nights">
                <Clock size={11} className="text-orange-400" />
                <span className="font-medium">{totalNights}</span> nights
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-gray-300" title="Total distance">
                <Route size={11} className="text-orange-400" />
                <span className="font-medium">{formatDistance(totalDistance) || '0 mi'}</span>
              </div>
              {sortedStops.length >= 3 && (
                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all disabled:opacity-50"
                  title="Optimize route"
                >
                  <Shuffle size={11} />
                  {optimizing ? '...' : 'Optimize'}
                </button>
              )}
            </div>
            {savedMiles !== null && savedMiles > 0 && (
              <div className="text-xs text-emerald-400 mt-1.5 animate-fade-in">Saved {savedMiles} miles!</div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">No trip selected</p>
        )}

        {/* Create new trip */}
        <button
          onClick={handleCreateTrip}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            text-gray-400 hover:text-orange-400 border border-dark-700/50 hover:border-orange-500/30
            hover:bg-orange-500/10 transition-all press-scale
            [.light_&]:text-gray-500 [.light_&]:border-gray-200 [.light_&]:hover:text-orange-500"
        >
          <Plus size={14} />
          New Trip
        </button>
      </div>

      {/* ===== Stops List ===== */}
      <div className="flex-1 overflow-y-auto">
        {selectedTrip && sortedStops.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <MapPin size={32} className="mx-auto mb-2 opacity-40" />
            <p>No stops yet.</p>
            <p className="text-xs mt-1">Add your first stop below.</p>
          </div>
        )}

        {selectedTrip && sortedStops.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sortedStops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="py-1">
                {sortedStops.map((stop, index) => {
                  const dateInfo = stopDates.get(stop.id) ?? null;
                  let weatherData: WeatherData | null = null;
                  let isForecastTooFar = false;

                  if (dateInfo) {
                    const daysOut = daysBetween(todayStr, dateInfo.arrivalDate);
                    if (daysOut >= 0 && daysOut <= 14) {
                      const cacheKey = getWeatherCacheKey(stop.latitude, stop.longitude, dateInfo.arrivalDate);
                      weatherData = weatherCache[cacheKey] ?? null;
                    } else if (daysOut > 14) {
                      isForecastTooFar = true;
                    }
                  }

                  return (
                    <SortableStopCard
                      key={stop.id}
                      stop={stop}
                      index={index}
                      isExpanded={expandedStopId === stop.id}
                      onToggleExpand={() => setExpandedStopId(expandedStopId === stop.id ? null : stop.id)}
                      onFlyTo={onFlyTo}
                      onDeleteStop={onDeleteStop}
                      onUpdateStop={onUpdateStop}
                      dateInfo={dateInfo}
                      weatherData={weatherData}
                      isForecastTooFar={isForecastTooFar}
                      driveTimeMins={stop.drive_time_mins}
                      driveDistanceMiles={stop.drive_distance_miles}
                      showDriveConnector={index > 0 && !!(stop.drive_time_mins || stop.drive_distance_miles)}
                    />
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeDragStop && (
                <OverlayStopCard stop={activeDragStop} index={activeDragIndex} />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add Stop */}
        {selectedTrip && (
          <div className="px-3 pb-3">
            {showAddStop ? (
              <div className="bg-dark-800 [.light_&]:bg-white rounded-lg border border-gray-700 [.light_&]:border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider">
                    Add a Stop
                  </span>
                  <button
                    onClick={() => { setShowAddStop(false); setAddStopSearch(''); }}
                    className="text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={addStopSearch}
                  onChange={(e) => setAddStopSearch(e.target.value)}
                  placeholder="Search locations..."
                  autoFocus
                  className="w-full bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1.5 text-sm text-gray-200 [.light_&]:text-gray-800 placeholder-gray-600 [.light_&]:placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors mb-2"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredLocations.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">No locations found.</p>
                  )}
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleAddStopFromLocation(loc)}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm
                        text-gray-300 [.light_&]:text-gray-700
                        hover:bg-dark-700 [.light_&]:hover:bg-gray-100 transition-colors"
                    >
                      <MapPin size={12} className="text-orange-400 flex-shrink-0" />
                      <span className="truncate">{loc.name}</span>
                      <span className="text-[10px] text-gray-500 capitalize ml-auto flex-shrink-0">
                        {loc.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddStop(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs
                  border border-dashed border-dark-700/50 [.light_&]:border-gray-300
                  text-gray-500 hover:text-orange-400 hover:border-orange-500/40
                  [.light_&]:text-gray-400 [.light_&]:hover:text-orange-500
                  transition-all press-scale"
              >
                <Plus size={14} />
                Add Stop
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== Trip Journal ===== */}
      {selectedTrip && (
        <div className="flex-shrink-0 border-t border-dark-700/50 [.light_&]:border-gray-200">
          <button
            onClick={() => {
              if (!journalOpen) handleJournalOpen();
              else setJournalOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 [.light_&]:text-gray-600 hover:text-gray-200 [.light_&]:hover:text-gray-800 transition-colors"
          >
            <span className="font-medium">Trip Journal</span>
            {journalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {journalOpen && (
            <div className="px-4 pb-4 animate-fade-in">
              {!journalValue && !editingName ? (
                <p className="text-xs text-gray-600 italic cursor-pointer hover:text-gray-400 transition-colors py-2" onClick={() => { setJournalValue(''); }}>
                  No entries yet — add your first note
                </p>
              ) : null}
              <textarea
                value={journalValue}
                onChange={(e) => setJournalValue(e.target.value)}
                onBlur={handleJournalBlur}
                placeholder="Write your trip notes, memories, and journal entries here..."
                rows={5}
                className="w-full bg-dark-800 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
              />
              <p className="text-[9px] text-gray-600 mt-1">Auto-saves on blur</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
