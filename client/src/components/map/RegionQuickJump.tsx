import { useState } from 'react';
import { Compass } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

const REGIONS = [
  { name: 'Moab, UT', center: [-109.55, 38.57], zoom: 10 },
  { name: 'Sedona, AZ', center: [-111.76, 34.87], zoom: 11 },
  { name: 'PNW', center: [-121.5, 44.5], zoom: 6 },
  { name: 'Colorado Rockies', center: [-106.8, 39.0], zoom: 7 },
  { name: 'Southern CA', center: [-116.5, 34.0], zoom: 7 },
  { name: 'Northern CA', center: [-121.5, 39.5], zoom: 7 },
  { name: 'Idaho Backcountry', center: [-115.0, 44.5], zoom: 7 },
  { name: 'Montana/Wyoming', center: [-109.5, 45.5], zoom: 6 },
  { name: 'Nevada/Utah Desert', center: [-115.5, 38.5], zoom: 6 },
  { name: 'New Mexico', center: [-106.0, 34.5], zoom: 7 },
  { name: 'Appalachia', center: [-81.5, 37.5], zoom: 7 },
  { name: 'Hatfield-McCoy', center: [-81.7, 37.6], zoom: 10 },
  { name: 'Texas', center: [-99.0, 31.5], zoom: 6 },
  { name: 'Florida', center: [-82.5, 28.5], zoom: 7 },
  { name: 'Upper Midwest', center: [-86.0, 44.0], zoom: 6 },
  { name: 'Death Valley', center: [-117.2, 36.5], zoom: 9 },
  { name: 'San Juan Mountains', center: [-107.6, 37.9], zoom: 10 },
  { name: 'Sawtooth Valley', center: [-114.9, 43.9], zoom: 10 },
  { name: 'Alaska', center: [-150.0, 63.0], zoom: 4 },
  { name: 'Big Bend TX', center: [-103.9, 29.3], zoom: 9 },
  { name: 'Alaska', center: [-150.0, 63.5], zoom: 5 },
];

interface RegionQuickJumpProps {
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

export default function RegionQuickJump({ mapRef }: RegionQuickJumpProps) {
  const [open, setOpen] = useState(false);

  const handleJump = (region: typeof REGIONS[0]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: region.center as [number, number],
        zoom: region.zoom,
        duration: 2000,
      });
    }
    setOpen(false);
  };

  return (
    <div className="absolute bottom-16 right-4 z-10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-900/90 backdrop-blur-sm border border-dark-700/50 text-xs text-gray-300 hover:bg-dark-800 transition-all shadow-lg
          [.light_&]:bg-white/90 [.light_&]:border-gray-200 [.light_&]:text-gray-600 [.light_&]:hover:bg-gray-50"
      >
        <Compass size={13} />
        Quick Jump
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 p-2 rounded-xl bg-dark-900/95 backdrop-blur-sm border border-dark-700/50 shadow-xl animate-fade-in min-w-[180px] max-h-[320px] overflow-y-auto
          [.light_&]:bg-white/95 [.light_&]:border-gray-200">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-2">Regions</div>
          {REGIONS.map((region) => (
            <button
              key={region.name}
              onClick={() => handleJump(region)}
              className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-dark-700/50 hover:text-white transition-colors
                [.light_&]:text-gray-600 [.light_&]:hover:bg-gray-100 [.light_&]:hover:text-gray-900"
            >
              {region.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
