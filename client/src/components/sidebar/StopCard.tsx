import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Trash2,
  GripVertical,
  Clock,
  ChevronDown,
  ChevronUp,
  Navigation,
  Calendar,
  CloudSun,
} from 'lucide-react';
import type { TripStop, WeatherData, LocationCategory, CampsiteSubType } from '../../types';
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CAMPSITE_SUBTYPE_ICONS,
  CAMPSITE_SUBTYPE_COLORS,
  CAMPSITE_SUBTYPE_LABELS,
} from '../../types';

interface StopDateInfo {
  arrivalDate: string;
  departureDate: string;
}

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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStopIcon(stop: TripStop): string {
  if (stop.location_category === 'campsite' && stop.location_sub_type) {
    return CAMPSITE_SUBTYPE_ICONS[stop.location_sub_type as CampsiteSubType] || CATEGORY_ICONS.campsite;
  }
  if (stop.location_category) {
    return CATEGORY_ICONS[stop.location_category as LocationCategory] || '📍';
  }
  return '📍';
}

function getStopColor(stop: TripStop): string {
  if (stop.location_category === 'campsite' && stop.location_sub_type) {
    return CAMPSITE_SUBTYPE_COLORS[stop.location_sub_type as CampsiteSubType] || CATEGORY_COLORS.campsite;
  }
  if (stop.location_category) {
    return CATEGORY_COLORS[stop.location_category as LocationCategory] || '#f97316';
  }
  return '#f97316';
}

function getStopSubtitle(stop: TripStop): string {
  if (stop.location_category === 'campsite' && stop.location_sub_type) {
    return CAMPSITE_SUBTYPE_LABELS[stop.location_sub_type as CampsiteSubType] || stop.location_sub_type;
  }
  if (stop.location_category === 'riding') {
    return stop.location_difficulty || 'Riding Area';
  }
  if (stop.location_category) {
    return CATEGORY_LABELS[stop.location_category as LocationCategory] || stop.location_category;
  }
  return '';
}

export interface StopCardProps {
  stop: TripStop;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFlyTo: (lng: number, lat: number) => void;
  onDeleteStop: (stopId: number) => void;
  onUpdateStop: (stopId: number, data: Partial<TripStop>) => Promise<TripStop | undefined>;
  dateInfo: StopDateInfo | null;
  weatherData: WeatherData | null;
  isForecastTooFar: boolean;
  driveTimeMins: number | null;
  driveDistanceMiles: number | null;
  showDriveConnector: boolean;
  nearbyRidingCount?: number;
  distanceFromPrev?: number;
}

