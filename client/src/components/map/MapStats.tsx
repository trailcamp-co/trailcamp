import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface MapStatsProps {
  ridingCount: number;
  campsiteCount: number;
  boondockingCount: number;
  totalCount: number;
}

export default function MapStats({ ridingCount, campsiteCount, boondockingCount, totalCount }: MapStatsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-20 left-3 lg:top-3 lg:bottom-auto z-10 lg:z-10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors text-xs font-medium"
      >
        <BarChart3 size={14} />
        {totalCount.toLocaleString()} locations
        {open ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </button>

      {open && (
        <div className="mb-2 lg:mb-0 lg:mt-2 bottom-full lg:bottom-auto absolute lg:relative p-3 rounded-xl shadow-xl glass animate-fade-in min-w-[160px]">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span>🏍️</span>
                <span>Riding</span>
              </span>
              <span className="text-gray-200 font-semibold tabular-nums">{ridingCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span>⛺</span>
                <span>Boondocking</span>
              </span>
              <span className="text-gray-200 font-semibold tabular-nums">{boondockingCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span>🏕️</span>
                <span>Campgrounds</span>
              </span>
              <span className="text-gray-200 font-semibold tabular-nums">{(campsiteCount - boondockingCount).toLocaleString()}</span>
            </div>
            <div className="pt-1.5 mt-1.5 border-t border-dark-700/50 flex items-center justify-between text-xs">
              <span className="text-gray-400">Total</span>
              <span className="text-orange-400 font-bold tabular-nums">{totalCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
