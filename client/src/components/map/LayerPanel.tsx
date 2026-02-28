import { Layers, ChevronUp } from 'lucide-react';
import type { LocationCategory, CampsiteSubType, MapStyle } from '../../types';
import {
  CATEGORY_COLORS, CATEGORY_ICONS,
  CAMPSITE_SUBTYPE_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_LABELS,
  MAP_STYLES,
} from '../../types';
import { BLM_FILL_COLOR, USFS_FILL_COLOR } from './constants';



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
  campsiteSubTypes?: Set<CampsiteSubType>;
  onToggleCampsiteSubType?: (subType: CampsiteSubType) => void;
  mapStyle: MapStyle;
  onChangeMapStyle: (style: MapStyle) => void;
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-6 h-3.5 rounded-full flex-shrink-0 transition-colors ${on ? 'bg-orange-500' : 'bg-dark-600'}`}>
      <div className={`w-2.5 h-2.5 rounded-full bg-white mt-0.5 transition-transform ${on ? 'translate-x-3' : 'translate-x-0.5'}`} />
    </div>
  );
}

function LayerRow({ emoji, color, label, visible, onToggle }: {
  emoji: string; color: string; label: string; visible: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-2.5 py-1 transition-colors hover:bg-dark-700/50 text-gray-200 ${!visible ? 'opacity-40' : ''}`}
    >
      <span className="text-xs">{emoji}</span>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="flex-1 text-left text-[11px]">{label}</span>
      <Toggle on={visible} />
    </button>
  );
}

export default function LayerPanel({
  isOpen, onToggle, visibleLayers, onToggleLayer,
  blmVisible, onToggleBlm, usfsVisible, onToggleUsfs,
  campsiteSubTypes, onToggleCampsiteSubType,
  mapStyle, onChangeMapStyle,
}: LayerPanelProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors"
      >
        <Layers size={16} />
        <span className="text-sm font-medium">Layers</span>
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-10 w-[200px] rounded-xl shadow-xl border border-dark-600/50 overflow-hidden glass">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2.5 py-2 border-b border-dark-600/30 hover:bg-dark-700/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-200">
          <Layers size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Layers</span>
        </div>
        <ChevronUp size={12} className="text-gray-500" />
      </button>

      {/* Map Style */}
      <div className="flex border-b border-dark-600/30">
        {MAP_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => onChangeMapStyle(s)}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
              mapStyle.id === s.id
                ? 'text-orange-400 bg-dark-700/40'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Camp types */}
      <div className="py-0.5">
        {(['campground', 'boondocking', 'parking', 'other'] as CampsiteSubType[]).map((st) => {
          const visible = visibleLayers.has('campsite') && (campsiteSubTypes?.has(st) ?? true);
          return (
            <LayerRow
              key={st}
              emoji={CAMPSITE_SUBTYPE_ICONS[st]}
              color={CAMPSITE_SUBTYPE_COLORS[st]}
              label={CAMPSITE_SUBTYPE_LABELS[st]}
              visible={visible}
              onToggle={() => onToggleCampsiteSubType?.(st)}
            />
          );
        })}
      </div>

      {/* Other location types */}
      <div className="border-t border-dark-600/30 py-0.5">
        <LayerRow emoji={CATEGORY_ICONS.riding} color={CATEGORY_COLORS.riding} label="Riding Areas" visible={visibleLayers.has('riding')} onToggle={() => onToggleLayer('riding')} />
        <LayerRow emoji={CATEGORY_ICONS.water} color={CATEGORY_COLORS.water} label="Water Stations" visible={visibleLayers.has('water')} onToggle={() => onToggleLayer('water')} />
        <LayerRow emoji={CATEGORY_ICONS.dump} color={CATEGORY_COLORS.dump} label="Dump Stations" visible={visibleLayers.has('dump')} onToggle={() => onToggleLayer('dump')} />
        <LayerRow emoji={CATEGORY_ICONS.scenic} color={CATEGORY_COLORS.scenic} label="Scenic Viewpoints" visible={visibleLayers.has('scenic')} onToggle={() => onToggleLayer('scenic')} />
      </div>

      {/* Land overlays */}
      <div className="border-t border-dark-600/30 py-0.5">
        <LayerRow emoji="🏜️" color={BLM_FILL_COLOR} label="BLM Land" visible={blmVisible} onToggle={onToggleBlm} />
        <LayerRow emoji="🌲" color={USFS_FILL_COLOR} label="National Forests" visible={usfsVisible} onToggle={onToggleUsfs} />
      </div>
    </div>
  );
}
