import { Star } from 'lucide-react';
import type { Location } from '../../types';
import { DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../../types';

function renderStars(count: number, max: number = 5): JSX.Element {
  const stars: JSX.Element[] = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <Star
        key={i}
        size={12}
        className={i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
      />,
    );
  }
  return <span className="inline-flex gap-0.5">{stars}</span>;
}

interface RidingCardProps {
  location: Location;
  onFlyTo: (lng: number, lat: number) => void;
}

export default function RidingCard({ location: loc, onFlyTo }: RidingCardProps) {
  const diffColor = DIFFICULTY_COLORS[loc.difficulty ?? ''] ?? '#6b7280';

  return (
    <button
      onClick={() => onFlyTo(loc.longitude, loc.latitude)}
      className="w-full text-left px-3 py-2.5 border-b border-gray-700/30 [.light_&]:border-gray-100
        hover:bg-dark-700 [.light_&]:hover:bg-gray-50 transition-colors group flex gap-0"
    >
      {/* Colored left accent bar */}
      <div
        className="w-1 rounded-full flex-shrink-0 mr-2.5 self-stretch"
        style={{ backgroundColor: diffColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate">
            {loc.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {loc.difficulty && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: diffColor + '22',
                color: diffColor,
              }}
            >
              {loc.difficulty}
            </span>
          )}
          {loc.distance_miles != null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400 [.light_&]:bg-gray-100 [.light_&]:text-gray-500 flex items-center gap-0.5">
              📏 {Math.round(loc.distance_miles)} mi
            </span>
          )}
          {loc.elevation_gain_ft != null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-700 text-gray-400 [.light_&]:bg-gray-100 [.light_&]:text-gray-500 flex items-center gap-0.5">
              ⛰️ {loc.elevation_gain_ft.toLocaleString()} ft
            </span>
          )}
          {loc.scenery_rating != null && loc.scenery_rating > 0 && (
            <span className="flex items-center">{renderStars(loc.scenery_rating)}</span>
          )}
        </div>
        {loc.trail_types && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {parseTrailTypes(loc.trail_types).map((tt) => {
              const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
              return (
                <span
                  key={tt}
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {tt}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}
