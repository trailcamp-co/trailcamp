import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LEGEND_ITEMS = [
  { emoji: '🏍️', label: 'Riding', color: '#f97316' },
  { emoji: '🏕️', label: 'Campground', color: '#22c55e' },
  { emoji: '⛺', label: 'Boondocking', color: '#a855f7' },
  { emoji: '🅿️', label: 'Parking', color: '#6b7280' },
];

const DIFFICULTY_ITEMS = [
  { label: 'Easy', color: '#22c55e' },
  { label: 'Mod', color: '#f59e0b' },
  { label: 'Hard', color: '#ef4444' },
  { label: 'Expert', color: '#7c3aed' },
];

export default function MapLegend() {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute bottom-8 left-3 z-10">
      {open ? (
        <div className="rounded-xl bg-dark-900/90 backdrop-blur-sm border border-dark-700/50 shadow-lg p-2.5 min-w-[150px]">
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
          >
            <span>Legend</span>
            <ChevronDown size={11} className="text-gray-500" />
          </button>
          <div className="space-y-1 mb-2">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-700/40 pt-1.5">
            <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
              {DIFFICULTY_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-1 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-dark-900/90 backdrop-blur-sm border border-dark-700/50 shadow-lg px-2.5 py-1.5 text-[10px] text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
        >
          Legend
          <ChevronUp size={10} />
        </button>
      )}
    </div>
  );
}
