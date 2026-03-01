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
  Download,
  Share2,
  Copy,
  ArrowRight,
} from 'lucide-react';
import type { Location, Trip, TripStop, WeatherData, JournalEntry } from '../../types';
import { SortableStopCard, OverlayStopCard } from './StopCard';
import { optimizeTrip, fetchJournal, createJournalEntry, updateJournalEntry, deleteJournalEntry, duplicateTrip } from '../../hooks/useApi';
import { TRIP_TEMPLATES } from '../../data/tripTemplates';

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

const STATUS_TRANSITIONS: Record<string, string> = {
  planning: 'active',
  active: 'completed',
};

const STATUS_TRANSITION_LABELS: Record<string, string> = {
  planning: 'Start Trip',
  active: 'Complete Trip',
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

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function todayDateStr(): string {
  return new Date().toISOString().split('T')[0];
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
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [journalStopId, setJournalStopId] = useState<number | null>(null);
  const [journalDate, setJournalDate] = useState(todayDateStr());
  const [journalSubmitting, setJournalSubmitting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editingEntryContent, setEditingEntryContent] = useState('');
  const [editingEntryStopId, setEditingEntryStopId] = useState<number | null>(null);
  const [editingEntryDate, setEditingEntryDate] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.sort_order - b.sort_order),
    [stops],
  );

  const stopDates = useMemo(
    () => calculateStopDates(sortedStops, selectedTrip?.start_date ?? null),
    [sortedStops, selectedTrip?.start_date],
  );

  const todayStr = useMemo(() => todayDateStr(), []);

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

  // Load journal entries when trip changes
  useEffect(() => {
    if (!selectedTrip) { setJournalEntries([]); return; }
    fetchJournal(selectedTrip.id).then(setJournalEntries).catch(() => {});
  }, [selectedTrip?.id]);

  const handleAddJournalEntry = useCallback(async () => {
    if (!selectedTrip || !journalContent.trim()) return;
    setJournalSubmitting(true);
    try {
      const entry = await createJournalEntry(selectedTrip.id, {
        stop_id: journalStopId,
        content: journalContent.trim(),
        entry_date: journalDate || todayDateStr(),
      });
      setJournalEntries(prev => [entry, ...prev].sort((a, b) => (b.entry_date || b.created_at).localeCompare(a.entry_date || a.created_at)));
      setJournalContent('');
      setJournalStopId(null);
      setJournalDate(todayDateStr());
    } catch { /* failed */ }
    setJournalSubmitting(false);
  }, [selectedTrip, journalContent, journalStopId, journalDate]);

  const handleStartEditEntry = useCallback((entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntryContent(entry.content);
    setEditingEntryStopId(entry.stop_id);
    setEditingEntryDate(entry.entry_date || '');
  }, []);

  const handleSaveEditEntry = useCallback(async () => {
    if (!selectedTrip || editingEntryId == null) return;
    try {
      const updated = await updateJournalEntry(selectedTrip.id, editingEntryId, {
        content: editingEntryContent.trim(),
        stop_id: editingEntryStopId,
        entry_date: editingEntryDate || null,
      });
      setJournalEntries(prev =>
        prev.map(e => e.id === editingEntryId ? { ...e, ...updated } : e)
          .sort((a, b) => (b.entry_date || b.created_at).localeCompare(a.entry_date || a.created_at))
      );
      setEditingEntryId(null);
    } catch { /* failed */ }
  }, [selectedTrip, editingEntryId, editingEntryContent, editingEntryStopId, editingEntryDate]);

  const handleDeleteJournalEntry = useCallback(async (entryId: number) => {
    if (!selectedTrip) return;
    try {
      await deleteJournalEntry(selectedTrip.id, entryId);
      setJournalEntries(prev => prev.filter(e => e.id !== entryId));
    } catch { /* failed */ }
  }, [selectedTrip]);

  const handleCreateTrip = useCallback(async () => {
    const trip = await onCreateTrip({ name: 'New Trip', status: 'planning' });
    onSelectTrip(trip);
  }, [onCreateTrip, onSelectTrip]);

  const handleDeleteTrip = useCallback(async (tripId: number, tripName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(`Delete "${tripName}"? This cannot be undone.`)) return;
    await onDeleteTrip(tripId);
    if (selectedTrip?.id === tripId) onSelectTrip(null);
  }, [onDeleteTrip, selectedTrip, onSelectTrip]);

  const handleDuplicateTrip = useCallback(async (tripId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newTrip = await duplicateTrip(tripId);
    onSelectTrip(newTrip);
  }, [onSelectTrip]);

  const handleStatusChange = useCallback(async (tripId: number, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await onUpdateTrip(tripId, { status: newStatus as Trip['status'] });
  }, [onUpdateTrip]);

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
      await onReorderStops(result.stops.map((s: TripStop) => s.id));
    } catch { /* optimize failed */ }
    setOptimizing(false);
    setTimeout(() => setSavedMiles(null), 5000);
  }, [selectedTrip, onReorderStops]);

  const [shareCopied, setShareCopied] = useState(false);
  const handleShareTrip = useCallback(() => {
    if (!selectedTrip || sortedStops.length === 0) return;
    const lines: string[] = [];
    lines.push(`🗺️ ${selectedTrip.name}`);
    if (selectedTrip.start_date) lines.push(`📅 Starting ${formatDate(selectedTrip.start_date)}`);
    const nights = sortedStops.reduce((s, st) => s + (st.nights ?? 0), 0);
    const miles = sortedStops.reduce((s, st) => s + (st.drive_distance_miles ?? 0), 0);
    lines.push(`📍 ${sortedStops.length} stops · ${nights} nights · ${Math.round(miles)} mi`);
    lines.push('');
    let currentDate = selectedTrip.start_date || '';
    sortedStops.forEach((stop, i) => {
      const name = stop.name || stop.location_name || `Stop ${i + 1}`;
      let line = `${i + 1}. ${name}`;
      if (stop.nights) line += ` (${stop.nights} night${stop.nights > 1 ? 's' : ''})`;
      if (currentDate) {
        line += ` — ${formatDate(currentDate)}`;
        currentDate = addDays(currentDate, stop.nights || 1);
      }
      lines.push(line);
      if (stop.drive_distance_miles && i < sortedStops.length - 1) {
        lines.push(`   ↳ ${Math.round(stop.drive_distance_miles)} mi drive to next stop`);
      }
    });
    lines.push('');
    lines.push('Planned with TrailCamp');
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, [selectedTrip, sortedStops]);

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

  // Group journal entries by date for timeline view
  const journalByDate = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    for (const entry of journalEntries) {
      const date = entry.entry_date || entry.created_at?.split('T')[0] || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [journalEntries]);

  // ===== RENDER: My Trips Dashboard (no trip selected) =====
  if (!selectedTrip) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-200 [.light_&]:text-gray-800 uppercase tracking-wider">My Trips</h3>
            <button
              onClick={handleCreateTrip}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all press-scale"
            >
              <Plus size={14} /> New Trip
            </button>
          </div>

          {/* Trip Cards */}
          {trips.length > 0 ? (
            <div className="space-y-2 mb-6">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => onSelectTrip(trip)}
                  className="w-full text-left rounded-xl bg-dark-800/50 [.light_&]:bg-gray-50 border border-dark-700/30 [.light_&]:border-gray-200 hover:border-orange-500/30 hover:bg-dark-800 [.light_&]:hover:bg-gray-100 transition-all group p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-200 [.light_&]:text-gray-800 group-hover:text-white [.light_&]:group-hover:text-gray-900 transition-colors truncate">
                        {trip.name}
                      </h4>
                      {(trip.start_date || trip.end_date) && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {formatDateShort(trip.start_date)}
                          {trip.start_date && trip.end_date && ' — '}
                          {formatDateShort(trip.end_date)}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium flex-shrink-0 ${STATUS_STYLES[trip.status]} [.light_&]:hidden`}>
                      {trip.status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium flex-shrink-0 hidden [.light_&]:inline ${STATUS_STYLES_LIGHT[trip.status]}`}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2">
                    {trip.stop_count != null && (
                      <span className="flex items-center gap-1">
                        <MapPin size={9} className="text-orange-400" /> {trip.stop_count} stops
                      </span>
                    )}
                    {trip.total_nights != null && trip.total_nights > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={9} className="text-orange-400" /> {trip.total_nights} nights
                      </span>
                    )}
                    {trip.total_distance != null && trip.total_distance > 0 && (
                      <span className="flex items-center gap-1">
                        <Route size={9} className="text-orange-400" /> {Math.round(trip.total_distance)} mi
                      </span>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-1.5">
                    {STATUS_TRANSITIONS[trip.status] && (
                      <button
                        onClick={(e) => handleStatusChange(trip.id, STATUS_TRANSITIONS[trip.status], e)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors flex items-center gap-1"
                      >
                        <ArrowRight size={9} />
                        {STATUS_TRANSITION_LABELS[trip.status]}
                      </button>
                    )}
                    {trip.status === 'completed' && (
                      <button
                        onClick={(e) => handleStatusChange(trip.id, 'planning', e)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
                      >
                        Replan
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDuplicateTrip(trip.id, e)}
                      className="text-[10px] px-2 py-0.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Duplicate trip"
                    >
                      <Copy size={10} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, trip.name, e)}
                      className="text-[10px] px-2 py-0.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                      title="Delete trip"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 mb-6">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-sm text-gray-400 [.light_&]:text-gray-500 mb-1">No trips yet</p>
              <p className="text-xs text-gray-600 [.light_&]:text-gray-400">Create your first trip to start planning!</p>
            </div>
          )}

          {/* Quick Start Templates */}
          <div className="mb-4">
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Start Templates</h4>
            <div className="space-y-1.5">
              {TRIP_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={async () => {
                    const trip = await onCreateTrip({ name: tmpl.name, status: 'planning' });
                    onSelectTrip(trip);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-dark-800/50 [.light_&]:bg-gray-50 border border-dark-700/30 [.light_&]:border-gray-200 hover:border-orange-500/30 hover:bg-dark-800 [.light_&]:hover:bg-gray-100 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{tmpl.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-200 [.light_&]:text-gray-800 group-hover:text-white [.light_&]:group-hover:text-gray-900 transition-colors">{tmpl.name}</div>
                      <div className="text-[10px] text-gray-500 [.light_&]:text-gray-400">{tmpl.description}</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-medium">{tmpl.estimatedDays}d</span>
                      <span className="text-[9px] text-gray-600">{tmpl.season}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: Selected Trip View =====
  return (
    <>
      {/* Trip Header */}
      <div className="flex-shrink-0 p-4 border-b border-dark-700/50 [.light_&]:border-gray-200">
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
              <button
                onClick={() => onSelectTrip(null)}
                className="p-1 text-gray-500 hover:text-orange-400 transition-colors"
                title="Back to My Trips"
              >
                <ChevronUp size={16} />
              </button>
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
              <button onClick={(e) => handleDuplicateTrip(selectedTrip.id, e)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Duplicate trip">
                <Copy size={14} />
              </button>
              <button onClick={(e) => handleDeleteTrip(selectedTrip.id, selectedTrip.name, e)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete trip">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Status badge + workflow button + dates */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${STATUS_STYLES[selectedTrip.status]} [.light_&]:hidden`}>
            {selectedTrip.status}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium hidden [.light_&]:inline ${STATUS_STYLES_LIGHT[selectedTrip.status]}`}>
            {selectedTrip.status}
          </span>
          {STATUS_TRANSITIONS[selectedTrip.status] && (
            <button
              onClick={() => onUpdateTrip(selectedTrip.id, { status: STATUS_TRANSITIONS[selectedTrip.status] as Trip['status'] })}
              className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors flex items-center gap-1"
            >
              <ArrowRight size={9} />
              {STATUS_TRANSITION_LABELS[selectedTrip.status]}
            </button>
          )}
          {selectedTrip.status === 'completed' && (
            <button
              onClick={() => onUpdateTrip(selectedTrip.id, { status: 'planning' })}
              className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
            >
              Replan
            </button>
          )}
          {(selectedTrip.start_date || selectedTrip.end_date) && (
            <span className="text-xs text-gray-500">
              {formatDate(selectedTrip.start_date)}
              {selectedTrip.start_date && selectedTrip.end_date && ' — '}
              {formatDate(selectedTrip.end_date)}
            </span>
          )}
        </div>

        {/* Trip progress/countdown */}
        {selectedTrip.start_date && (() => {
          const start = new Date(selectedTrip.start_date + 'T00:00:00');
          const endDate = totalNights > 0
            ? new Date(start.getTime() + totalNights * 86400000)
            : null;
          const now = new Date();
          const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / 86400000);

          if (daysUntilStart > 0) {
            return (
              <div className="mb-3 px-3 py-2 rounded-lg bg-dark-800/50 [.light_&]:bg-gray-50 border border-dark-700/30 [.light_&]:border-gray-200">
                <div className="text-xs text-gray-400 [.light_&]:text-gray-500">
                  <span className="font-semibold text-orange-400">{daysUntilStart}</span> day{daysUntilStart !== 1 ? 's' : ''} until departure
                </div>
              </div>
            );
          } else if (endDate && now <= endDate) {
            const totalDays = Math.max(1, totalNights);
            const elapsed = Math.ceil((now.getTime() - start.getTime()) / 86400000);
            const progress = Math.min(100, Math.round((elapsed / totalDays) * 100));
            return (
              <div className="mb-3 px-3 py-2 rounded-lg bg-dark-800/50 [.light_&]:bg-gray-50 border border-dark-700/30 [.light_&]:border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-400 [.light_&]:text-gray-500 mb-1.5">
                  <span>Trip in progress — Day {elapsed + 1}</span>
                  <span className="font-medium text-orange-400">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-dark-700 [.light_&]:bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          } else if (endDate && now > endDate) {
            return (
              <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xs text-green-400">Trip completed!</div>
              </div>
            );
          }
          return null;
        })()}

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
          {sortedStops.length > 0 && (
            <a
              href={`/api/trips/${selectedTrip.id}/export-gpx`}
              download
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-emerald-600 [.light_&]:hover:bg-emerald-50"
              title="Export trip as GPX file"
            >
              <Download size={11} />
              GPX
            </a>
          )}
          {sortedStops.length > 0 && (
            <a
              href={`/api/trips/${selectedTrip.id}/export-markdown`}
              download
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-cyan-600 [.light_&]:hover:bg-cyan-50"
              title="Export trip as Markdown document"
            >
              <Download size={11} />
              MD
            </a>
          )}
          {sortedStops.length > 0 && (
            <button
              onClick={handleShareTrip}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-purple-600 [.light_&]:hover:bg-purple-50"
              title="Copy trip summary to clipboard"
            >
              <Share2 size={11} />
              {shareCopied ? 'Copied!' : 'Share'}
            </button>
          )}
          {sortedStops.length > 0 && (
            <button
              onClick={() => {
                import('../../utils/printItinerary').then(({ printItinerary }) => {
                  printItinerary(selectedTrip, sortedStops);
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/50 text-xs text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-amber-600 [.light_&]:hover:bg-amber-50"
              title="Print trip itinerary"
            >
              Print
            </button>
          )}
        </div>
        {savedMiles !== null && savedMiles > 0 && (
          <div className="text-xs text-emerald-400 mt-1.5 animate-fade-in">Saved {savedMiles} miles!</div>
        )}
      </div>

      {/* ===== Stops List ===== */}
      <div className="flex-1 overflow-y-auto">
        {sortedStops.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <MapPin size={32} className="mx-auto mb-2 opacity-40" />
            <p>No stops yet.</p>
            <p className="text-xs mt-1">Add your first stop below.</p>
          </div>
        )}

        {sortedStops.length > 0 && (
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

                  const nearbyRidingCount = locations.filter(l => {
                    if (l.category !== 'riding') return false;
                    const R = 3959;
                    const dLat = (l.latitude - stop.latitude) * Math.PI / 180;
                    const dLng = (l.longitude - stop.longitude) * Math.PI / 180;
                    const a = Math.sin(dLat/2)**2 + Math.cos(stop.latitude*Math.PI/180)*Math.cos(l.latitude*Math.PI/180)*Math.sin(dLng/2)**2;
                    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return dist <= 20;
                  }).length;

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
                      nearbyRidingCount={nearbyRidingCount}
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
      </div>

      {/* ===== Trip Journal ===== */}
      <div className="flex-shrink-0 border-t border-dark-700/50 [.light_&]:border-gray-200">
        <button
          onClick={() => {
            if (!journalOpen) handleJournalOpen();
            else setJournalOpen(false);
          }}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 [.light_&]:text-gray-600 hover:text-gray-200 [.light_&]:hover:text-gray-800 transition-colors"
        >
          <span className="font-medium">Trip Journal</span>
          <div className="flex items-center gap-2">
            {journalEntries.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 [.light_&]:bg-orange-100 [.light_&]:text-orange-600 font-medium">
                {journalEntries.length}
              </span>
            )}
            {journalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </button>

        {journalOpen && (
          <div className="px-4 pb-4 animate-fade-in space-y-3">
            {/* Add entry form */}
            <div className="space-y-2">
              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Write a journal entry..."
                rows={3}
                className="w-full bg-dark-800 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="bg-dark-800 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-400 [.light_&]:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors w-[130px]"
                />
                <select
                  value={journalStopId ?? ''}
                  onChange={(e) => setJournalStopId(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 bg-dark-800 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-400 [.light_&]:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">General</option>
                  {sortedStops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.location_name || `Stop ${s.sort_order + 1}`}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddJournalEntry}
                  disabled={!journalContent.trim() || journalSubmitting}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-orange-500/20 text-orange-400 border border-orange-500/30
                    hover:bg-orange-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                    [.light_&]:bg-orange-100 [.light_&]:text-orange-600 [.light_&]:border-orange-200 [.light_&]:hover:bg-orange-200"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
            </div>

            {/* Timeline entry list grouped by date */}
            {journalEntries.length === 0 ? (
              <p className="text-xs text-gray-600 [.light_&]:text-gray-400 italic text-center py-3">
                No journal entries yet. Start documenting your trip!
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-3">
                {journalByDate.map(([date, entries]) => (
                  <div key={date}>
                    {/* Date header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                        {formatDate(date)}
                      </span>
                      <div className="flex-1 h-px bg-dark-700/50 [.light_&]:bg-gray-200" />
                    </div>

                    <div className="space-y-1.5 ml-3 border-l border-dark-700/30 [.light_&]:border-gray-200 pl-3">
                      {entries.map((entry) => (
                        <div key={entry.id} className="bg-dark-800 [.light_&]:bg-gray-50 border border-dark-700/50 [.light_&]:border-gray-200 rounded-lg px-3 py-2 group">
                          {editingEntryId === entry.id ? (
                            /* Editing mode */
                            <div className="space-y-2">
                              <textarea
                                value={editingEntryContent}
                                onChange={(e) => setEditingEntryContent(e.target.value)}
                                rows={3}
                                className="w-full bg-dark-900 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-300 [.light_&]:text-gray-700 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={editingEntryDate}
                                  onChange={(e) => setEditingEntryDate(e.target.value)}
                                  className="bg-dark-900 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-[10px] text-gray-400 focus:outline-none focus:border-orange-500 w-[120px]"
                                />
                                <select
                                  value={editingEntryStopId ?? ''}
                                  onChange={(e) => setEditingEntryStopId(e.target.value ? Number(e.target.value) : null)}
                                  className="flex-1 bg-dark-900 [.light_&]:bg-white border border-dark-700/50 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-[10px] text-gray-400 focus:outline-none focus:border-orange-500"
                                >
                                  <option value="">General</option>
                                  {sortedStops.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name || s.location_name || `Stop ${s.sort_order + 1}`}</option>
                                  ))}
                                </select>
                                <button onClick={handleSaveEditEntry} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"><Check size={12} /></button>
                                <button onClick={() => setEditingEntryId(null)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors"><X size={12} /></button>
                              </div>
                            </div>
                          ) : (
                            /* View mode */
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {entry.stop_name && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 [.light_&]:bg-gray-200 text-gray-400 [.light_&]:text-gray-600 truncate max-w-[120px]">
                                      <MapPin size={8} className="inline mr-0.5 -mt-0.5" />
                                      {entry.stop_name}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-600">
                                    {new Date(entry.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300 [.light_&]:text-gray-700 whitespace-pre-wrap break-words">{entry.content}</p>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => handleStartEditEntry(entry)}
                                  className="p-0.5 text-gray-600 hover:text-blue-400 transition-colors"
                                  title="Edit entry"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() => handleDeleteJournalEntry(entry.id)}
                                  className="p-0.5 text-gray-600 hover:text-red-400 transition-colors"
                                  title="Delete entry"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
