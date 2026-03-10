import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  Heart,
  Check,
  Plus,
  Star,
  MapPin,
  Trees,
  Mountain,
  Droplets,
  Fuel,
  ShoppingCart,
  Camera,
  Edit3,
  ExternalLink,
  Bike,
} from 'lucide-react';
import type { Location } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';
import type { SnapPoint } from './BottomSheet';
import ReviewsSection from './ReviewsSection';
import PhotosSection from './PhotosSection';
import ConditionsSection from './ConditionsSection';
import type { UserLocationData } from '../hooks/useUserData';
import { getExternalUrl } from '../utils/getExternalUrl';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import ErrorState from './ErrorState';

const CATEGORY_LUCIDE_ICONS: Record<string, React.ReactNode> = {
  campsite: <Trees className="w-3.5 h-3.5" />,
  riding: <Mountain className="w-3.5 h-3.5" />,
  water: <Droplets className="w-3.5 h-3.5" />,
  dump: <MapPin className="w-3.5 h-3.5" />,
  gas: <Fuel className="w-3.5 h-3.5" />,
  grocery: <ShoppingCart className="w-3.5 h-3.5" />,
  scenic: <Camera className="w-3.5 h-3.5" />,
  laundromat: <Droplets className="w-3.5 h-3.5" />,
};

interface MobileLocationDetailProps {
  location: Location;
  snapPoint: SnapPoint;
  onAddToTrip: (location: Location) => Promise<void>;
  hasActiveTrip: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  getUserData?: (locationId: number) => UserLocationData;
  onUpdateUserData?: (locationId: number, updates: Partial<UserLocationData>) => Promise<UserLocationData | null>;
  isFavorited?: (locationId: number) => boolean;
  onToggleFavorite?: (locationId: number) => Promise<boolean>;
  homeLat?: number | null;
  homeLon?: number | null;
  allLocations?: Location[];
  onFlyTo?: (lng: number, lat: number) => void;
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-dark-800 text-gray-300 border border-dark-700/50">
      {children}
    </span>
  );
}

