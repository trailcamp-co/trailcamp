import { useStats } from '../hooks/useApi';
import { X, MapPin, Mountain, Moon, Route, Tent, Star, Bike } from 'lucide-react';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../types';

interface StatsPanelProps {
  onClose: () => void;
  darkMode: boolean;
}

export default function StatsPanel({ onClose, darkMode }: StatsPanelProps) {
  const { stats, loading } = useStats();

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
    { label: 'Riding Areas Visited', value: stats.ridingVisited, icon: Mountain, color: 'text-red-400' },
  ];

  return (
    <div className={`w-[400px] h-full ${darkMode ? 'bg-dark-900 border-gray-700' : 'bg-white border-gray-200'} border-l shadow-xl flex flex-col`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Mountain className="w-5 h-5 text-orange-400" />
          Trip Stats
        </h2>
        <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-dark-700' : 'hover:bg-gray-100'} transition-colors`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <Star className="w-4 h-4 inline mr-1 text-yellow-400" />
              Top Rated Spots
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
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < (loc.user_rating || 0) ? 'fill-yellow-400 text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Breakdown by Category */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <MapPin className="w-4 h-4 inline mr-1 text-orange-400" />
            Location Breakdown
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
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
