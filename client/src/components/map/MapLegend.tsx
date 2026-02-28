import { useState } from 'react';
import { Info, X } from 'lucide-react';

const LEGEND_ITEMS = [
  { emoji: '🏍️', label: 'Riding Area', color: '#f97316' },
  { emoji: '🏕️', label: 'Campground', color: '#22c55e' },
  { emoji: '⛺', label: 'Boondocking', color: '#a855f7' },
  { emoji: '🅿️', label: 'Parking/Rest', color: '#6b7280' },
];

const DIFFICULTY_LEGEND = [
  { label: 'Easy', color: '#22c55e' },
  { label: 'Moderate', color: '#f59e0b' },
  { label: 'Hard', color: '#ef4444' },
  { label: 'Expert', color: '#7c3aed' },
];

export default function MapLegend() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-3 right-28 z-10 p-2 rounded-lg bg-dark-900/90 backdrop-blur-sm border border-dark-700/50 text-gray-300 hover:bg-dark-800 transition-all shadow-lg
          [.light_&]:bg-white/90 [.light_&]:border-gray-200 [.light_&]:text-gray-600 [.light_&]:hover:bg-gray-50"
        title="Map Legend"
      >
        <Info size={16} />
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-28 z-10 p-3 rounded-xl bg-dark-900/95 backdrop-blur-sm border border-dark-700/50 shadow-xl animate-fade-in min-w-[170px]
      [.light_&]:bg-white/95 [.light_&]:border-gray-200">
      
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Legend</div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={12} />
        </button>
      </div>

      <div className="space-y-1 mb-2.5">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-gray-300 [.light_&]:text-gray-600">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sm">{item.emoji}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dark-700/50 [.light_&]:border-gray-200 pt-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Difficulty</div>
        <div className="grid grid-cols-2 gap-1">
          {DIFFICULTY_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1 text-[10px] text-gray-400 [.light_&]:text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