export default function MobileLocationDetail({
  location,
  snapPoint,
  onAddToTrip,
  hasActiveTrip,
  showToast,
  getUserData,
  onUpdateUserData,
  isFavorited: isFavoritedFn,
  onToggleFavorite,
  homeLat,
  homeLon,
  allLocations,
  onFlyTo,
}: MobileLocationDetailProps) {
  const userData = getUserData?.(location.id);
  const favorited = isFavoritedFn?.(location.id) ?? false;
  const effectiveVisited = userData?.visited ?? 0;
  const [addingToTrip, setAddingToTrip] = useState(false);
  const [heartKey, setHeartKey] = useState(0);
  const [editingNotes, setEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState(userData?.user_notes ?? location.user_notes ?? '');

  useEffect(() => {
    setUserNotes(userData?.user_notes ?? location.user_notes ?? '');
    setEditingNotes(false);
  }, [location.id, userData?.user_notes, location.user_notes]);

  const handleNavigate = useCallback(() => {
    hapticMedium();
    // Try native map links on mobile
    const dest = `${location.latitude},${location.longitude}`;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${dest}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
    }
  }, [location.latitude, location.longitude]);

  const handleToggleFavorite = useCallback(async () => {
    hapticLight();
    setHeartKey(k => k + 1);
    const newState = await onToggleFavorite?.(location.id);
    if (newState) {
      showToast?.('Added to favorites', 'success');
    } else {
      showToast?.('Removed from favorites', 'info');
    }
  }, [location.id, onToggleFavorite, showToast]);

  const handleToggleVisited = useCallback(async () => {
    hapticLight();
    await onUpdateUserData?.(location.id, {
      visited: effectiveVisited ? 0 : 1,
      visited_date: effectiveVisited ? null : new Date().toISOString().split('T')[0],
    });
  }, [location.id, effectiveVisited, onUpdateUserData]);

  const handleAddToTrip = useCallback(async () => {
    setAddingToTrip(true);
    try {
      await onAddToTrip(location);
      hapticSuccess();
      showToast?.('Added to trip!', 'success');
    } catch {
      showToast?.('Failed to add to trip', 'error');
    } finally {
      setAddingToTrip(false);
    }
  }, [location, onAddToTrip, showToast]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}?loc=${location.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: location.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast?.('Link copied!', 'success');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        showToast?.('Link copied!', 'success');
      } catch {}
    }
  }, [location.id, location.name, showToast]);

  const handleSaveNotes = useCallback(async () => {
    await onUpdateUserData?.(location.id, { user_notes: userNotes || null });
    setEditingNotes(false);
  }, [location.id, userNotes, onUpdateUserData]);

  // Distance from home
  const distFromHome = homeLat != null && homeLon != null ? (() => {
    const R = 3959;
    const dLat = (location.latitude - homeLat) * Math.PI / 180;
    const dLng = (location.longitude - homeLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(homeLat * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  })() : null;

  // Nearby locations: campsites show nearby riding, riding shows nearby campsites
  const nearbyLocations = useMemo(() => {
    if (!allLocations || allLocations.length === 0) return [];
    const targetCategory = location.category === 'campsite' ? 'riding' : location.category === 'riding' ? 'campsite' : null;
    if (!targetCategory) return [];
    const R = 3959;
    return allLocations
      .filter(l => l.category === targetCategory)
      .map(l => {
        const dLat = (l.latitude - location.latitude) * Math.PI / 180;
        const dLng = (l.longitude - location.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(location.latitude * Math.PI / 180) * Math.cos(l.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...l, _distance: Math.round(dist) };
      })
      .filter(l => l._distance <= 20)
      .sort((a, b) => a._distance - b._distance)
      .slice(0, 3);
  }, [allLocations, location.id, location.category, location.latitude, location.longitude]);

  const showExpanded = snapPoint === 'half' || snapPoint === 'full';
  const showFull = snapPoint === 'full';

  if (!location?.id) {
    return <ErrorState message="Failed to load location data" />;
  }

  return (
    <div className="px-4 pb-4">
      {/* ===== PEEK: Always visible ===== */}
      {/* Name + Category */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{CATEGORY_ICONS[location.category] || '📍'}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white leading-tight truncate">{location.name}</h2>
          {(location.city || location.state) && (
            <p className="text-[11px] text-gray-500 mt-0.5">{[location.city, location.state].filter(Boolean).join(', ')}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: CATEGORY_COLORS[location.category] + '22', color: CATEGORY_COLORS[location.category] }}>
              {CATEGORY_LUCIDE_ICONS[location.category]}
              {CATEGORY_LABELS[location.category]}
            </span>
            {location.source && (
              <span className="text-[11px] text-gray-500">{location.source}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick info pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {location.cost_per_night !== null && location.cost_per_night !== undefined && (
          <InfoPill>{location.cost_per_night === 0 ? '🆓 Free' : `💰 $${location.cost_per_night}/night`}</InfoPill>
        )}
        {location.difficulty && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: (DIFFICULTY_COLORS[location.difficulty] || '#6b7280') + '22', color: DIFFICULTY_COLORS[location.difficulty] || '#6b7280' }}>
            {location.difficulty}
          </span>
        )}
        {location.water_available !== null && location.water_available !== undefined && (
          <InfoPill>{location.water_available ? '💧 Water' : '🚫 No Water'}</InfoPill>
        )}
        {location.dump_nearby !== null && location.dump_nearby !== undefined && location.dump_nearby ? (
          <InfoPill>🚽 Dump Nearby</InfoPill>
        ) : null}
        {location.hours && <InfoPill>🕐 {location.hours}</InfoPill>}
        {location.distance_miles != null && <InfoPill>📏 {location.distance_miles} mi</InfoPill>}
        {location.elevation_gain_ft != null && <InfoPill>⛰️ {location.elevation_gain_ft.toLocaleString()} ft</InfoPill>}
        {distFromHome != null && <InfoPill>🏠 {distFromHome} mi</InfoPill>}
        {location.sub_type && !['campground', 'boondocking', 'parking', 'Trail'].includes(location.sub_type) && (
          <InfoPill>{location.sub_type}</InfoPill>
        )}
        {location.permit_required != null && location.permit_required !== 0 && (
          <InfoPill>📋 Permit Req.</InfoPill>
        )}
        {location.best_season && <InfoPill>📅 {location.best_season}</InfoPill>}
      </div>

      {/* ===== HALF+: Expanded content ===== */}
      {showExpanded && (
        <>
          {/* Quick action buttons */}
          <div className="flex gap-2 mb-4">
            <button onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-orange-500/20 press-scale">
              <Navigation className="w-4 h-4" />Navigate
            </button>
            {hasActiveTrip && (
              <button onClick={handleAddToTrip} disabled={addingToTrip}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-200 font-medium text-sm border border-dark-700/50 transition-colors press-scale disabled:opacity-50">
                <Plus className="w-4 h-4" />{addingToTrip ? 'Adding...' : 'Add to Trip'}
              </button>
            )}
          </div>

          {/* Action row: Favorite, Visited, Share */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={handleToggleFavorite}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors press-scale ${
                favorited ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-800 hover:bg-dark-700 text-gray-400 border border-dark-700/50'
              }`}>
              <Heart key={heartKey} className={`w-3.5 h-3.5 ${favorited ? 'fill-red-400' : ''}`} />
              {favorited ? 'Saved' : 'Favorite'}
            </button>
            <button onClick={handleToggleVisited}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors press-scale ${
                effectiveVisited ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-800 hover:bg-dark-700 text-gray-400 border border-dark-700/50'
              }`}>
              <Check className="w-3.5 h-3.5" />
              {effectiveVisited ? 'Visited' : 'Mark Visited'}
            </button>
            <button onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-dark-800 hover:bg-dark-700 text-gray-400 border border-dark-700/50 transition-colors press-scale">
              📤 Share
            </button>
          </div>

          {/* External link (visible at half+) */}
          {(() => {
            const generated = getExternalUrl(location);
            if (!generated) return null;
            return (
              <a href={generated.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700/50 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />{generated.label}
              </a>
            );
          })()}

          {/* Condition reports — urgent info shown first */}
          <ConditionsSection locationId={location.id} category={location.category} showToast={showToast} />

          {/* Photos */}
          <PhotosSection locationId={location.id} showToast={showToast} />

          {/* Description (truncated at HALF, full at FULL) */}
          {location.description && (
            <div className="mb-4">
              <p className={`text-sm text-gray-300 leading-relaxed ${!showFull ? 'line-clamp-3' : ''}`}>
                {location.description}
              </p>
            </div>
          )}

          {/* Nearby section */}
          {nearbyLocations.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-2">
                Nearby {location.category === 'campsite' ? 'Riding Areas' : 'Campsites'}
              </span>
              <div className="space-y-1">
                {nearbyLocations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => onFlyTo?.(loc.longitude, loc.latitude)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700/50 hover:border-dark-600 transition-colors text-left"
                  >
                    <span className="text-sm flex-shrink-0">{CATEGORY_ICONS[loc.category] || '📍'}</span>
                    <span className="flex-1 min-w-0 text-sm text-gray-300 truncate">{loc.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{loc._distance} mi</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category-specific details */}
          {location.category === 'campsite' && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {location.cell_signal && <DetailBadge label="Cell Signal" value={location.cell_signal} />}
              {location.shade !== null && location.shade !== undefined && <DetailBadge label="Shade" value={location.shade ? 'Yes' : 'No'} />}
              {location.level_ground !== null && location.level_ground !== undefined && <DetailBadge label="Level Ground" value={location.level_ground ? 'Yes' : 'No'} />}
              {location.water_nearby !== null && location.water_nearby !== undefined && <DetailBadge label="Water Nearby" value={location.water_nearby ? 'Yes' : 'No'} />}
              {location.max_vehicle_length !== null && location.max_vehicle_length !== undefined && <DetailBadge label="Max Vehicle" value={`${location.max_vehicle_length} ft`} />}
              {location.stay_limit_days !== null && location.stay_limit_days !== undefined && <DetailBadge label="Stay Limit" value={`${location.stay_limit_days} days`} />}
              {location.season && <DetailBadge label="Season" value={location.season} />}
              {location.crowding && <DetailBadge label="Crowding" value={location.crowding} />}
            </div>
          )}

          {location.category === 'riding' && location.trail_types && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {parseTrailTypes(location.trail_types).map(tt => {
                const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
                return <span key={tt} className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>{tt}</span>;
              })}
            </div>
          )}

          {/* Universal activity details — shows relevant fields for any category */}
          {!['campsite', 'riding'].includes(location.category) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {location.difficulty && (
                <DetailBadge 
                  label={location.category === 'kayaking' ? 'Rapid Grade' : location.category === 'climbing' ? 'Grade' : 'Difficulty'} 
                  value={location.difficulty} 
                />
              )}
              {location.sub_type && (
                <DetailBadge 
                  label={location.category === 'climbing' ? 'Style' : 'Type'} 
                  value={location.sub_type} 
                />
              )}
              {location.distance_miles != null && (
                <DetailBadge label="Distance" value={`${location.distance_miles} mi`} />
              )}
              {location.elevation_gain_ft != null && (
                <DetailBadge label="Elevation Gain" value={`${location.elevation_gain_ft.toLocaleString()} ft`} />
              )}
              {location.permit_required != null && (
                <DetailBadge label="Permit" value={location.permit_required ? 'Required' : 'Not Required'} />
              )}
              {location.water_available != null && (
                <DetailBadge label="Water Access" value={location.water_available ? 'Yes' : 'No'} />
              )}
              {location.hours && (
                <DetailBadge label="Hours" value={location.hours} />
              )}
              {location.best_season && (
                <DetailBadge label="Best Season" value={location.best_season} />
              )}
            </div>
          )}

          {/* Reviews summary */}
          {showFull && (
            <div className="border-t border-dark-700/50 pt-4 mb-4">
              <ReviewsSection locationId={location.id} darkMode showToast={showToast} />
            </div>
          )}
        </>
      )}

      {/* ===== FULL: Complete details ===== */}
      {showFull && (
        <>
          {/* Notes */}
          <div className="border-t border-dark-700/50 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Your Notes</span>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="p-1 rounded-lg hover:bg-dark-800 text-gray-500 hover:text-gray-300 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div>
                <textarea value={userNotes} onChange={e => setUserNotes(e.target.value)} rows={3} placeholder="Add your personal notes..." autoFocus
                  className="w-full text-sm rounded-xl px-3 py-2 resize-none bg-dark-800 border border-dark-700/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveNotes} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors">Save</button>
                  <button onClick={() => { setUserNotes(userData?.user_notes ?? location.user_notes ?? ''); setEditingNotes(false); }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-300 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed cursor-pointer ${userNotes ? 'text-gray-300' : 'text-gray-600 italic'}`} onClick={() => setEditingNotes(true)}>
                {userNotes || 'Tap to add notes...'}
              </p>
            )}
          </div>

          {/* Location notes */}
          {location.notes && (
            <div className="border-t border-dark-700/50 pt-4 mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-2">Location Notes</span>
              <p className="text-sm text-gray-300 leading-relaxed">{location.notes}</p>
            </div>
          )}

          {/* External Links */}
          {(() => {
            let links: { label: string; url: string }[] = [];
            if (location.external_links) {
              try {
                const parsed = JSON.parse(location.external_links);
                if (Array.isArray(parsed)) links = parsed;
              } catch {
                links = [{ label: 'Link', url: location.external_links }];
              }
            }
            const generated = getExternalUrl(location);
            if (links.length === 0 && !generated) return null;
            return (
              <div className="border-t border-dark-700/50 pt-4 mb-4">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-2">Links</span>
                {generated && !links.some(l => l.url === generated.url) && (
                  <a href={generated.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300 mb-1">
                    <ExternalLink className="w-3.5 h-3.5" />{generated.label}
                  </a>
                )}
                {links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 mb-1">
                    <ExternalLink className="w-3.5 h-3.5" />{link.label}
                  </a>
                ))}
              </div>
            );
          })()}

          {/* Coordinates */}
          <div className="border-t border-dark-700/50 pt-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
                showToast?.('Coordinates copied!', 'success');
              }}
              className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-orange-400 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DetailBadge({ label, value }: { label: string; value: string | number }) {
  const diffColors: Record<string, string> = {
    'Easy': 'text-green-400', 'Moderate': 'text-yellow-400', 'Difficult': 'text-orange-400',
    'Expert': 'text-red-400', 'Extreme': 'text-red-500',
  };
  const isDifficulty = label === 'Difficulty' || label === 'Grade' || label === 'Rapid Grade';
  const colorClass = isDifficulty && typeof value === 'string' ? diffColors[value] || 'text-gray-200' : 'text-gray-200';

  return (
    <div className="rounded-xl px-3 py-2 bg-dark-800 border border-dark-700/50">
      <div className="text-[10px] font-medium text-gray-500 mb-0.5">{label}</div>
      <div className={`text-xs font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}
