import { useState, useEffect } from 'react';
import { useStats } from '../hooks/useApi';
import { X, MapPin, Mountain, Moon, Route, Tent, Star, Bike, DollarSign, Clock, Fuel } from 'lucide-react';
import { CATEGORY_COLORS, CATEGORY_ICONS, DIFFICULTY_COLORS } from '../types';
import type { Trip, TripStop } from '../types';

interface StatsPanelProps {
  onClose: () => void;
  darkMode: boolean;
  selectedTrip?: Trip | null;
  stops?: TripStop[];
}

interface TripStats {
  totalDriveMiles: number;
  totalDriveTimeMins: number;
  nearbyRidingCount: number;
  difficultyBreakdown: Record<string, number>;
  trailTypeBreakdown: Record<string, number>;
  stopCount: number;
}

export default function StatsPanel({ onClose, darkMode, selectedTrip, stops }: StatsPanelProps) {
  const { stats, loading } = useStats();
  const [gasPrice, setGasPrice] = useState(3.50);
  const [mpg, setMpg] = useState(12);
  const [tripStats, setTripStats] = useState<TripStats | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  useEffect(() => {
    if (!selectedTrip) { setTripStats(null); return; }
    setLoadingTrip(true);
    fetch(`/api/locations/stats?trip_id=${selectedTrip.id}`)
      .then(r => r.json())
      .then(data => setTripStats(data.tripStats))
      .catch(() => setTripStats(null))
      .finally(() => setLoadingTrip(false));
  }, [selectedTrip?.id]);

  // Loading state with pulse animation
  if (loading || !stats) {
    return (
      <div className="w-[400px] h-full bg-dark-950 border-l border-dark-700/50 shadow-2xl flex flex-col animate-slide-in-right [.light_&]:bg-white [.light_&]:border-gray-200">
        <div className="p-4 border-b border-dark-700/50 [.light_&]:border-gray-200 flex items-center justify-between">
          <div className="h-6 w-32 bg-dark-800 rounded-lg animate-pulse [.light_&]:bg-gray-200" />
          <div className="h-8 w-8 bg-dark-800 rounded-lg animate-pulse [.light_&]:bg-gray-200" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 animate-pulse [.light_&]:bg-gray-100 [.light_&]:border-gray-200">
                <div className="h-5 w-5 bg-dark-700 rounded mb-2 [.light_&]:bg-gray-300" />
                <div className="h-7 w-16 bg-dark-700 rounded mb-1 [.light_&]:bg-gray-300" />
                <div className="h-3 w-20 bg-dark-700 rounded [.light_&]:bg-gray-300" />
              </div>
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-dark-800 rounded-xl animate-pulse [.light_&]:bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Trips', value: stats.tripCount, icon: Route, color: 'text-orange-400', gradient: 'from-orange-500/10 to-orange-500/5' },
    { label: 'Nights Camped', value: stats.totalNights, icon: Moon, color: 'text-blue-400', gradient: 'from-blue-500/10 to-blue-500/5' },
    { label: 'Miles Driven', value: stats.totalMiles.toLocaleString(), icon: Route, color: 'text-green-400', gradient: 'from-green-500/10 to-green-500/5' },
    { label: 'Locations Saved', value: stats.totalLocations, icon: MapPin, color: 'text-purple-400', gradient: 'from-purple-500/10 to-purple-500/5' },
    { label: 'Places Visited', value: stats.visitedCount, icon: Star, color: 'text-yellow-400', gradient: 'from-yellow-500/10 to-yellow-500/5' },
    { label: 'Campsites', value: stats.campsites, icon: Tent, color: 'text-orange-400', gradient: 'from-orange-500/10 to-orange-500/5' },
    { label: 'Riding Areas', value: stats.ridingAreas, icon: Bike, color: 'text-red-400', gradient: 'from-red-500/10 to-red-500/5' },
    { label: 'Riding Visited', value: stats.ridingVisited, icon: Mountain, color: 'text-red-400', gradient: 'from-red-500/10 to-red-500/5' },
  ];

  const fuelCost = tripStats ? (tripStats.totalDriveMiles / mpg) * gasPrice : 0;
  const driveHours = tripStats ? Math.floor(tripStats.totalDriveTimeMins / 60) : 0;
  const driveMins = tripStats ? Math.round(tripStats.totalDriveTimeMins % 60) : 0;

  const diffTotal = tripStats ? Object.values(tripStats.difficultyBreakdown).reduce((a, b) => a + b, 0) : 0;
  const trailTypeEntries = tripStats ? Object.entries(tripStats.trailTypeBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
  const maxTrailCount = trailTypeEntries.length > 0 ? trailTypeEntries[0][1] : 1;

  // Nights per stop bar chart
  const nightsPerStop = (stops || [])
    .filter(s => s.nights && s.nights > 0)
    .map(s => ({ name: s.name || s.location_name || 'Stop', nights: s.nights! }));
  const maxNights = nightsPerStop.length > 0 ? Math.max(...nightsPerStop.map(s => s.nights)) : 1;

  // Trip summary values
  const totalTripNights = nightsPerStop.reduce((sum, s) => sum + s.nights, 0);

  return (
    <div className="w-[400px] h-full bg-dark-950 border-l border-dark-700/50 shadow-2xl flex flex-col animate-slide-in-right [.light_&]:bg-white [.light_&]:border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-dark-700/50 [.light_&]:border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Mountain className="w-5 h-5 text-orange-400" />
          {selectedTrip ? 'Trip Stats' : 'Overall Stats'}
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-dark-800 [.light_&]:hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Trip-specific stats */}
        {selectedTrip && tripStats && (
          <div className="space-y-4">
            {/* Trip name */}
            <h3 className="text-sm font-semibold text-gray-300 [.light_&]:text-gray-700 flex items-center gap-1.5">
              <Route className="w-4 h-4 text-orange-400" />
              {selectedTrip.name}
            </h3>

            {/* Trip summary sentence */}
            <p className="text-sm text-gray-400 [.light_&]:text-gray-500 leading-relaxed">
              Your trip covers{' '}
              <span className="text-gray-200 font-medium [.light_&]:text-gray-800">{tripStats.stopCount} stops</span>
              {totalTripNights > 0 && (
                <>
                  {' '}over{' '}
                  <span className="text-gray-200 font-medium [.light_&]:text-gray-800">{totalTripNights} night{totalTripNights !== 1 ? 's' : ''}</span>
                </>
              )}
              {' '}&mdash;{' '}
              <span className="text-gray-200 font-medium [.light_&]:text-gray-800">{tripStats.totalDriveMiles} miles</span>
              {' '}of driving
            </p>

            {/* Trip stat cards with fuel inline */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Drive */}
              <div className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 [.light_&]:bg-gray-50 [.light_&]:border-gray-200 [.light_&]:from-blue-50 [.light_&]:to-white">
                <Route className="w-4 h-4 text-blue-400 mb-1.5" />
                <div className="text-2xl font-bold">{tripStats.totalDriveMiles} mi</div>
                <div className="text-xs text-gray-400 [.light_&]:text-gray-500">Total Drive</div>
              </div>

              {/* Drive Time */}
              <div className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 bg-gradient-to-br from-green-500/10 to-green-500/5 [.light_&]:bg-gray-50 [.light_&]:border-gray-200 [.light_&]:from-green-50 [.light_&]:to-white">
                <Clock className="w-4 h-4 text-green-400 mb-1.5" />
                <div className="text-2xl font-bold">{driveHours}h {driveMins}m</div>
                <div className="text-xs text-gray-400 [.light_&]:text-gray-500">Drive Time</div>
              </div>

              {/* Fuel Cost - inline with other trip stats */}
              <div className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 [.light_&]:bg-gray-50 [.light_&]:border-gray-200 [.light_&]:from-yellow-50 [.light_&]:to-white">
                <Fuel className="w-4 h-4 text-yellow-400 mb-1.5" />
                <div className="text-2xl font-bold">${fuelCost.toFixed(0)}</div>
                <div className="text-xs text-gray-400 [.light_&]:text-gray-500 mb-1.5">Est. Fuel</div>
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-500 [.light_&]:text-gray-400">$/gal</div>
                    <input
                      type="number"
                      step="0.25"
                      value={gasPrice}
                      onChange={(e) => setGasPrice(Number(e.target.value) || 3.50)}
                      className="w-full text-xs rounded px-1.5 py-0.5 bg-dark-700 border border-dark-600 text-gray-300 [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-gray-700"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-gray-500 [.light_&]:text-gray-400">MPG</div>
                    <input
                      type="number"
                      step="0.5"
                      value={mpg}
                      onChange={(e) => setMpg(Number(e.target.value) || 12)}
                      className="w-full text-xs rounded px-1.5 py-0.5 bg-dark-700 border border-dark-600 text-gray-300 [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Nearby Riding */}
              <div className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 bg-gradient-to-br from-red-500/10 to-red-500/5 [.light_&]:bg-gray-50 [.light_&]:border-gray-200 [.light_&]:from-red-50 [.light_&]:to-white">
                <Bike className="w-4 h-4 text-red-400 mb-1.5" />
                <div className="text-2xl font-bold">{tripStats.nearbyRidingCount}</div>
                <div className="text-xs text-gray-400 [.light_&]:text-gray-500">Nearby Riding</div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            {diffTotal > 0 && (
              <div>
                <div className="text-xs font-medium mb-2 text-gray-400 [.light_&]:text-gray-500">Difficulty Breakdown</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 rounded-full overflow-hidden flex bg-dark-800 [.light_&]:bg-gray-100">
                    {Object.entries(tripStats.difficultyBreakdown).filter(([, v]) => v > 0).map(([diff, count]) => (
                      <div
                        key={diff}
                        style={{ width: `${(count / diffTotal) * 100}%`, backgroundColor: DIFFICULTY_COLORS[diff] || '#6b7280' }}
                        title={`${diff}: ${count}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {Object.entries(tripStats.difficultyBreakdown).filter(([, v]) => v > 0).map(([diff, count]) => (
                    <span key={diff} className="text-[10px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS[diff] || '#6b7280' }} />
                      {diff}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trail Types Bar Chart */}
            {trailTypeEntries.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-2 text-gray-400 [.light_&]:text-gray-500">Trail Types</div>
                <div className="space-y-1.5">
                  {trailTypeEntries.map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-[10px] w-20 truncate text-gray-400 [.light_&]:text-gray-500">{type}</span>
                      <div className="flex-1 h-3.5 rounded-full overflow-hidden bg-dark-800 [.light_&]:bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500/60 to-orange-500/40"
                          style={{ width: `${(count / maxTrailCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] w-6 text-right text-gray-500 [.light_&]:text-gray-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nights per Stop - horizontal bar chart with stop names */}
            {nightsPerStop.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-2 text-gray-400 [.light_&]:text-gray-500">Nights per Stop</div>
                <div className="space-y-1.5">
                  {nightsPerStop.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] w-24 truncate text-gray-400 [.light_&]:text-gray-500" title={s.name}>{s.name}</span>
                      <div className="flex-1 h-3.5 rounded-full overflow-hidden bg-dark-800 [.light_&]:bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500/60 to-blue-500/40"
                          style={{ width: `${(s.nights / maxNights) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] w-4 text-right text-gray-500 [.light_&]:text-gray-400">{s.nights}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider to overall stats */}
            <div className="border-t border-dark-700/50 [.light_&]:border-gray-200 pt-3">
              <div className="text-xs font-medium mb-2 text-gray-500 [.light_&]:text-gray-400">Overall Statistics</div>
            </div>
          </div>
        )}

        {/* Trip loading state */}
        {selectedTrip && loadingTrip && (
          <div className="space-y-3">
            <div className="h-5 w-40 bg-dark-800 rounded animate-pulse [.light_&]:bg-gray-200" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 animate-pulse [.light_&]:bg-gray-100 [.light_&]:border-gray-200">
                  <div className="h-5 w-5 bg-dark-700 rounded mb-2 [.light_&]:bg-gray-300" />
                  <div className="h-7 w-16 bg-dark-700 rounded mb-1 [.light_&]:bg-gray-300" />
                  <div className="h-3 w-20 bg-dark-700 rounded [.light_&]:bg-gray-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, gradient }) => (
            <div
              key={label}
              className={`p-4 rounded-xl bg-dark-800 border border-dark-700/50 bg-gradient-to-br ${gradient} [.light_&]:bg-gray-50 [.light_&]:border-gray-200`}
            >
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-gray-400 [.light_&]:text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Top Rated */}
        {stats.topRated.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300 [.light_&]:text-gray-700 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400" />
              Top Rated Spots
            </h3>
            <div className="space-y-2">
              {stats.topRated.map(loc => (
                <div
                  key={loc.id}
                  className="p-3 rounded-xl bg-dark-800 border border-dark-700/50 [.light_&]:bg-gray-50 [.light_&]:border-gray-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[loc.category]}</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">{loc.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < (loc.user_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-dark-600 [.light_&]:text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Breakdown */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-300 [.light_&]:text-gray-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-400" />
            Location Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
              const catKey = cat as keyof typeof CATEGORY_ICONS;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-dark-800 border border-dark-700/50 [.light_&]:bg-gray-50 [.light_&]:border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[catKey]}</span>
                    <span className="text-sm capitalize">{cat}</span>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
