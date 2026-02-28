import { Heart, Droplets, DollarSign } from 'lucide-react';
import type { Location } from '../../types';
import { CAMPSITE_SUBTYPE_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_LABELS } from '../../types';

interface CampsiteCardProps {
  location: Location;
  onFlyTo: (lng: number, lat: number) => void;
  distanceFrom?: number;
  onLocationClick?: (location: Location) => void;
  onToggleFavorite?: (id: number) => void;
  nearbyRidingCount?: number;
}

export default function CampsiteCard({ location: loc, onFlyTo, distanceFrom, onLocationClick, onToggleFavorite, nearbyRidingCount }: CampsiteCardProps) {
  const subType = (loc.sub_type as keyof typeof CAMPSITE_SUBTYPE_ICONS) || 'other';
  const subColor = CAMPSITE_SUBTYPE_COLORS[subType] || '#6b7280';
  const isFree = loc.cost_per_night != null && Number(loc.cost_per_night) === 0;

  return (
    <button
      onClick={() => { onFlyTo(loc.longitude, loc.latitude); onLocationClick?.(loc); }}
      className="w-full text-left px-3 py-2.5 border-b border-dark-700/20 [.light_&]:border-gray-100
        hover:bg-dark-800/60 [.light_&]:hover:bg-gray-50 transition-all duration-150 group active:scale-[0.995]"
    >
      <div className="flex gap-2.5">
        {/* Left: sub-type color bar */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <div className="w-1 flex-1 rounded-full min-h-[28px]" style={{ backgroundColor: subColor + '60' }} />
          <span className="text-xs">{CAMPSITE_SUBTYPE_ICONS[subType]}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + actions */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-[13px] font-semibold text-gray-200 [.light_&]:text-gray-800 leading-tight group-hover:text-white [.light_&]:group-hover:text-gray-900 transition-colors">
              {loc.name}
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
              >
                <Heart size={12} className={loc.favorited ? 'text-red-400 fill-red-400' : 'text-gray-600 group-hover:text-gray-400'} />
              </button>
            </div>
          </div>

          {/* Row 2: Badges */}
          <div className="flex items-center gap-1.5 mb-1 text-[10px] flex-wrap">
            <span className="font-medium px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: subColor + '18', color: subColor }}>
              {CAMPSITE_SUBTYPE_LABELS[subType]}
            </span>
            {isFree && (
              <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-bold">
                Free!
              </span>
            )}
            {!isFree && loc.cost_per_night != null && (
              <span className="flex items-center gap-0.5 text-gray-500">
                <DollarSign size={9} />{loc.cost_per_night}/night
              </span>
            )}
            {loc.water_available === 1 && (
              <span className="flex items-center gap-0.5 text-blue-400">
                <Droplets size={9} /> Water
              </span>
            )}
            {nearbyRidingCount != null && nearbyRidingCount > 0 && (
              <span className="flex items-center gap-0.5 text-red-400/80 font-medium">
                🏍️ {nearbyRidingCount}
              </span>
            )}
          </div>

          {/* Row 3: Season + scenery */}
          <div className="flex items-center gap-2 text-[10px]">
            {loc.seasonal_status && (
              <span className={`px-1 py-0.5 rounded ring-1 ring-inset ${
                loc.seasonal_status === 'great' ? 'bg-green-500/10 text-green-400 ring-green-400/20' :
                loc.seasonal_status === 'shoulder' ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-400/20' :
                'bg-red-500/10 text-red-400 ring-red-400/20'
              }`}>
                {loc.seasonal_status === 'great' ? '● In Season' : loc.seasonal_status === 'shoulder' ? '● Shoulder' : '● Off Season'}
              </span>
            )}
            {loc.scenery_rating != null && loc.scenery_rating > 0 && (
              <span className="text-yellow-400">
                {'★'.repeat(Math.min(5, Math.round(loc.scenery_rating / 2)))}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
