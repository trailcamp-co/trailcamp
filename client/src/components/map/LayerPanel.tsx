import { Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { LocationCategory, CampsiteSubType, MapStyle } from '../../types';
import {
  CATEGORY_COLORS, CATEGORY_ICONS,
  CAMPSITE_SUBTYPE_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_LABELS,
  MAP_STYLES,
} from '../../types';
// Land overlay colors now come from BLM raster tile service



interface LayerPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  visibleLayers: Set<LocationCategory>;
  onToggleLayer: (category: LocationCategory) => void;
  publicLandVisible: boolean;
  onTogglePublicLand: () => void;
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

function CollapsibleGroup({ title, forceOpen = false, children }: { title: string; forceOpen?: boolean; children: React.ReactNode }) {
  const [manualToggle, setManualToggle] = useState<boolean | null>(null);
  const open = manualToggle !== null ? manualToggle : forceOpen;
  return (
    <div className="border-t border-dark-600/30">
      <button
        onClick={() => setManualToggle(open ? false : true)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {title}
          {forceOpen && !open && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
        </div>
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {open && <div className="pb-0.5">{children}</div>}
    </div>
  );
}

export default function LayerPanel({
  isOpen, onToggle, visibleLayers, onToggleLayer,
  publicLandVisible, onTogglePublicLand,
  campsiteSubTypes, onToggleCampsiteSubType,
  mapStyle, onChangeMapStyle,
}: LayerPanelProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-14 lg:top-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors"
      >
        <Layers size={16} />
        <span className="text-sm font-medium">Layers</span>
      </button>
    );
  }

  const activityCats: LocationCategory[] = ['hiking', 'riding', 'mtb', 'offroad', 'horseback', 'climbing', 'fishing', 'boating', 'kayaking', 'swimming', 'hunting'];
  const serviceCats: LocationCategory[] = ['water', 'dump', 'scenic'];
  const hasActiveActivity = activityCats.some(c => visibleLayers.has(c));
  const hasActiveService = serviceCats.some(c => visibleLayers.has(c));

  return (
    <div className="absolute top-14 lg:top-3 right-3 z-50 w-[200px] rounded-xl shadow-xl border border-dark-600/50 overflow-hidden glass">
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

      <div className="border-b border-dark-600/30">
        <div className="lg:hidden px-2.5 py-1.5">
          <select
            value={mapStyle.id}
            onChange={(e) => {
              const s = MAP_STYLES.find(st => st.id === e.target.value);
              if (s) onChangeMapStyle(s);
            }}
            className="w-full bg-dark-800 border border-dark-600/50 rounded-lg px-2 py-1.5 text-xs text-gray-200 outline-none appearance-none cursor-pointer"
          >
            {MAP_STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden lg:flex">
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
      </div>

      <div className="py-0.5">
        {(['campground', 'boondocking', 'parking'] as CampsiteSubType[]).map((st) => {
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

      <CollapsibleGroup title="Activities" forceOpen={hasActiveActivity}>
        <LayerRow emoji={CATEGORY_ICONS.hiking} color={CATEGORY_COLORS.hiking} label="Hiking" visible={visibleLayers.has('hiking')} onToggle={() => onToggleLayer('hiking')} />
        <LayerRow emoji={CATEGORY_ICONS.riding} color={CATEGORY_COLORS.riding} label="Dirt Bikes" visible={visibleLayers.has('riding')} onToggle={() => onToggleLayer('riding')} />
        <LayerRow emoji={CATEGORY_ICONS.mtb} color={CATEGORY_COLORS.mtb} label="MTB" visible={visibleLayers.has('mtb')} onToggle={() => onToggleLayer('mtb')} />
        <LayerRow emoji={CATEGORY_ICONS.offroad} color={CATEGORY_COLORS.offroad} label="4x4 / Off-Road" visible={visibleLayers.has('offroad')} onToggle={() => onToggleLayer('offroad')} />
        <LayerRow emoji={CATEGORY_ICONS.horseback} color={CATEGORY_COLORS.horseback} label="Horseback" visible={visibleLayers.has('horseback')} onToggle={() => onToggleLayer('horseback')} />
        <LayerRow emoji={CATEGORY_ICONS.climbing} color={CATEGORY_COLORS.climbing} label="Climbing" visible={visibleLayers.has('climbing')} onToggle={() => onToggleLayer('climbing')} />
        <LayerRow emoji={CATEGORY_ICONS.fishing} color={CATEGORY_COLORS.fishing} label="Fishing" visible={visibleLayers.has('fishing')} onToggle={() => onToggleLayer('fishing')} />
        <LayerRow emoji={CATEGORY_ICONS.boating} color={CATEGORY_COLORS.boating} label="Boating" visible={visibleLayers.has('boating')} onToggle={() => onToggleLayer('boating')} />
        <LayerRow emoji={CATEGORY_ICONS.kayaking} color={CATEGORY_COLORS.kayaking} label="Kayaking" visible={visibleLayers.has('kayaking')} onToggle={() => onToggleLayer('kayaking')} />
        <LayerRow emoji={CATEGORY_ICONS.swimming} color={CATEGORY_COLORS.swimming} label="Swimming" visible={visibleLayers.has('swimming')} onToggle={() => onToggleLayer('swimming')} />
        <LayerRow emoji={CATEGORY_ICONS.hunting} color={CATEGORY_COLORS.hunting} label="Hunting" visible={visibleLayers.has('hunting')} onToggle={() => onToggleLayer('hunting')} />
      </CollapsibleGroup>

      <CollapsibleGroup title="Services" forceOpen={hasActiveService}>
        <LayerRow emoji={CATEGORY_ICONS.water} color={CATEGORY_COLORS.water} label="Water Stations" visible={visibleLayers.has('water')} onToggle={() => onToggleLayer('water')} />
        <LayerRow emoji={CATEGORY_ICONS.dump} color={CATEGORY_COLORS.dump} label="Dump Stations" visible={visibleLayers.has('dump')} onToggle={() => onToggleLayer('dump')} />
        <LayerRow emoji={CATEGORY_ICONS.scenic} color={CATEGORY_COLORS.scenic} label="Scenic Views" visible={visibleLayers.has('scenic')} onToggle={() => onToggleLayer('scenic')} />
      </CollapsibleGroup>

      <CollapsibleGroup title="Land Overlays" forceOpen={publicLandVisible}>
        <LayerRow emoji="🗺️" color="#f59e0b" label="Public Lands (All)" visible={publicLandVisible} onToggle={onTogglePublicLand} />
        <div className="px-2.5 py-1 text-[9px] text-gray-600 leading-relaxed">
          BLM · USFS · NPS · State · FWS · DOD · BOR
        </div>
      </CollapsibleGroup>
    </div>
  );
}