export function SortableStopCard({
  stop,
  index,
  isExpanded,
  onToggleExpand,
  onFlyTo,
  onDeleteStop,
  onUpdateStop,
  dateInfo,
  weatherData,
  isForecastTooFar,
  driveTimeMins,
  driveDistanceMiles,
  showDriveConnector,
  nearbyRidingCount,
  distanceFromPrev,
}: StopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const stopName = stop.name || stop.location_name || 'Unnamed Stop';
  const stopColor = getStopColor(stop);
  const stopIcon = getStopIcon(stop);
  const subtitle = getStopSubtitle(stop);

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drive connector between stops */}
      {index > 0 && (
        <div className="flex items-center gap-2 px-4 py-1">
          <div className="w-6 flex justify-center">
            <div className="w-px h-5 bg-dark-700 [.light_&]:bg-gray-300" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            {(driveTimeMins || driveDistanceMiles) && showDriveConnector && (
              <span className="flex items-center gap-1 bg-dark-800/50 px-2 py-0.5 rounded-full">
                <Navigation size={9} className="text-orange-400/50" />
                {formatDriveTime(driveTimeMins)}
                {driveTimeMins && driveDistanceMiles && ' · '}
                {formatDistance(driveDistanceMiles)}
              </span>
            )}
            {distanceFromPrev != null && distanceFromPrev > 0 && (
              <span className="text-gray-600">{Math.round(distanceFromPrev)} mi</span>
            )}
          </div>
        </div>
      )}

      {/* Stop card */}
      <div
        className={`group mx-2 mb-1 rounded-xl transition-all duration-150 cursor-pointer
          bg-dark-800 [.light_&]:bg-white
          border border-dark-700/30 [.light_&]:border-gray-200
          hover:border-dark-700 hover:bg-dark-800/80 [.light_&]:hover:border-gray-300
          ${isDragging ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10' : ''}
        `}
      >
        <div
          className="flex items-start gap-2 p-3"
          onClick={() => onFlyTo(stop.longitude, stop.latitude)}
        >
          {/* Drag handle */}
          <div
            className="drag-handle mt-0.5 text-gray-600 hover:text-gray-400 [.light_&]:text-gray-400 [.light_&]:hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </div>

          {/* Stop number - colored by category */}
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm"
            style={{ backgroundColor: stopColor, boxShadow: `0 1px 3px ${stopColor}50` }}
          >
            {index + 1}
          </div>

          {/* Stop info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm flex-shrink-0">{stopIcon}</span>
                <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate">
                  {stopName}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStop(stop.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                title="Remove stop"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div className="text-[10px] mt-0.5" style={{ color: stopColor }}>
                {subtitle}
              </div>
            )}

            {/* Nights + date + distance row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {stop.nights != null && stop.nights > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={10} />
                  <span>
                    {stop.nights} night{stop.nights !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {dateInfo && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={10} className="text-blue-400/70" />
                  <span>{formatShortDate(dateInfo.arrivalDate)}</span>
                </div>
              )}
              {nearbyRidingCount != null && nearbyRidingCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                  🏍️ {nearbyRidingCount}
                </div>
              )}
            </div>

            {/* Weather inline */}
            {dateInfo && weatherData && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400" title={weatherData.label}>
                <span>{weatherData.icon}</span>
                <span>{Math.round(weatherData.high)}/{Math.round(weatherData.low)}</span>
              </div>
            )}
            {dateInfo && isForecastTooFar && !weatherData && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-600 italic">
                <CloudSun size={10} />
                <span>Too far for forecast</span>
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="mt-0.5 p-1 text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-dark-700/50 [.light_&]:border-gray-200 mx-3 mt-0">
            <div className="pt-2">
              <label className="text-[11px] uppercase tracking-wider text-gray-500 mb-1 block">
                Notes
              </label>
              <textarea
                value={stop.notes ?? ''}
                onChange={(e) => onUpdateStop(stop.id, { notes: e.target.value })}
                placeholder="Add notes for this stop..."
                rows={3}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-dark-900 [.light_&]:bg-gray-50 border border-gray-700 [.light_&]:border-gray-200 rounded px-2 py-1.5 text-xs text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 transition-colors"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`, '_blank'); }}
                  className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                >
                  📍 Navigate
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-[11px] text-gray-500">Nights:</label>
                <input
                  type="number"
                  min={0}
                  value={stop.nights ?? 0}
                  onClick={(e) => e.stopPropagation()}
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
}

export interface OverlayStopCardProps {
  stop: TripStop;
  index: number;
}

export function OverlayStopCard({ stop, index }: OverlayStopCardProps) {
  const stopName = stop.name || stop.location_name || 'Unnamed Stop';
  const stopColor = getStopColor(stop);
  const stopIcon = getStopIcon(stop);

  return (
    <div className="mx-2 mb-1 rounded-xl bg-dark-800 [.light_&]:bg-white border border-orange-500 shadow-2xl shadow-orange-500/20">
      <div className="flex items-start gap-2 p-3">
        <div className="mt-0.5 text-gray-400">
          <GripVertical size={16} />
        </div>
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm"
          style={{ backgroundColor: stopColor, boxShadow: `0 1px 3px ${stopColor}50` }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{stopIcon}</span>
            <span className="text-sm font-medium text-gray-200 [.light_&]:text-gray-800 truncate">
              {stopName}
            </span>
          </div>
          {stop.nights != null && stop.nights > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Clock size={10} />
              <span>
                {stop.nights} night{stop.nights !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
