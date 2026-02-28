import { useState, useCallback, useEffect } from 'react';
import { Check, Plus, Trash2, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react';

interface PackingItem {
  id: string;
  text: string;
  checked: boolean;
  category: string;
}

const DEFAULT_CATEGORIES: Record<string, string[]> = {
  'Truck & Camper': [
    'Check tire pressure (truck + spare)',
    'Top off all fluids (oil, coolant, washer)',
    'Test trailer/camper lights',
    'Fill fresh water tank',
    'Dump grey/black tanks',
    'Propane tanks full',
    'Generator fueled + tested',
    'Starlink packed + tested',
    'Level blocks / chocks',
    'Power cord + adapters',
    'Check battery levels',
  ],
  'Dirt Bikes': [
    'Check tire pressure + tread',
    'Chain lube + tension',
    'Coolant level check',
    'Brake fluid + pad wear',
    'Air filter clean/replaced',
    'Spark plug condition',
    'Tool kit (bike-specific)',
    'Tube repair kit / plugs',
    'Extra oil + coolant',
    'Tie-down straps',
    'Hitch carriers secured',
    'Registration + insurance cards',
    'Riding gear (helmet, boots, gloves, goggles)',
    'Hydration pack',
    'Charge Varg batteries',
  ],
  'Camping Essentials': [
    'Sleeping bag/bedding',
    'Pillows',
    'Camp chairs',
    'Flashlight/headlamp + batteries',
    'Fire starter / matches',
    'Cooler + ice',
    'Camp stove + fuel',
    'Cookware + utensils',
    'Plates/bowls/cups',
    'Trash bags',
    'First aid kit',
    'Sunscreen + bug spray',
    'Maps (offline downloaded)',
    'Camp table',
  ],
  'Personal': [
    'Clothing (layers)',
    'Rain gear',
    'Toiletries',
    'Medications',
    'Phone chargers',
    'Camera + batteries',
    'Wallet / ID / cards',
    'Cash (small bills)',
    'Sunglasses',
    'Hat',
  ],
  'Recovery & Safety': [
    'Tow straps / recovery kit',
    'Jumper cables / battery pack',
    'Shovel',
    'Fire extinguisher',
    'Satellite communicator / PLB',
    'Tool set (truck)',
    'Jack + lug wrench',
    'Zip ties + duct tape',
    'Spare fuses',
  ],
};

const STORAGE_KEY = 'trailcamp_packing_list';

export default function PackingList() {
  const [items, setItems] = useState<PackingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initialize from defaults
    return Object.entries(DEFAULT_CATEGORIES).flatMap(([cat, texts]) =>
      texts.map((text, i) => ({
        id: `${cat}-${i}`,
        text,
        checked: false,
        category: cat,
      }))
    );
  });

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(Object.keys(DEFAULT_CATEGORIES)));
  const [newItemText, setNewItemText] = useState('');
  const [newItemCat, setNewItemCat] = useState(Object.keys(DEFAULT_CATEGORIES)[0]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleItem = useCallback((id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addItem = useCallback(() => {
    if (!newItemText.trim()) return;
    setItems(prev => [...prev, {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
      category: newItemCat,
    }]);
    setNewItemText('');
  }, [newItemText, newItemCat]);

  const resetAll = useCallback(() => {
    if (!confirm('Reset packing list to defaults?')) return;
    const defaults = Object.entries(DEFAULT_CATEGORIES).flatMap(([cat, texts]) =>
      texts.map((text, i) => ({
        id: `${cat}-${i}`,
        text,
        checked: false,
        category: cat,
      }))
    );
    setItems(defaults);
  }, []);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const categories = [...new Set(items.map(i => i.category))];
  const totalChecked = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? Math.round((totalChecked / items.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-700/50 [.light_&]:border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <PackageCheck size={16} className="text-orange-400" />
            Packing List
          </h2>
          <button
            onClick={resetAll}
            className="text-[10px] px-2 py-1 rounded-md bg-dark-800 text-gray-500 hover:text-gray-300 border border-dark-700/50 transition-colors
              [.light_&]:bg-gray-100 [.light_&]:text-gray-400 [.light_&]:hover:text-gray-600 [.light_&]:border-gray-200"
          >
            Reset
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-dark-800 [.light_&]:bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 [.light_&]:text-gray-500 tabular-nums">
            {totalChecked}/{items.length}
          </span>
        </div>

        {/* Export/Import buttons */}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => {
              const data = JSON.stringify(items, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'trailcamp-packing-list.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 text-[10px] px-2 py-1 rounded-md bg-dark-800 text-gray-400 hover:text-gray-300 border border-dark-700/50 transition-colors"
          >
            💾 Export
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/json';
              input.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  try {
                    const imported = JSON.parse(evt.target?.result as string);
                    setItems(imported);
                  } catch { /* invalid JSON */ }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            className="flex-1 text-[10px] px-2 py-1 rounded-md bg-dark-800 text-gray-400 hover:text-gray-300 border border-dark-700/50 transition-colors"
          >
            📂 Import
          </button>
        </div>

        {/* Add item */}
        <div className="flex gap-1.5 mt-3">
          <select
            value={newItemCat}
            onChange={(e) => setNewItemCat(e.target.value)}
            className="bg-dark-800 border border-dark-700/50 rounded-lg px-2 py-1.5 text-[10px] text-gray-400 focus:outline-none focus:border-orange-500
              [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-gray-600"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add item..."
            className="flex-1 bg-dark-800 border border-dark-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500
              [.light_&]:bg-white [.light_&]:border-gray-200 [.light_&]:text-gray-700 [.light_&]:placeholder-gray-400"
          />
          <button
            onClick={addItem}
            disabled={!newItemText.trim()}
            className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all disabled:opacity-30
              [.light_&]:bg-orange-100 [.light_&]:text-orange-600 [.light_&]:border-orange-200"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Categories & Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat);
          const catChecked = catItems.filter(i => i.checked).length;
          const expanded = expandedCats.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-dark-800/50 [.light_&]:hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-300 [.light_&]:text-gray-700">{cat}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 tabular-nums">{catChecked}/{catItems.length}</span>
                  {expanded ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
                </div>
              </button>

              {expanded && (
                <div className="space-y-0.5 ml-1">
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg group hover:bg-dark-800/30 [.light_&]:hover:bg-gray-50 transition-colors"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                          item.checked
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'border-dark-600 [.light_&]:border-gray-300 hover:border-orange-400'
                        }`}
                      >
                        {item.checked && <Check size={10} />}
                      </button>
                      <span className={`text-xs flex-1 ${item.checked ? 'line-through text-gray-600 [.light_&]:text-gray-400' : 'text-gray-300 [.light_&]:text-gray-700'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-0.5 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
