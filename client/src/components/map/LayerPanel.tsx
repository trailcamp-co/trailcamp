import { Layers } from 'lucide-react';
import type { LocationCategory, CampsiteSubType, MapStyle } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CAMPSITE_SUBTYPE_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_LABELS } from '../../types';
import { BLM_FILL_COLOR, USFS_FILL_COLOR } from './constants';

const ALL_CAMPSITE_SUBTYPES: CampsiteSubType[] = ['boondocking', 'campground', 'parking', 'other'];

/** Non-campsite categories to show */
const OTHER_CATEGORIES: { key: LocationCategory; label: string }[] = [
  { key: 'riding', label: 'Riding Areas' },
  { key: 'water', label: 'Water Stations' },
  { key: 'dump', label: 'Dump Stations' },
  { key: 'scenic', label: 'Scenic Viewpoints' },
];

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
  mapStyle: { id: string; name: string; url: string };
  onChangeMapStyle: (style: MapStyle) => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`w-7 h-4 rounded-full flex-shrink-0 cursor-pointer transition-colors ${on ? 'bg-orange-500' : 'bg-dark-600'}`}
    >
      <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
    </div>
  );
}

function LayerRow({ emoji, color, label, visible, onToggle }: {
  emoji: string; color: string; label: string; visible: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-dark-700/50 text-gray-200 ${!visible ? 'opacity-40' : ''}`}
    >
      <span className="text-sm">{emoji}</span>
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="flex-1 text-left text-xs">{label}</span>
      <Toggle on={visible} onToggle={onToggle} />
    </button>
  );
}

export default function LayerPanel({
  isOpen, onToggle, visibleLayers, onToggleLayer,
  blmVisible, onToggleBlm, usfsVisible, onToggleUsfs,
  campsiteSubTypes, onToggleCampsiteSubType,
}: LayerPanelProps) {
  return (
    <div className="absolute top-3 right-3 z-10">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors"
      >
        <Layers size={16} />
        <span className="text-sm font-medium">Layers</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[210px] rounded-xl shadow-xl border border-dark-600/50 overflow-hidden glass animate-scale-in">
          {/* Locations */}
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-dark-600/30">
            Locations
          </div>
          <div className="py-0.5">
            {/* Riding */}
            <LayerRow
              emoji={CATEGORY_ICONS.riding}
              color={CATEGORY_COLORS.riding}
              label="Riding Areas"
              visible={visibleLayers.has('riding')}
              onToggle={() => onToggleLayer('riding')}
            />
            {/* Campsite sub-types as top-level items */}
            {ALL_CAMPSITE_SUBTYPES.map((st) => {
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
            {/* Other categories */}
            {OTHER_CATEGORIES.filter(c => c.key !== 'riding').map(({ key, label }) => (
              <LayerRow
                key={key}
                emoji={CATEGORY_ICONS[key]}
                color={CATEGORY_COLORS[key]}
                label={label}
                visible={visibleLayers.has(key)}
                onToggle={() => onToggleLayer(key)}
              />
            ))}
          </div>

          {/* Land Overlays */}
          <div className="border-t border-dark-600/30">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Overlays
            </div>
            <div className="py-0.5">
              <LayerRow emoji="🏜️" color={BLM_FILL_COLOR} label="BLM Land" visible={blmVisible} onToggle={onToggleBlm} />
              <LayerRow emoji="🌲" color={USFS_FILL_COLOR} label="National Forests" visible={usfsVisible} onToggle={onToggleUsfs} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
