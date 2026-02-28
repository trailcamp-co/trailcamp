import { Layers } from 'lucide-react';
import type { LocationCategory, CampsiteSubType, MapStyle } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, CAMPSITE_SUBTYPE_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_LABELS, MAP_STYLES } from '../../types';
import { MAP_LAYER_CATEGORIES, BLM_FILL_COLOR, USFS_FILL_COLOR } from './constants';

const ALL_CAMPSITE_SUBTYPES: CampsiteSubType[] = ['boondocking', 'campground', 'parking', 'other'];

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

export default function LayerPanel({
  isOpen, onToggle, darkMode, visibleLayers, onToggleLayer,
  blmVisible, onToggleBlm, usfsVisible, onToggleUsfs,
  campsiteSubTypes, onToggleCampsiteSubType,
  mapStyle, onChangeMapStyle,
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
        <div className="mt-2 rounded-xl shadow-xl border border-dark-600/50 overflow-hidden glass animate-scale-in">
          {/* Header */}
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-dark-600/30">
            Map Layers
          </div>

          {/* Map Style Switcher */}
          <div className="border-b border-dark-600/30">
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Map Style
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-3">
              {MAP_STYLES.map((s) => (
                <button key={s.id} onClick={() => onChangeMapStyle(s)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    mapStyle.id === s.id
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-dark-800 text-gray-400 hover:text-gray-200 border border-transparent hover:border-dark-700'
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Overlays */}
          <div className="border-b border-dark-600/30">
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Overlays
            </div>
            <div className="py-0.5">
              <button onClick={onToggleBlm}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-dark-700/50 text-gray-200 ${!blmVisible ? 'opacity-50' : ''}`}>
                <span className="text-sm">🏜️</span>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: BLM_FILL_COLOR }} />
                <span className="flex-1 text-left text-xs">BLM Land</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${blmVisible ? 'bg-green-400' : 'bg-gray-600'}`} />
                <div className={`w-7 h-4 rounded-full flex-shrink-0 transition-colors ${blmVisible ? 'bg-orange-500' : 'bg-dark-600'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${blmVisible ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
              <button onClick={onToggleUsfs}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-dark-700/50 text-gray-200 ${!usfsVisible ? 'opacity-50' : ''}`}>
                <span className="text-sm">🌲</span>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: USFS_FILL_COLOR }} />
                <span className="flex-1 text-left text-xs">National Forests</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${usfsVisible ? 'bg-green-400' : 'bg-gray-600'}`} />
                <div className={`w-7 h-4 rounded-full flex-shrink-0 transition-colors ${usfsVisible ? 'bg-orange-500' : 'bg-dark-600'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${usfsVisible ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Categories
            </div>
            <div className="py-0.5">
              {MAP_LAYER_CATEGORIES.map((category) => {
                const visible = visibleLayers.has(category);
                return (
                  <div key={category}>
                    <button
                      onClick={() => onToggleLayer(category)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-dark-700/50 text-gray-200 ${!visible ? 'opacity-40' : ''}`}
                    >
                      <span className="text-sm">{CATEGORY_ICONS[category]}</span>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
                      <span className="flex-1 text-left text-xs">{CATEGORY_LABELS[category]}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${visible ? 'bg-green-400' : 'bg-gray-600'}`} />
                      <div className={`w-7 h-4 rounded-full flex-shrink-0 transition-colors ${visible ? 'bg-orange-500' : 'bg-dark-600'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${visible ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </div>
                    </button>

                    {/* Campsite sub-types */}
                    {category === 'campsite' && visible && campsiteSubTypes && onToggleCampsiteSubType && (
                      <div className="ml-8 py-0.5">
                        {ALL_CAMPSITE_SUBTYPES.map((st) => {
                          const stVisible = campsiteSubTypes.has(st);
                          return (
                            <button key={st} onClick={() => onToggleCampsiteSubType(st)}
                              className={`w-full flex items-center gap-2 px-2 py-1 text-xs transition-colors hover:bg-dark-700/50 text-gray-300 ${!stVisible ? 'opacity-40' : ''}`}>
                              <span>{CAMPSITE_SUBTYPE_ICONS[st]}</span>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAMPSITE_SUBTYPE_COLORS[st] }} />
                              <span className="flex-1 text-left">{CAMPSITE_SUBTYPE_LABELS[st]}</span>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stVisible ? 'bg-green-400' : 'bg-gray-600'}`} />
                              <div className={`w-6 h-3.5 rounded-full flex-shrink-0 transition-colors ${stVisible ? 'bg-orange-500' : 'bg-dark-600'}`}>
                                <div className={`w-2.5 h-2.5 rounded-full bg-white mt-0.5 transition-transform ${stVisible ? 'translate-x-3' : 'translate-x-0.5'}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
