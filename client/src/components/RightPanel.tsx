import { useState, useCallback, useEffect } from 'react';
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
  Trees,
  Heart,
  Bike,
} from 'lucide-react';
import type { Location } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';
import { fetchNearbyRiding, fetchGroupMembers } from '../hooks/useApi';
import ReviewsSection from './ReviewsSection';
import type { UserLocationData } from '../hooks/useUserData';
import { getExternalUrl } from '../utils/getExternalUrl';

interface RightPanelProps {
  location: Location;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Location>) => Promise<Location>;
  onDelete: (id: number) => Promise<void>;
  onAddToTrip: (location: Location) => Promise<void>;
  hasActiveTrip: boolean;
  darkMode: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onFlyTo?: (lng: number, lat: number) => void;
  onLocationClick?: (location: Location) => void;
  getUserData?: (locationId: number) => UserLocationData;
  onUpdateUserData?: (locationId: number, updates: Partial<UserLocationData>) => Promise<UserLocationData | null>;
  isFavorited?: (locationId: number) => boolean;
  onToggleFavorite?: (locationId: number) => Promise<boolean>;
  homeLat?: number | null;
  homeLon?: number | null;
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

function DetailBadge({ label, value, darkMode }: { label: string; value: string | number; darkMode: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${darkMode ? 'bg-dark-800 border border-dark-700/50' : 'bg-gray-50 border border-gray-200'} [.light_&]:bg-gray-50 [.light_&]:border-gray-200`}>
      <div className={`text-xs font-medium mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'} [.light_&]:text-gray-500`}>{label}</div>
      <div className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} [.light_&]:text-gray-900`}>{value}</div>
    </div>
  );
}

export default function RightPanel({
  location, onClose, onUpdate, onDelete, onAddToTrip, hasActiveTrip, darkMode, onFlyTo, onLocationClick, showToast,
  getUserData, onUpdateUserData, isFavorited: isFavoritedFn, onToggleFavorite,
  homeLat, homeLon,
}: RightPanelProps) {
  // Per-user data (overrides location fields for multi-tenant)
  const userData = getUserData?.(location.id);
  const favorited = isFavoritedFn?.(location.id) ?? false;
  const [hoverRating, setHoverRating] = useState(0);
  const [editingNotes, setEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState(userData?.user_notes ?? location.user_notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState(false);
  const [nearbyRiding, setNearbyRiding] = useState<(Location & { distance_from: number })[]>([]);
  const [nearbyRadius, setNearbyRadius] = useState(20);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [heartKey, setHeartKey] = useState(0);
  const [weather, setWeather] = useState<{ temp: number; icon: string; desc: string; sunrise?: string; sunset?: string } | null>(null);
  const [groupMembers, setGroupMembers] = useState<Location[]>([]);
  const [groupExpanded, setGroupExpanded] = useState(false);

  const isCampsite = location.category === 'campsite';
  const categoryColor = CATEGORY_COLORS[location.category] || '#6b7280';

  useEffect(() => {
    if (!isCampsite) return;
    setLoadingNearby(true);
    fetchNearbyRiding(location.latitude, location.longitude, nearbyRadius)
      .then(setNearbyRiding)
      .catch(() => setNearbyRiding([]))
      .finally(() => setLoadingNearby(false));
  }, [location.id, location.latitude, location.longitude, nearbyRadius, isCampsite]);

  // Reset notes when location changes
  useEffect(() => {
    setUserNotes(userData?.user_notes ?? location.user_notes ?? '');
    setEditingNotes(false);
    setConfirmDelete(false);
  }, [location.id, userData?.user_notes, location.user_notes]);

  // Fetch group members
  useEffect(() => {
    setGroupMembers([]);
    setGroupExpanded(false);
    if (location.group_id && (location.group_count || 0) > 1) {
      fetchGroupMembers(location.group_id)
        .then(members => setGroupMembers(members.filter(m => m.id !== location.id)))
        .catch(() => {});
    }
  }, [location.id, location.group_id, location.group_count]);

  // Fetch current weather
  useEffect(() => {
    setWeather(null);
    const WMO: Record<number, { icon: string; desc: string }> = {
      0: { icon: '☀️', desc: 'Clear' }, 1: { icon: '🌤️', desc: 'Mostly Clear' },
      2: { icon: '⛅', desc: 'Partly Cloudy' }, 3: { icon: '☁️', desc: 'Overcast' },
      45: { icon: '🌫️', desc: 'Fog' }, 48: { icon: '🌫️', desc: 'Rime Fog' },
      51: { icon: '🌦️', desc: 'Light Drizzle' }, 53: { icon: '🌦️', desc: 'Drizzle' },
      55: { icon: '🌧️', desc: 'Heavy Drizzle' },
      61: { icon: '🌧️', desc: 'Light Rain' }, 63: { icon: '🌧️', desc: 'Rain' },
      65: { icon: '🌧️', desc: 'Heavy Rain' },
      71: { icon: '🌨️', desc: 'Light Snow' }, 73: { icon: '🌨️', desc: 'Snow' },
      75: { icon: '❄️', desc: 'Heavy Snow' }, 77: { icon: '🌨️', desc: 'Snow Grains' },
      80: { icon: '🌦️', desc: 'Rain Showers' }, 81: { icon: '🌧️', desc: 'Rain Showers' },
      82: { icon: '⛈️', desc: 'Heavy Showers' },
      85: { icon: '🌨️', desc: 'Snow Showers' }, 86: { icon: '❄️', desc: 'Heavy Snow Showers' },
      95: { icon: '⛈️', desc: 'Thunderstorm' }, 96: { icon: '⛈️', desc: 'T-Storm + Hail' },
      99: { icon: '⛈️', desc: 'T-Storm + Heavy Hail' },
    };
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&daily=sunrise,sunset&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`)
      .then(r => r.json())
      .then(data => {
        if (data.current) {
          const wmo = WMO[data.current.weather_code] || { icon: '🌡️', desc: 'Unknown' };
          const sunrise = data.daily?.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined;
          const sunset = data.daily?.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined;
          setWeather({ temp: Math.round(data.current.temperature_2m), ...wmo, sunrise, sunset });
        }
      })
      .catch(() => {});
  }, [location.id, location.latitude, location.longitude]);

  // Effective user interaction values (from user_location_data, falling back to location fields)
  const effectiveRating = userData?.user_rating ?? location.user_rating;
  const effectiveVisited = userData?.visited ?? location.visited;
  const effectiveNotes = userData?.user_notes ?? location.user_notes;

  const handleRating = useCallback(async (rating: number) => {
    if (onUpdateUserData) {
      await onUpdateUserData(location.id, { user_rating: effectiveRating === rating ? null : rating });
    }
  }, [location.id, effectiveRating, onUpdateUserData]);

  const handleToggleFavorite = useCallback(async () => {
    setHeartKey((k) => k + 1);
    if (onToggleFavorite) {
      await onToggleFavorite(location.id);
    }
  }, [location.id, onToggleFavorite]);

  const handleToggleVisited = useCallback(async () => {
    if (onUpdateUserData) {
      await onUpdateUserData(location.id, {
        visited: effectiveVisited ? 0 : 1,
        visited_date: effectiveVisited ? null : new Date().toISOString().split('T')[0],
      });
    }
  }, [location.id, effectiveVisited, onUpdateUserData]);

  const handleSaveNotes = useCallback(async () => {
    if (onUpdateUserData) {
      await onUpdateUserData(location.id, { user_notes: userNotes || null });
    }
    setEditingNotes(false);
  }, [location.id, userNotes, onUpdateUserData]);

  const handleNavigate = useCallback(() => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`, '_blank');
  }, [location.latitude, location.longitude]);

  const handleAddToTrip = useCallback(async () => {
    setAddingToTrip(true);
    try {
      await onAddToTrip(location);
      showToast?.('Added to trip!', 'success');
    } catch {
      showToast?.('Failed to add to trip', 'error');
    } finally {
      setAddingToTrip(false);
    }
  }, [location, onAddToTrip, showToast]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
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
    } catch { return [{ label: 'Link', url: location.external_links }]; }
  };

  const sectionBorder = darkMode ? 'border-dark-700/50' : 'border-gray-100';
  const sectionDivider = `border-b ${sectionBorder} [.light_&]:border-gray-100`;
  const labelStyle = `text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`;

  const renderCampsiteDetails = () => (
    <div className="grid grid-cols-2 gap-2">
      {location.cell_signal && <DetailBadge label="Cell Signal" value={location.cell_signal} darkMode={darkMode} />}
      {location.shade !== null && location.shade !== undefined && <DetailBadge label="Shade" value={location.shade ? 'Yes' : 'No'} darkMode={darkMode} />}
      {location.level_ground !== null && location.level_ground !== undefined && <DetailBadge label="Level Ground" value={location.level_ground ? 'Yes' : 'No'} darkMode={darkMode} />}
      {location.cost_per_night !== null && location.cost_per_night !== undefined && <DetailBadge label="💰 Cost" value={location.cost_per_night === 0 ? 'Free!' : `$${location.cost_per_night}/night`} darkMode={darkMode} />}
      {location.water_available !== null && location.water_available !== undefined && <DetailBadge label="💧 Water" value={location.water_available ? 'Available' : 'None'} darkMode={darkMode} />}
      {location.water_nearby !== null && location.water_nearby !== undefined && <DetailBadge label="Water Nearby" value={location.water_nearby ? 'Yes' : 'No'} darkMode={darkMode} />}
      {location.dump_nearby !== null && location.dump_nearby !== undefined && <DetailBadge label="Dump Nearby" value={location.dump_nearby ? 'Yes' : 'No'} darkMode={darkMode} />}
      {location.max_vehicle_length !== null && location.max_vehicle_length !== undefined && <DetailBadge label="Max Vehicle Length" value={`${location.max_vehicle_length} ft`} darkMode={darkMode} />}
      {location.stay_limit_days !== null && location.stay_limit_days !== undefined && <DetailBadge label="Stay Limit" value={`${location.stay_limit_days} days`} darkMode={darkMode} />}
      {location.season && <DetailBadge label="Season" value={location.season} darkMode={darkMode} />}
      {location.crowding && <DetailBadge label="Crowding" value={location.crowding} darkMode={darkMode} />}
    </div>
  );

  const renderRidingDetails = () => {
    const diffColor = location.difficulty ? DIFFICULTY_COLORS[location.difficulty] || '#6b7280' : '';
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {location.difficulty && <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: diffColor + '22', color: diffColor }}>{location.difficulty}</span>}
          {location.distance_miles != null && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${darkMode ? 'bg-dark-800 text-gray-300' : 'bg-gray-100 text-gray-600'} [.light_&]:bg-gray-100 [.light_&]:text-gray-600`}>📏 {location.distance_miles} mi</span>}
          {location.elevation_gain_ft != null && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${darkMode ? 'bg-dark-800 text-gray-300' : 'bg-gray-100 text-gray-600'} [.light_&]:bg-gray-100 [.light_&]:text-gray-600`}>⛰️ {location.elevation_gain_ft.toLocaleString()} ft</span>}
        </div>
        {location.trail_types && (
          <div>
            <div className={`text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`}>Trail Types</div>
            <div className="flex flex-wrap gap-1.5">
              {parseTrailTypes(location.trail_types).map((tt) => {
                const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
                return <span key={tt} className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>{tt}</span>;
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {location.permit_required != null && <DetailBadge label="Permit Required" value={location.permit_required ? 'Yes' : 'No'} darkMode={darkMode} />}
          {location.best_season && <DetailBadge label="Best Season" value={location.best_season} darkMode={darkMode} />}
        </div>
        {location.permit_info && <DetailBadge label="Permit Info" value={location.permit_info} darkMode={darkMode} />}
      </div>
    );
  };

  const renderServiceDetails = () => (
    <div className="grid grid-cols-2 gap-2">
      {location.hours && <DetailBadge label="Hours" value={location.hours} darkMode={darkMode} />}
      {location.sub_type && <DetailBadge label="Type" value={location.sub_type} darkMode={darkMode} />}
    </div>
  );

  const renderDetailsGrid = () => {
    switch (location.category) {
      case 'campsite': return renderCampsiteDetails();
      case 'riding': return renderRidingDetails();
      default: return renderServiceDetails();
    }
  };

  const hasDetails = () => {
    if (location.category === 'campsite') return !!(location.cell_signal || location.shade !== null || location.level_ground !== null || location.water_nearby !== null || location.dump_nearby !== null || location.max_vehicle_length !== null || location.stay_limit_days !== null || location.season || location.crowding);
    if (location.category === 'riding') return !!(location.difficulty || location.distance_miles !== null || location.elevation_gain_ft !== null || location.trail_types || location.permit_required !== null);
    return !!(location.hours || location.sub_type);
  };

  const externalLinks = parseExternalLinks();
  const generatedLink = getExternalUrl(location);
  const hasPhotos = location.photos && location.photos.length > 0;

  return (
    <div className={`w-full sm:w-[400px] h-full flex flex-col shadow-2xl animate-slide-in-right bg-dark-950 border-l border-dark-700/50 text-gray-100 [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-gray-900`}>
      {/* Header */}
      <div className={`flex-shrink-0 p-5 pb-4 ${sectionDivider}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border badge-${location.category}`}>
                {CATEGORY_LUCIDE_ICONS[location.category]}{CATEGORY_LABELS[location.category]}
              </span>
              {location.source && <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-dark-800 text-gray-400' : 'bg-gray-100 text-gray-500'} [.light_&]:bg-gray-100 [.light_&]:text-gray-500`}>{location.source}</span>}
            </div>
            <div className="flex items-start justify-between gap-2">
              <h2 className={`text-xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'} [.light_&]:text-gray-900`}>{location.name}</h2>
              {weather && (
                <div className="flex-shrink-0 text-right" title={weather.desc}>
                  <div className="text-lg leading-none">{weather.icon}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{weather.temp}°F</div>
                  {weather.sunrise && weather.sunset && (
                    <div className="text-[9px] text-gray-500 mt-0.5">🌅 {weather.sunrise} · 🌇 {weather.sunset}</div>
                  )}
                </div>
              )}
            </div>
            {location.seasonal_status && (
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  location.seasonal_status === 'great' ? 'bg-green-500/20 text-green-400' :
                  location.seasonal_status === 'shoulder' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {location.seasonal_status === 'great' ? '🟢 Great Season' : location.seasonal_status === 'shoulder' ? '🟡 Shoulder Season' : '🔴 Bad Season'}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className={`flex-shrink-0 p-1.5 rounded-lg transition-colors press-scale ${darkMode ? 'hover:bg-dark-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'} [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-400 [.light_&]:hover:text-gray-600`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        {/* Satellite hero image */}
        <div className="h-36 w-full relative overflow-hidden bg-dark-800">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${location.longitude},${location.latitude},13,0/400x200@2x?access_token=${(window as any).__mapboxToken || ''}`}
            alt={location.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent [.light_&]:from-white [.light_&]:via-white/20" />
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
            <span className="text-2xl drop-shadow-lg">{CATEGORY_ICONS[location.category] || '📍'}</span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="px-5 pt-3 flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`)}
            className="text-[10px] text-gray-600 [.light_&]:text-gray-400 hover:text-orange-400 transition-colors font-mono cursor-pointer"
            title="Click to copy coordinates"
          >
            📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </button>
        </div>

        {/* Distance from home */}
        {homeLat != null && homeLon != null && (() => {
          const R = 3959;
          const dLat = (location.latitude - homeLat) * Math.PI / 180;
          const dLng = (location.longitude - homeLon) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(homeLat*Math.PI/180)*Math.cos(location.latitude*Math.PI/180)*Math.sin(dLng/2)**2;
          const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
          const driveHours = dist / 55;
          const driveLabel = driveHours < 1 ? `~${Math.round(driveHours * 60)} min` : `~${Math.round(driveHours)} hrs`;
          return (
            <div className="px-5 pt-4 flex items-center gap-2 text-xs text-gray-500 [.light_&]:text-gray-400">
              <MapPin size={12} className="text-orange-400 flex-shrink-0" />
              <span>{dist.toLocaleString()} mi from home ({driveLabel} drive)</span>
            </div>
          );
        })()}

        {/* Group Members */}
        {groupMembers.length > 0 && (
          <div className={`p-5 ${sectionDivider}`}>
            <button
              onClick={() => setGroupExpanded(!groupExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                darkMode ? 'bg-dark-800 hover:bg-dark-700 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              } [.light_&]:bg-gray-50 [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-700`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">📍</span>
                {groupMembers.length + 1} spots at this location
              </span>
              <span className={`text-xs transition-transform ${groupExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {groupExpanded && (
              <div className="mt-2 space-y-1">
                {groupMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => { onLocationClick?.(member); }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      darkMode ? 'hover:bg-dark-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    } [.light_&]:hover:bg-gray-50 [.light_&]:text-gray-700`}
                  >
                    <span className="text-xs opacity-60">
                      {member.category === 'campsite' ? (member.sub_type === 'boondocking' ? '⛺' : '🏕️') : '🏍️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-xs">{member.name}</div>
                      {member.source && <div className="text-[10px] text-gray-500 truncate">{member.source}</div>}
                    </div>
                    {member.cost_per_night != null && Number(member.cost_per_night) === 0 && (
                      <span className="text-[9px] text-green-400 font-semibold">Free</span>
                    )}
                    {member.difficulty && (
                      <span className="text-[9px] text-gray-400">{member.difficulty}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className={`p-5 ${sectionDivider}`}>
          <div className="flex gap-2 mb-3">
            <button onClick={handleNavigate} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-orange-500/20 press-scale">
              <Navigation className="w-4 h-4" />Google Maps
            </button>
            <button onClick={() => window.open(`https://waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`, '_blank')} className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-sky-500/20 press-scale">
              🚗 Waze
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const url = `${window.location.origin}?loc=${location.id}`;
                try {
                  await navigator.clipboard.writeText(url);
                  showToast?.('Link copied to clipboard!', 'success');
                } catch {
                  // Fallback for non-HTTPS contexts
                  const input = document.createElement('input');
                  input.value = url;
                  document.body.appendChild(input);
                  input.select();
                  document.execCommand('copy');
                  document.body.removeChild(input);
                  showToast?.('Link copied to clipboard!', 'success');
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-300 text-xs font-medium transition-colors border border-dark-700/50 [.light_&]:bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-700 [.light_&]:border-gray-200"
              title="Copy link to location"
            >
              🔗 Share
            </button>
            {hasActiveTrip && (
              <button onClick={handleAddToTrip} disabled={addingToTrip}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors press-scale ${darkMode ? 'bg-dark-800 hover:bg-dark-700 text-gray-200 border border-dark-700/50' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'} [.light_&]:bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-700 [.light_&]:border-gray-200 disabled:opacity-50`}>
                <Plus className="w-3.5 h-3.5" />{addingToTrip ? 'Adding...' : 'Add to Trip'}
              </button>
            )}
            <button onClick={handleToggleFavorite} title={favorited ? 'Remove from favorites' : 'Add to favorites'}
              className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors press-scale ${favorited ? 'bg-red-500/20 text-red-400 border border-red-500/30' : darkMode ? 'bg-dark-800 hover:bg-dark-700 text-gray-400 border border-dark-700/50' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'} [.light_&]:${favorited ? '' : 'bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-500 [.light_&]:border-gray-200'}`}>
              <Heart key={heartKey} className={`w-4 h-4 ${favorited ? 'fill-red-400 animate-heart-bounce' : ''}`} />
            </button>
            {/* Bookmark removed — favorites only */}
            <button onClick={handleToggleVisited} title={effectiveVisited ? 'Mark as not visited' : 'Mark as visited'}
              className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors press-scale ${effectiveVisited ? 'bg-green-500/20 text-green-400 border border-green-500/30' : darkMode ? 'bg-dark-800 hover:bg-dark-700 text-gray-400 border border-dark-700/50' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'} [.light_&]:${effectiveVisited ? '' : 'bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-500 [.light_&]:border-gray-200'}`}>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Star Rating removed — replaced by public Reviews section below */}

        {/* Details Grid */}
        {hasDetails() && (
          <div className={`p-5 ${sectionDivider}`}>
            <div className={`${labelStyle} mb-3`}>Details</div>
            {renderDetailsGrid()}
          </div>
        )}

        {/* Nearby Riding (for campsites) */}
        {isCampsite && (
          <div className={`p-5 ${sectionDivider}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={labelStyle}>
                <Bike className="w-3.5 h-3.5 inline mr-1" />Nearby Riding ({nearbyRiding.length})
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={nearbyRadius}
                  onChange={(e) => setNearbyRadius(Math.max(1, Number(e.target.value) || 20))}
                  className={`w-12 text-xs text-center rounded px-1 py-0.5 ${darkMode ? 'bg-dark-800 border border-dark-700/50 text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'} [.light_&]:bg-gray-50 [.light_&]:border-gray-200 [.light_&]:text-gray-700`} />
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`}>mi</span>
              </div>
            </div>
            {loadingNearby ? (
              <div className="text-xs text-gray-500 text-center py-2">Loading...</div>
            ) : nearbyRiding.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-2">No riding areas within {nearbyRadius} mi</div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto scroll-smooth">
                {nearbyRiding.slice(0, 15).map((r) => {
                  const diffColor = DIFFICULTY_COLORS[r.difficulty ?? ''] ?? '#6b7280';
                  return (
                    <button key={r.id} onClick={() => { onFlyTo?.(r.longitude, r.latitude); onLocationClick?.(r); }}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'hover:bg-dark-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-700`}>
                      <span className="text-xs">🏍️</span>
                      <span className="flex-1 truncate text-xs">{r.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: diffColor + '22', color: diffColor }}>{r.difficulty || '?'}</span>
                      <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`}>{r.distance_from?.toFixed(1)} mi</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Nearby Campsites (for riding areas) */}
        {location.category === 'riding' && (
          <div className={`p-5 ${sectionDivider}`}>
            <div className={`${labelStyle} mb-3`}>
              🏕️ Nearby Camping ({nearbyRiding.filter(r => r.category === 'campsite').length > 0 ? 'loading' : '—'})
            </div>
            {(() => {
              // Compute nearby campsites client-side from all locations
              // This is a quick estimate using flat-earth approximation
              const nearbyCamps = (window as any).__tcAllLocations?.filter((l: Location) => {
                if (l.category !== 'campsite') return false;
                const dLat = (l.latitude - location.latitude) * 69;
                const dLng = (l.longitude - location.longitude) * 69 * Math.cos(location.latitude * Math.PI / 180);
                return dLat * dLat + dLng * dLng < 625; // ~25mi radius
              }).slice(0, 8) || [];

              if (nearbyCamps.length === 0) return <div className="text-xs text-gray-500 text-center py-2">No campsites within 25 mi</div>;

              return (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {nearbyCamps.map((c: Location) => (
                    <button key={c.id} onClick={() => { onFlyTo?.(c.longitude, c.latitude); onLocationClick?.(c); }}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${darkMode ? 'hover:bg-dark-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <span className="text-xs">{c.sub_type === 'boondocking' ? '⛺' : '🏕️'}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      {c.cost_per_night != null && Number(c.cost_per_night) === 0 && (
                        <span className="text-[9px] text-green-400 font-medium">Free</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Description */}
        {location.description && (
          <div className={`p-5 ${sectionDivider}`}>
            <div className={`${labelStyle} mb-2`}>Description</div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'} [.light_&]:text-gray-600`}>{location.description}</p>
          </div>
        )}

        {/* Notes */}
        <div className={`p-5 ${sectionDivider}`}>
          {location.notes && (
            <div className="mb-4">
              <div className={`${labelStyle} mb-2`}>Location Notes</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'} [.light_&]:text-gray-600`}>{location.notes}</p>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className={labelStyle}>Your Notes</div>
              {!editingNotes && <button onClick={() => setEditingNotes(true)} className={`p-1 rounded-lg transition-colors press-scale ${darkMode ? 'hover:bg-dark-800 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'} [.light_&]:hover:bg-gray-100 [.light_&]:text-gray-400 [.light_&]:hover:text-gray-600`}><Edit3 className="w-3.5 h-3.5" /></button>}
            </div>
            {editingNotes ? (
              <div>
                <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)} rows={4} placeholder="Add your personal notes..." autoFocus
                  className={`w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${darkMode ? 'bg-dark-800 border border-dark-700/50 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400'} [.light_&]:bg-gray-50 [.light_&]:border-gray-200 [.light_&]:text-gray-800 [.light_&]:placeholder-gray-400`} />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveNotes} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors press-scale">Save</button>
                  <button onClick={() => { setUserNotes(effectiveNotes ?? ''); setEditingNotes(false); }} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors press-scale ${darkMode ? 'bg-dark-800 hover:bg-dark-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} [.light_&]:bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-600`}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed cursor-pointer ${userNotes ? (darkMode ? 'text-gray-300' : 'text-gray-600') : (darkMode ? 'text-gray-600 italic' : 'text-gray-400 italic')} [.light_&]:${userNotes ? 'text-gray-600' : 'text-gray-400'}`} onClick={() => setEditingNotes(true)}>
                {userNotes || 'Click to add notes...'}
              </p>
            )}
          </div>
          {!!effectiveVisited && (userData?.visited_date ?? location.visited_date) && (
            <div className="mt-3 flex items-center gap-2">
              <Clock className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`} />
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`}>Visited {userData?.visited_date ?? location.visited_date}</span>
            </div>
          )}
        </div>


        {/* External Links */}
        {(externalLinks.length > 0 || generatedLink) && (
          <div className={`p-5 ${sectionDivider}`}>
            <div className={`${labelStyle} mb-2`}>Links</div>
            <div className="flex flex-col gap-2">
              {generatedLink && !externalLinks.some(l => l.url === generatedLink.url) && (
                <a href={generatedLink.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-500'} [.light_&]:text-orange-600 [.light_&]:hover:text-orange-500`}>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />{generatedLink.label}
                </a>
              )}
              {externalLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} [.light_&]:text-blue-600 [.light_&]:hover:text-blue-500`}>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />{link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Public Reviews */}
        <div className={`p-5 ${sectionDivider}`}>
          <ReviewsSection locationId={location.id} darkMode={darkMode} showToast={showToast} />
        </div>

        {/* GPS Coordinates */}
        <div className={`p-5 ${sectionDivider}`}>
          <div className={`${labelStyle} mb-2`}>GPS Coordinates</div>
          <button onClick={handleCopyCoords} className={`flex items-center gap-2 text-sm font-mono transition-colors group ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} [.light_&]:text-gray-600 [.light_&]:hover:text-gray-900`}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
            {copiedCoords ? <span className="text-xs text-green-400 font-sans">Copied!</span>
              : <span className={`text-xs font-sans opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-500' : 'text-gray-400'} [.light_&]:text-gray-400`}>Click to copy</span>}
          </button>
        </div>

        {/* Delete — only show for user-owned locations */}
        {location.user_id && (
        <div className="p-5">
          {confirmDelete ? (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-red-900/20 border border-red-800/40' : 'bg-red-50 border border-red-200'} [.light_&]:bg-red-50 [.light_&]:border-red-200`}>
              <p className={`text-sm mb-3 ${darkMode ? 'text-red-300' : 'text-red-700'} [.light_&]:text-red-700`}>Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors press-scale">Delete Permanently</button>
                <button onClick={() => setConfirmDelete(false)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors press-scale ${darkMode ? 'bg-dark-800 hover:bg-dark-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} [.light_&]:bg-gray-100 [.light_&]:hover:bg-gray-200 [.light_&]:text-gray-600`}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={handleDelete} className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'} [.light_&]:text-gray-400 [.light_&]:hover:text-red-500`}>
              <Trash2 className="w-4 h-4" />Delete Location
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
