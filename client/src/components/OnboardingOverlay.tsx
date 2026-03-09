import { useState } from 'react';
import { X } from 'lucide-react';
import type { LocationCategory } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_LABELS } from '../types';

const HOBBY_GROUPS = [
  {
    title: 'Camping & Stays',
    categories: ['campsite'] as LocationCategory[],
  },
  {
    title: 'Trail Activities',
    categories: ['hiking', 'riding', 'mtb', 'offroad', 'horseback', 'climbing'] as LocationCategory[],
  },
  {
    title: 'Water Activities',
    categories: ['fishing', 'boating', 'kayaking', 'swimming'] as LocationCategory[],
  },
  {
    title: 'Other',
    categories: ['hunting', 'water', 'dump', 'scenic'] as LocationCategory[],
  },
];

interface OnboardingOverlayProps {
  onComplete: (selected: Set<LocationCategory>) => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [selected, setSelected] = useState<Set<LocationCategory>>(new Set(['campsite']));

  const toggle = (cat: LocationCategory) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const selectAll = () => {
    const all = HOBBY_GROUPS.flatMap(g => g.categories);
    setSelected(new Set(all));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-600/50 shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 pb-3 text-center">
          <h2 className="text-xl font-bold text-white">Welcome to TrailCamp</h2>
          <p className="text-gray-400 text-sm mt-1">What are you into? Pick your layers.</p>
        </div>

        {/* Category groups */}
        <div className="px-4 pb-3 space-y-4">
          {HOBBY_GROUPS.map(group => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {group.categories.map(cat => {
                  const isOn = selected.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggle(cat)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                        isOn
                          ? 'border-orange-500/50 bg-orange-500/10 text-white'
                          : 'border-dark-600/50 bg-dark-800/50 text-gray-400'
                      }`}
                    >
                      <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                      <span className="text-sm font-medium truncate">{CATEGORY_LABELS[cat]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 pt-2 space-y-2 border-t border-dark-600/30">
          <button
            onClick={selectAll}
            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Select All
          </button>
          <button
            onClick={() => onComplete(selected)}
            disabled={selected.size === 0}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            Show Map ({selected.size} layer{selected.size !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
