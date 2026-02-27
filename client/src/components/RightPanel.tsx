import { useState, useCallback } from 'react';
import {
  X,
  Star,
  Navigation,
  MapPin,
  Mountain,
  Droplets,
  Fuel,
  ShoppingCart,
  Camera,
  Trash2,
  Plus,
  ExternalLink,
  Check,
  Bookmark,
  BookmarkCheck,
  Edit3,
  Clock,
  Signal,
  Trees,
  Ruler,
} from 'lucide-react';
import type { Location } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';

interface RightPanelProps {
  location: Location;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Location>) => Promise<Location>;
  onDelete: (id: number) => Promise<void>;
  onAddToTrip: (location: Location) => Promise<void>;
  hasActiveTrip: boolean;
  darkMode: boolean;
}

const CATEGORY_LUCIDE_ICONS: Record<string, React.ReactNode> = {
  campsite: <Trees className="w-4 h-4" />,
  riding: <Mountain className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
  dump: <MapPin className="w-4 h-4" />,
  gas: <Fuel className="w-4 h-4" />,
  grocery: <ShoppingCart className="w-4 h-4" />,
  scenic: <Camera className="w-4 h-4" />,
  laundromat: <Droplets className="w-4 h-4" />,
};

function DetailBadge({
  label,
  value,
  darkMode,
}: {
  label: string;
  value: string | number;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        darkMode ? 'bg-dark-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <div className={`text-xs font-medium mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

export default function RightPanel({
  location,
  onClose,
  onUpdate,
  onDelete,
  onAddToTrip,
  hasActiveTrip,
  darkMode,
}: RightPanelProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [editingNotes, setEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState(location.user_notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState(false);

  const categoryColor = CATEGORY_COLORS[location.category];

  const handleRating = useCallback(
    async (rating: number) => {
      await onUpdate(location.id, {
        user_rating: location.user_rating === rating ? null : rating,
      });
    },
    [location.id, location.user_rating, onUpdate]
  );

  const handleToggleWantToVisit = useCallback(async () => {
    await onUpdate(location.id, {
      want_to_visit: location.want_to_visit ? 0 : 1,
    });
  }, [location.id, location.want_to_visit, onUpdate]);

  const handleToggleVisited = useCallback(async () => {
    await onUpdate(location.id, {
      visited: location.visited ? 0 : 1,
      visited_date: location.visited ? null : new Date().toISOString().split('T')[0],
    });
  }, [location.id, location.visited, onUpdate]);

  const handleSaveNotes = useCallback(async () => {
    await onUpdate(location.id, { user_notes: userNotes || null });
    setEditingNotes(false);
  }, [location.id, userNotes, onUpdate]);

  const handleNavigate = useCallback(() => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  }, [location.latitude, location.longitude]);

  const handleAddToTrip = useCallback(async () => {
    setAddingToTrip(true);
    try {
      await onAddToTrip(location);
    } finally {
      setAddingToTrip(false);
    }
  }, [location, onAddToTrip]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await onDelete(location.id);
    onClose();
  }, [confirmDelete, location.id, onDelete, onClose]);

  const handleCopyCoords = useCallback(async () => {
    await navigator.clipboard.writeText(`${location.latitude}, ${location.longitude}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  }, [location.latitude, location.longitude]);

  const parseExternalLinks = (): { label: string; url: string }[] => {
    if (!location.external_links) return [];
    try {
      const parsed = JSON.parse(location.external_links);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // If it's a plain URL string
      return [{ label: 'Link', url: location.external_links }];
    }
  };

  const renderCampsiteDetails = () => (
    <div className="grid grid-cols-2 gap-2">
      {location.cell_signal && (
        <DetailBadge label="Cell Signal" value={location.cell_signal} darkMode={darkMode} />
      )}
      {location.shade !== null && location.shade !== undefined && (
        <DetailBadge
          label="Shade"
          value={location.shade ? 'Yes' : 'No'}
          darkMode={darkMode}
        />
      )}
      {location.level_ground !== null && location.level_ground !== undefined && (
        <DetailBadge
          label="Level Ground"
          value={location.level_ground ? 'Yes' : 'No'}
          darkMode={darkMode}
        />
      )}
      {location.water_nearby !== null && location.water_nearby !== undefined && (
        <DetailBadge
          label="Water Nearby"
          value={location.water_nearby ? 'Yes' : 'No'}
          darkMode={darkMode}
        />
      )}
      {location.dump_nearby !== null && location.dump_nearby !== undefined && (
        <DetailBadge
          label="Dump Nearby"
          value={location.dump_nearby ? 'Yes' : 'No'}
          darkMode={darkMode}
        />
      )}
      {location.max_vehicle_length !== null && location.max_vehicle_length !== undefined && (
        <DetailBadge
          label="Max Vehicle Length"
          value={`${location.max_vehicle_length} ft`}
          darkMode={darkMode}
        />
      )}
      {location.stay_limit_days !== null && location.stay_limit_days !== undefined && (
        <DetailBadge
          label="Stay Limit"
          value={`${location.stay_limit_days} days`}
          darkMode={darkMode}
        />
      )}
      {location.season && (
        <DetailBadge label="Season" value={location.season} darkMode={darkMode} />
      )}
      {location.crowding && (
        <DetailBadge label="Crowding" value={location.crowding} darkMode={darkMode} />
      )}
    </div>
  );

  const renderRidingDetails = () => {
    const diffColor = location.difficulty ? DIFFICULTY_COLORS[location.difficulty] || '#6b7280' : '';
    return (
      <div className="space-y-3">
        {/* Difficulty + Stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          {location.difficulty && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: diffColor + '22', color: diffColor }}
            >
              {location.difficulty}
            </span>
          )}
          {location.distance_miles !== null && location.distance_miles !== undefined && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${darkMode ? 'bg-dark-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              📏 {location.distance_miles} mi
            </span>
          )}
          {location.elevation_gain_ft !== null && location.elevation_gain_ft !== undefined && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${darkMode ? 'bg-dark-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              ⛰️ {location.elevation_gain_ft.toLocaleString()} ft
            </span>
          )}
        </div>

        {/* Trail Type Chips */}
        {location.trail_types && (
          <div>
            <div className={`text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Trail Types
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parseTrailTypes(location.trail_types).map((tt) => {
                const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
                return (
                  <span
                    key={tt}
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {tt}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Permit info */}
        <div className="grid grid-cols-2 gap-2">
          {location.permit_required !== null && location.permit_required !== undefined && (
            <DetailBadge
              label="Permit Required"
              value={location.permit_required ? 'Yes' : 'No'}
              darkMode={darkMode}
            />
          )}
          {location.best_season && (
            <DetailBadge label="Best Season" value={location.best_season} darkMode={darkMode} />
          )}
        </div>
        {location.permit_info && (
          <DetailBadge label="Permit Info" value={location.permit_info} darkMode={darkMode} />
        )}
      </div>
    );
  };

  const renderServiceDetails = () => (
    <div className="grid grid-cols-2 gap-2">
      {location.hours && (
        <DetailBadge label="Hours" value={location.hours} darkMode={darkMode} />
      )}
      {location.sub_type && (
        <DetailBadge label="Type" value={location.sub_type} darkMode={darkMode} />
      )}
    </div>
  );

  const renderDetailsGrid = () => {
    switch (location.category) {
      case 'campsite':
        return renderCampsiteDetails();
      case 'riding':
        return renderRidingDetails();
      case 'gas':
      case 'grocery':
      case 'laundromat':
        return renderServiceDetails();
      default:
        return renderServiceDetails();
    }
  };

  const hasDetails = () => {
    if (location.category === 'campsite') {
      return !!(
        location.cell_signal ||
        location.shade !== null ||
        location.level_ground !== null ||
        location.water_nearby !== null ||
        location.dump_nearby !== null ||
        location.max_vehicle_length !== null ||
        location.stay_limit_days !== null ||
        location.season ||
        location.crowding
      );
    }
    if (location.category === 'riding') {
      return !!(
        location.difficulty ||
        location.distance_miles !== null ||
        location.elevation_gain_ft !== null ||
        location.trail_types ||
        location.permit_required !== null
      );
    }
    return !!(location.hours || location.sub_type);
  };

  const externalLinks = parseExternalLinks();

  return (
    <div
      className={`w-[400px] h-full flex flex-col shadow-xl ${
        darkMode
          ? 'bg-dark-900 border-l border-gray-700 text-gray-100'
          : 'bg-white border-l border-gray-200 text-gray-900'
      }`}
    >
      {/* Header */}
      <div className={`flex-shrink-0 p-5 pb-4 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border badge-${location.category}`}
              >
                {CATEGORY_LUCIDE_ICONS[location.category]}
                {CATEGORY_LABELS[location.category]}
              </span>
              {location.source && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-dark-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {location.source}
                </span>
              )}
            </div>
            <h2
              className={`text-xl font-bold leading-tight ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {location.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-dark-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Actions */}
        <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
          {/* Navigate Button */}
          <button
            onClick={handleNavigate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-orange-500/20 mb-3"
          >
            <Navigation className="w-4 h-4" />
            Navigate Here
          </button>

          <div className="flex items-center gap-2">
            {/* Add to Trip */}
            {hasActiveTrip && (
              <button
                onClick={handleAddToTrip}
                disabled={addingToTrip}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-dark-700 hover:bg-dark-600 text-gray-200 border border-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                } disabled:opacity-50`}
              >
                <Plus className="w-3.5 h-3.5" />
                {addingToTrip ? 'Adding...' : 'Add to Trip'}
              </button>
            )}

            {/* Want to Visit */}
            <button
              onClick={handleToggleWantToVisit}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.want_to_visit
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : darkMode
                  ? 'bg-dark-700 hover:bg-dark-600 text-gray-400 border border-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'
              }`}
              title={location.want_to_visit ? 'Remove from wishlist' : 'Want to visit'}
            >
              {location.want_to_visit ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Visited */}
            <button
              onClick={handleToggleVisited}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.visited
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : darkMode
                  ? 'bg-dark-700 hover:bg-dark-600 text-gray-400 border border-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'
              }`}
              title={location.visited ? 'Mark as not visited' : 'Mark as visited'}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Star Rating */}
        <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
          <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Your Rating
          </div>
          <div className="flex items-center gap-1 star-rating">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled =
                hoverRating > 0 ? star <= hoverRating : star <= (location.user_rating ?? 0);
              return (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      filled
                        ? 'fill-yellow-400 text-yellow-400'
                        : darkMode
                        ? 'text-gray-600 hover:text-yellow-400/50'
                        : 'text-gray-300 hover:text-yellow-400/50'
                    }`}
                  />
                </button>
              );
            })}
            {location.user_rating && (
              <span className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {location.user_rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        {hasDetails() && (
          <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
            <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Details
            </div>
            {renderDetailsGrid()}
          </div>
        )}

        {/* Description */}
        {location.description && (
          <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
            <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Description
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {location.description}
            </p>
          </div>
        )}

        {/* Notes Section */}
        <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
          {/* Location Notes */}
          {location.notes && (
            <div className="mb-4">
              <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Location Notes
              </div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {location.notes}
              </p>
            </div>
          )}

          {/* User Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Your Notes
              </div>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className={`p-1 rounded transition-colors ${
                    darkMode ? 'hover:bg-dark-700 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  rows={4}
                  placeholder="Add your personal notes..."
                  className={`w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    darkMode
                      ? 'bg-dark-800 border border-gray-600 text-gray-200 placeholder-gray-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setUserNotes(location.user_notes ?? '');
                      setEditingNotes(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                className={`text-sm leading-relaxed cursor-pointer ${
                  userNotes
                    ? darkMode
                      ? 'text-gray-300'
                      : 'text-gray-600'
                    : darkMode
                    ? 'text-gray-600 italic'
                    : 'text-gray-400 italic'
                }`}
                onClick={() => setEditingNotes(true)}
              >
                {userNotes || 'Click to add notes...'}
              </p>
            )}
          </div>

          {/* Visited Date */}
          {location.visited && location.visited_date && (
            <div className="mt-3 flex items-center gap-2">
              <Clock className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Visited {location.visited_date}
              </span>
            </div>
          )}
        </div>

        {/* Scenery Rating */}
        {location.scenery_rating !== null && location.scenery_rating !== undefined && (
          <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
            <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Scenery Rating
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <Mountain
                  key={level}
                  className={`w-5 h-5 ${
                    level <= location.scenery_rating!
                      ? 'text-green-400'
                      : darkMode
                      ? 'text-gray-700'
                      : 'text-gray-200'
                  }`}
                />
              ))}
              <span className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {location.scenery_rating}/5
              </span>
            </div>
          </div>
        )}

        {/* External Links */}
        {externalLinks.length > 0 && (
          <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
            <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Links
            </div>
            <div className="flex flex-col gap-2">
              {externalLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* GPS Coordinates */}
        <div className={`p-5 ${darkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}`}>
          <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            GPS Coordinates
          </div>
          <button
            onClick={handleCopyCoords}
            className={`flex items-center gap-2 text-sm font-mono transition-colors group ${
              darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </span>
            {copiedCoords ? (
              <span className="text-xs text-green-400 font-sans">Copied!</span>
            ) : (
              <span
                className={`text-xs font-sans opacity-0 group-hover:opacity-100 transition-opacity ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                Click to copy
              </span>
            )}
          </button>
        </div>

        {/* Delete Section */}
        <div className="p-5">
          {confirmDelete ? (
            <div
              className={`rounded-lg p-4 ${
                darkMode ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className={`text-sm mb-3 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                Are you sure you want to delete this location? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-gray-500 hover:text-red-400'
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete Location
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
