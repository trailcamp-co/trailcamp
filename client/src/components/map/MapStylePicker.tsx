import { useState } from 'react';
import { Map } from 'lucide-react';
import type { MapStyle } from '../../types';
import { MAP_STYLES } from '../../types';

interface MapStylePickerProps {
  mapStyle: MapStyle;
  onChangeMapStyle: (style: MapStyle) => void;
}

export default function MapStylePicker({ mapStyle, onChangeMapStyle }: MapStylePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-3 right-24 z-10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors text-xs font-medium"
        title="Map Style"
      >
        <Map size={14} />
        {mapStyle.name}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 rounded-xl shadow-xl border border-dark-600/50 overflow-hidden glass animate-scale-in">
          {MAP_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => { onChangeMapStyle(s); setOpen(false); }}
              className={`w-full px-4 py-2 text-xs text-left transition-colors ${
                mapStyle.id === s.id
                  ? 'text-orange-400 bg-dark-700/50'
                  : 'text-gray-300 hover:bg-dark-700/30'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
