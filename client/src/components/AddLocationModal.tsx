import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import type { Location, LocationCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

interface AddLocationModalProps {
  coords: { lat: number; lng: number };
  onClose: () => void;
  onCreate: (location: Partial<Location>) => Promise<void>;
  darkMode: boolean;
}

const categories: LocationCategory[] = ['campsite', 'riding', 'water', 'dump', 'scenic'];

export default function AddLocationModal({ coords, onClose, onCreate, darkMode }: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LocationCategory>('campsite');
  const [description, setDescription] = useState('');
  const [subType, setSubType] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility] = useState<'public' | 'private'>('private');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        category,
        sub_type: subType || null,
        description: description || null,
        notes: notes || null,
        source: 'user',
        visibility,
      } as Partial<Location>);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border ${
    darkMode ? 'bg-dark-800 border-gray-600 text-gray-100 focus:border-orange-500' : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
  } outline-none transition-colors`;

  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        darkMode ? 'bg-dark-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            Add Location
          </h2>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-dark-700' : 'hover:bg-gray-100'} transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coordinates */}
        <div className={`px-4 py-2 text-xs ${darkMode ? 'bg-dark-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Location name"
              className={inputClass}
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    category === cat
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 ring-1 ring-orange-500/30'
                      : darkMode
                        ? 'bg-dark-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                  <span className="truncate w-full text-center">{CATEGORY_LABELS[cat].split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sub Type */}
          {category === 'campsite' && (
            <div>
              <label className={labelClass}>Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'boondocking', label: '⛺ Boondocking' },
                  { value: 'campground', label: '🏕️ Campground' },
                  { value: 'parking', label: '🅿️ Overnight Parking' },
                  { value: 'other', label: '🏕️ Other' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setSubType(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      subType === opt.value
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        : darkMode
                          ? 'bg-dark-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {category === 'riding' && (
            <div>
              <label className={labelClass}>Trail Type</label>
              <input type="text" value={subType} onChange={e => setSubType(e.target.value)}
                placeholder="Single Track, Fire Road, Enduro..."
                className={inputClass} />
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this location..."
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Personal notes..."
              rows={2}
              className={inputClass}
            />
          </div>

          {/* Visibility Note */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            darkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
          }`}>
            <span>🔒</span>
            <span className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              This location will be private — only visible to you
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                darkMode ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
