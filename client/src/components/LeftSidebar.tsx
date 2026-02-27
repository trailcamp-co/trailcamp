import { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Clock,
  Route,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
  Check,
  Navigation,
} from 'lucide-react';
import type { Trip, TripStop, Location } from '../types';

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
}

const STATUS_STYLES: Record<string, string> = {
  planning:
    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  active:
    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  completed:
    'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const STATUS_STYLES_LIGHT: Record<string, string> = {
  planning:
    'bg-blue-100 text-blue-700 border border-blue-200',
  active:
    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  completed:
    'bg-gray-100 text-gray-600 border border-gray-200',
};

function formatDriveTime(mins: number | null): string {
  if (mins == null) return '';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDistance(miles: number | null): string {
  if (miles == null) return '';
  return `${Math.round(miles)} mi`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
}: LeftSidebarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [expandedStopId, setExpandedStopId] = useState<number | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalValue, setJournalValue] = useState('');
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showAddStop, setShowAddStop] = useState(false);
  const [addStopSearch, setAddStopSearch] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dragItemRef = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sort stops by sort_order
  const sortedStops = [...stops].sort((a, b) => a.sort_order - b.sort_order);

  // ---------- Trip name editing ----------
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

  // ---------- Drag and drop ----------
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
    setDragOverIndex(null);
    dragItemRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);

      const dragIndex = dragItemRef.current;
      if (dragIndex === null || dragIndex === dropIndex) return;

      const reordered = [...sortedStops];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      onReorderStops(reordered.map((s) => s.id));
      dragItemRef.current = null;
    },
    [sortedStops, onReorderStops],
  );

  // ---------- Add stop ----------
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

  // ---------- Journal ----------
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

  // ---------- Create new trip ----------
  const handleCreateTrip = useCallback(async () => {
    const trip = await onCreateTrip({
      name: 'New Trip',
      status: 'planning',
    });
    onSelectTrip(trip);
  }, [onCreateTrip, onSelectTrip]);

  // ---------- Delete trip ----------
  const handleDeleteTrip = useCallback(async () => {
    if (!selectedTrip) return;
    if (!window.confirm(`Delete "${selectedTrip.name}"? This cannot be undone.`)) return;
    await onDeleteTrip(selectedTrip.id);
  }, [selectedTrip, onDeleteTrip]);

  // ---------- Stats ----------
  const totalNights = sortedStops.reduce((sum, s) => sum + (s.nights ?? 0), 0);
  const totalDistance = sortedStops.reduce((sum, s) => sum + (s.drive_distance_miles ?? 0), 0);

  // ---------- Render ----------
  return (
    <div className="w-80 h-full flex flex-col bg-dark-900 dark:bg-dark-900 border-r border-gray-700 dark:border-gray-700 light:bg-gray-50 light:border-gray-200 overflow-hidden
      [.light_&]:bg-gray-50 [.light_&]:border-gray-200">

      {/* ===== Trip Header ===== */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700/50 [.light_&]:border-gray-200">
        {/* Trip selector toggle */}
        <button
          onClick={() => setShowTripSelector(!showTripSelector)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 mb-2 transition-colors"
        >
          {showTripSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <span>Switch Trip</span>
        </button>

        {/* Trip selector dropdown */}
        {showTripSelector && (
          <div className="mb-3 bg-dark-800 [.light_&]:bg-white rounded-lg border border-gray-700 [.light_&]:border-gray-200 overflow-hidden">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  onSelectTrip(trip);
                  setShowTripSelector(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-dark-700 [.light_&]:hover:bg-gray-100 ${
                  selectedTrip?.id === trip.id
                    ? 'text-orange-400 bg-dark-700/50 [.light_&]:bg-orange-50 [.light_&]:text-orange-600'
                    : 'text-gray-300 [.light_&]:text-gray-700'
                }`}
              >
                {trip.name}
              </button>
            ))}
          </div>
        )}

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
                  <button
                    onClick={saveName}
                    className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEditName}
                    className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                  >
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
                  <button
                    onClick={startEditName}
                    className="p-1 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
                    title="Edit name"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={handleDeleteTrip}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete trip"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Status badge + dates */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  STATUS_STYLES[selectedTrip.status]
                } [.light_&]:hidden`}
              >
                {selectedTrip.status}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize hidden [.light_&]:inline ${
                  STATUS_STYLES_LIGHT[selectedTrip.status]
                }`}
              >
                {selectedTrip.status}
              </span>
              {(selectedTrip.start_date || selectedTrip.end_date) && (
                <span className="text-xs text-gray-500">
                  {formatDate(selectedTrip.start_date)}
                  {selectedTrip.start_date && selectedTrip.end_date && ' - '}
                  {formatDate(selectedTrip.end_date)}
                </span>
              )}
            </div>

            {/* Trip stats */}
            <div className="flex items-center gap-4 text-xs text-gray-400 [.light_&]:text-gray-500">
              <div className="flex items-center gap-1" title="Total stops">
                <MapPin size={12} className="text-orange-400" />
                <span>{sortedStops.length} stops</span>
              </div>
              <div className="flex items-center gap-1" title="Total nights">
                <Clock size={12} className="text-orange-400" />
                <span>{totalNights} nights</span>
              </div>
              <div className="flex items-center gap-1" title="Total distance">
                <Route size={12} className="text-orange-400" />
                <span>{formatDistance(totalDistance) || '0 mi'}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">No trip selected</p>
        )}

        {/* Create new trip */}
        <button
          onClick={handleCreateTrip}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            bg-orange-500/10 text-orange-400 border border-orange-500/20
            hover:bg-orange-500/20 hover:border-orange-500/30 transition-all
            [.light_&]:bg-orange-50 [.light_&]:text-orange-600 [.light_&]:border-orange-200 [.light_&]:hover:bg-orange-100"
        >
          <Plus size={16} />
          Create New Trip
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

        {sortedStops.map((stop, index) => {
          const isExpanded = expandedStopId === stop.id;
          const stopName = stop.name || stop.location_name || 'Unnamed Stop';

          return (
            <div key={stop.id}>
              {/* Drive time connector (between stops) */}
              {index > 0 && (stop.drive_time_mins || stop.drive_distance_miles) && (
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <div className="w-6 flex justify-center">
                    <div className="w-px h-4 bg-gray-700 [.light_&]:bg-gray-300" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Navigation size={10} className="text-orange-400/60" />
                    <span>
                      {formatDriveTime(stop.drive_time_mins)}
                      {stop.drive_time_mins && stop.drive_distance_miles && ' | '}
                      {formatDistance(stop.drive_distance_miles)}
                    </span>
                  </div>
                </div>
              )}

              {/* Stop card */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`group mx-2 mb-1 rounded-lg transition-all duration-150 cursor-pointer
                  bg-dark-800 [.light_&]:bg-white
                  border border-transparent
                  hover:border-gray-600 [.light_&]:hover:border-gray-300
                  ${dragOverIndex === index ? 'border-orange-500 bg-orange-500/5' : ''}
                `}
              >
                <div
                  className="flex items-start gap-2 p-3"
                  onClick={() => onFlyTo(stop.longitude, stop.latitude)}
                >
                  {/* Drag handle */}
                  <div
                    className="drag-handle mt-0.5 text-gray-600 hover:text-gray-400 [.light_&]:text-gray-400 [.light_&]:hover:text-gray-600 transition-colors"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={16} />
                  </div>

                  {/* Stop number */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>

                  {/* Stop info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate">
                        {stopName}
                      </span>
                      {/* Delete button (visible on hover) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStop(stop.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                        title="Remove stop"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Nights */}
                    {stop.nights != null && stop.nights > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock size={10} />
                        <span>
                          {stop.nights} night{stop.nights !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Category badge */}
                    {stop.location_category && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400 [.light_&]:bg-gray-100 [.light_&]:text-gray-500 capitalize">
                        {stop.location_category}
                      </span>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStopId(isExpanded ? null : stop.id);
                    }}
                    className="mt-0.5 p-1 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded section: notes */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-700/50 [.light_&]:border-gray-200 mx-3 mt-0">
                    <div className="pt-2">
                      <label className="text-[11px] uppercase tracking-wider text-gray-500 mb-1 block">
                        Notes
                      </label>
                      <textarea
                        value={stop.notes ?? ''}
                        onChange={(e) =>
                          onUpdateStop(stop.id, { notes: e.target.value })
                        }
                        placeholder="Add notes for this stop..."
                        rows={3}
                        className="w-full bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1.5 text-xs text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-[11px] text-gray-500">Nights:</label>
                        <input
                          type="number"
                          min={0}
                          value={stop.nights ?? 0}
                          onChange={(e) =>
                            onUpdateStop(stop.id, {
                              nights: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-16 bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Stop button */}
        {selectedTrip && (
          <div className="p-3">
            {showAddStop ? (
              <div className="bg-dark-800 [.light_&]:bg-white rounded-lg border border-gray-700 [.light_&]:border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 [.light_&]:text-gray-600 uppercase tracking-wider">
                    Add a Stop
                  </span>
                  <button
                    onClick={() => {
                      setShowAddStop(false);
                      setAddStopSearch('');
                    }}
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
                    <p className="text-xs text-gray-500 text-center py-2">
                      No locations found.
                    </p>
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm
                  border border-dashed border-gray-700 [.light_&]:border-gray-300
                  text-gray-500 hover:text-orange-400 hover:border-orange-500/40
                  [.light_&]:text-gray-400 [.light_&]:hover:text-orange-500 [.light_&]:hover:border-orange-300
                  transition-all"
              >
                <Plus size={16} />
                Add Stop
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== Trip Journal ===== */}
      {selectedTrip && (
        <div className="flex-shrink-0 border-t border-gray-700/50 [.light_&]:border-gray-200">
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
            <div className="px-4 pb-4">
              <textarea
                value={journalValue}
                onChange={(e) => setJournalValue(e.target.value)}
                onBlur={handleJournalBlur}
                placeholder="Write your trip notes, memories, and journal entries here..."
                rows={6}
                className="w-full bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">Auto-saves on blur</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
