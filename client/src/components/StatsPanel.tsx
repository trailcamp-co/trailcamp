import { useState, useEffect } from 'react';
import { useStats } from '../hooks/useApi';
import { X, MapPin, Mountain, Moon, Route, Tent, Star, Bike, DollarSign, Clock } from 'lucide-react';
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

  if (loading || !stats) {
    return (
      <div className={`w-[400px] h-full ${darkMode ? 'bg-dark-900 border-gray-700' : 'bg-white border-gray-200'} border-l shadow-xl flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Trips', value: stats.tripCount, icon: Route, color: 'text-orange-400' },
    { label: 'Nights Camped', value: stats.totalNights, icon: Moon, color: 'text-blue-400' },
    { label: 'Miles Driven', value: stats.totalMiles.toLocaleString(), icon: Route, color: 'text-green-400' },
    { label: 'Locations Saved', value: stats.totalLocations, icon: MapPin, color: 'text-purple-400' },
    { label: 'Places Visited', value: stats.visitedCount, icon: Star, color: 'text-yellow-400' },
    { label: 'Campsites', value: stats.campsites, icon: Tent, color: 'text-orange-400' },
    { label: 'Riding Areas', value: stats.ridingAreas, icon: Bike, color: 'text-red-400' },
    { label: 'Riding Visited', value: stats.ridingVisited, icon: Mountain, color: 'text-red-400' },
  ];

  const fuelCost = tripStats ? (tripStats.totalDriveMiles / 12) * gasPrice : 0;
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

  return (
    <div className={`w-[400px] h-full ${darkMode ? 'bg-dark-900 border-gray-700' : 'bg-white border-gray-200'} border-l shadow-xl flex flex-col`}>
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Mountain className="w-5 h-5 text-orange-400" />
          {selectedTrip ? 'Trip Stats' : 'Overall Stats'}
        </h2>
        <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-dark-700' : 'hover:bg-gray-100'} transition-colors`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Trip-specific stats */}
        {selectedTrip && tripStats && (
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Route className="w-4 h-4 inline mr-1 text-orange-400" />
              {selectedTrip.name}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-dark-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <Route className="w-4 h-4 text-blue-400 mb-1" />
                <div className="text-lg font-bold">{tripStats.totalDriveMiles} mi</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Drive</div>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-dark-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <Clock className="w-4 h-4 text-green-400 mb-1" />
                <div className="text-lg font-bold">{driveHours}h {driveMins}m</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Drive Time</div>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-dark-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <DollarSign className="w-4 h-4 text-yellow-400 mb-1" />
                <div className="text-lg font-bold">${fuelCost.toFixed(0)}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Est. Fuel</div>
                <input type="number" step="0.25" value={gasPrice} onChange={(e) => setGasPrice(Number(e.target.value) || 3.50)}
                  className={`mt-1 w-full text-xs rounded px-1 py-0.5 ${darkMode ? 'bg-dark-700 border border-gray-600 text-gray-300' : 'bg-white border border-gray-200 text-gray-700'}`} />
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-dark-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <Bike className="w-4 h-4 text-red-400 mb-1" />
                <div className="text-lg font-bold">{tripStats.nearbyRidingCount}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nearby Riding</div>
              </div>
            </div>

            {/* Difficulty donut (CSS) */}
            {diffTotal > 0 && (
              <div>
                <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Difficulty Breakdown</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: darkMode ? '#1e293b' : '#f3f4f6' }}>
                    {Object.entries(tripStats.difficultyBreakdown).filter(([, v]) => v > 0).map(([diff, count]) => (
                      <div key={diff} style={{ width: `${(count / diffTotal) * 100}%`, backgroundColor: DIFFICULTY_COLORS[diff] || '#6b7280' }}
                        title={`${diff}: ${count}`} />
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

            {/* Trail type bar chart (CSS) */}
            {trailTypeEntries.length > 0 && (
              <div>
                <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trail Types</div>
                <div className="space-y-1">
                  {trailTypeEntries.map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`text-[10px] w-20 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{type}</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#1e293b' : '#f3f4f6' }}>
                        <div className="h-full rounded-full bg-orange-500/60" style={{ width: `${(count / maxTrailCount) * 100}%` }} />
                      </div>
                      <span className={`text-[10px] w-6 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nights per stop */}
            {nightsPerStop.length > 0 && (
              <div>
                <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nights per Stop</div>
                <div className="space-y-1">
                  {nightsPerStop.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-[10px] w-24 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.name}</span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#1e293b' : '#f3f4f6' }}>
                        <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${(s.nights / maxNights) * 100}%` }} />
                      </div>
                      <span className={`text-[10px] w-4 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.nights}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
              <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Overall Statistics</div>
            </div>
          </div>
        )}

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`p-4 rounded-xl ${darkMode ? 'bg-dark-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-2xl font-bold">{value}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Top Rated */}
        {stats.topRated.length > 0 && (
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Star className="w-4 h-4 inline mr-1 text-yellow-400" />Top Rated Spots
            </h3>
            <div className="space-y-2">
              {stats.topRated.map(loc => (
                <div key={loc.id} className={`p-3 rounded-lg ${darkMode ? 'bg-dark-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[loc.category]}</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">{loc.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < (loc.user_rating || 0) ? 'fill-yellow-400 text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Breakdown */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <MapPin className="w-4 h-4 inline mr-1 text-orange-400" />Location Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
              const catKey = cat as keyof typeof CATEGORY_ICONS;
              return (
                <div key={cat} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-dark-800' : 'bg-gray-50'}`}>
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
