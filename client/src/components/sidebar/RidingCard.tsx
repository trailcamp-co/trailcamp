import { Star, Heart, Mountain, Route, MapPin } from 'lucide-react';
import type { Location } from '../../types';
import { DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../../types';

interface RidingCardProps {
  location: Location;
  onFlyTo: (lng: number, lat: number) => void;
  distanceFrom?: number;
  onLocationClick?: (location: Location) => void;
  onToggleFavorite?: (id: number) => void;
}

export default function RidingCard({ location: loc, onFlyTo, distanceFrom, onLocationClick, onToggleFavorite }: RidingCardProps) {
  const diffColor = DIFFICULTY_COLORS[loc.difficulty ?? ''] ?? '#6b7280';
  const trailTypes = parseTrailTypes(loc.trail_types || '');

  const seasonInfo = loc.seasonal_status ? {
    great: { dot: 'bg-green-400', label: 'In Season', ring: 'ring-green-400/20' },
    shoulder: { dot: 'bg-yellow-400', label: 'Shoulder', ring: 'ring-yellow-400/20' },
    off: { dot: 'bg-red-400', label: 'Off Season', ring: 'ring-red-400/20' },
  }[loc.seasonal_status] : null;

  return (
    <button
      onClick={() => { onFlyTo(loc.longitude, loc.latitude); onLocationClick?.(loc); }}
      className="w-full text-left px-3 py-2.5 border-b border-dark-700/20 [.light_&]:border-gray-100
        hover:bg-dark-800/60 [.light_&]:hover:bg-gray-50 transition-all duration-150 group active:scale-[0.995]"
    >
      <div className="flex gap-2.5">
        {/* Left: difficulty color bar */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <div className="w-1 flex-1 rounded-full min-h-[32px]" style={{ backgroundColor: diffColor + '60' }} />

        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + actions */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-[13px] font-semibold text-gray-200 [.light_&]:text-gray-800 leading-tight group-hover:text-white [.light_&]:group-hover:text-gray-900 transition-colors flex items-center gap-1.5">
              {loc.name}
              {!!loc.featured && <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold uppercase tracking-wider flex-shrink-0">⭐ Epic</span>}
            </h4>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              {distanceFrom != null && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-medium tabular-nums">
                  {distanceFrom < 1 ? '<1' : Math.round(distanceFrom)} mi
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(loc.id); }}
                className="p-0.5 hover:scale-125 transition-transform"
                title={loc.favorited ? 'Unfavorite' : 'Favorite'}
              >
                <Heart size={12} className={loc.favorited ? 'text-red-400 fill-red-400' : 'text-gray-600 group-hover:text-gray-400 [.light_&]:text-gray-400'} />
              </button>
            </div>
          </div>

          {/* Row 2: Stats row */}
          <div className="flex items-center gap-2 mb-1.5 text-[10px]">
            {loc.difficulty && (
              <span className="font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: diffColor + '18', color: diffColor }}>
                {loc.difficulty}
              </span>
            )}
            {loc.distance_miles != null && (
              <span className="flex items-center gap-0.5 text-gray-500 [.light_&]:text-gray-400">
                <Route size={9} className="text-gray-600" />
                {Math.round(loc.distance_miles)} mi
              </span>
            )}
            {loc.elevation_gain_ft != null && (
              <span className="flex items-center gap-0.5 text-gray-500 [.light_&]:text-gray-400">
                <Mountain size={9} className="text-gray-600" />
                {loc.elevation_gain_ft >= 1000 ? `${(loc.elevation_gain_ft / 1000).toFixed(1)}k` : loc.elevation_gain_ft} ft
              </span>
            )}
            {seasonInfo && (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ring-1 ${seasonInfo.ring}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${seasonInfo.dot}`} />
                <span className="text-gray-400">{seasonInfo.label}</span>
              </span>
            )}
          </div>

          {/* Row 3: Trail types */}
          {trailTypes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {trailTypes.slice(0, 4).map((tt) => {
                const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' };
                return (
                  <span key={tt} className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: colors.bg, color: colors.text }}>
                    {tt}
                  </span>
                );
              })}
              {loc.best_season && !seasonInfo && (
                <span className="text-[9px] text-gray-600 [.light_&]:text-gray-400 ml-auto">{loc.best_season}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
