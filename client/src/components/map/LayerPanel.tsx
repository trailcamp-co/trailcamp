import { Layers, Eye, EyeOff } from 'lucide-react';
import type { LocationCategory } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from '../../types';
import { MAP_LAYER_CATEGORIES, BLM_FILL_COLOR, USFS_FILL_COLOR } from './constants';

interface LayerPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  visibleLayers: Set<LocationCategory>;
  onToggleLayer: (category: LocationCategory) => void;
  blmVisible: boolean;
  onToggleBlm: () => void;
  usfsVisible: boolean;
  onToggleUsfs: () => void;
}

export default function LayerPanel({
  isOpen,
  onToggle,
  darkMode,
  visibleLayers,
  onToggleLayer,
  blmVisible,
  onToggleBlm,
  usfsVisible,
  onToggleUsfs,
}: LayerPanelProps) {
  return (
    <div className="absolute top-3 right-3 z-10">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm transition-colors ${
          darkMode
            ? 'bg-dark-800/90 text-gray-200 hover:bg-dark-700/90 border border-dark-600/50'
            : 'bg-white/90 text-gray-700 hover:bg-gray-50/90 border border-gray-200/50'
        }`}
      >
        <Layers size={16} />
        <span className="text-sm font-medium">Layers</span>
      </button>

      {isOpen && (
        <div className={`mt-2 rounded-lg shadow-xl border overflow-hidden backdrop-blur-sm ${
          darkMode ? 'bg-dark-800/95 border-dark-600/50' : 'bg-white/95 border-gray-200/50'
        }`}>
          <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b ${
            darkMode ? 'text-gray-400 border-dark-600/50' : 'text-gray-500 border-gray-200'
          }`}>
            Overlays
          </div>
          <div className="py-1">
            {/* BLM Land Toggle */}
            <button
              onClick={onToggleBlm}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                darkMode ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
              } ${!blmVisible ? 'opacity-50' : ''}`}
            >
              <span className="text-base">🏜️</span>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: BLM_FILL_COLOR }} />
              <span className="flex-1 text-left">BLM Land</span>
              {blmVisible ? <Eye size={14} className="text-green-400 flex-shrink-0" />
                : <EyeOff size={14} className="text-gray-500 flex-shrink-0" />}
            </button>

            {/* USFS National Forest Toggle */}
            <button
              onClick={onToggleUsfs}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                darkMode ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
              } ${!usfsVisible ? 'opacity-50' : ''}`}
            >
              <span className="text-base">🌲</span>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: USFS_FILL_COLOR }} />
              <span className="flex-1 text-left">National Forests</span>
              {usfsVisible ? <Eye size={14} className="text-green-400 flex-shrink-0" />
                : <EyeOff size={14} className="text-gray-500 flex-shrink-0" />}
            </button>
          </div>

          <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-t border-b ${
            darkMode ? 'text-gray-400 border-dark-600/50' : 'text-gray-500 border-gray-200'
          }`}>
            Categories
          </div>
          <div className="py-1">
            {MAP_LAYER_CATEGORIES.map((category) => {
              const visible = visibleLayers.has(category);
              return (
                <button
                  key={category}
                  onClick={() => onToggleLayer(category)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    darkMode ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                  } ${!visible ? 'opacity-40' : ''}`}
                >
                  <span className="text-base">{CATEGORY_ICONS[category]}</span>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[category] }} />
                  <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
                  {visible ? <Eye size={14} className="text-green-400 flex-shrink-0" />
                    : <EyeOff size={14} className="text-gray-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
