import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORY_COLORS, CATEGORY_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_ICONS } from '../../types';

const LEGEND_ITEMS = [
  { emoji: CATEGORY_ICONS.riding, label: 'Riding', color: CATEGORY_COLORS.riding },
  { emoji: CAMPSITE_SUBTYPE_ICONS.campground, label: 'Campgrounds', color: CAMPSITE_SUBTYPE_COLORS.campground },
  { emoji: CAMPSITE_SUBTYPE_ICONS.boondocking, label: 'Boondocking', color: CAMPSITE_SUBTYPE_COLORS.boondocking },
  { emoji: CAMPSITE_SUBTYPE_ICONS.other, label: 'Other Camps', color: CAMPSITE_SUBTYPE_COLORS.other },
  { emoji: CAMPSITE_SUBTYPE_ICONS.parking, label: 'Parking', color: CAMPSITE_SUBTYPE_COLORS.parking },
  { emoji: CATEGORY_ICONS.scenic, label: 'Scenic', color: CATEGORY_COLORS.scenic },
];

export default function MapLegend() {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute bottom-16 left-3 z-10">
      {open ? (
        <div className="rounded-xl bg-dark-900/90 backdrop-blur-sm border border-dark-700/50 shadow-lg p-2.5 min-w-[145px]">
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
          >
            <span>Legend</span>
            <ChevronDown size={11} className="text-gray-500" />
          </button>
          <div className="space-y-1">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
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
