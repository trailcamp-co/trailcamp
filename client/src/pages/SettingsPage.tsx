import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, User, MapPin, Save, Loader2, Trash2,
  Sun, Moon, Monitor, Mountain,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  home_lat: number | null;
  home_lon: number | null;
  home_address: string | null;
  units_preference: string;
  theme: string;
  tier: string;
  created_at: string;
}

export default function SettingsPage() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeLat, setHomeLat] = useState('');
  const [homeLon, setHomeLon] = useState('');
  const [units, setUnits] = useState('imperial');
  const [theme, setTheme] = useState('system');

  const fetchProfile = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDisplayName(data.display_name || '');
        setHomeAddress(data.home_address || '');
        setHomeLat(data.home_lat?.toString() || '');
        setHomeLon(data.home_lon?.toString() || '');
        setUnits(data.units_preference || 'imperial');
        setTheme(data.theme || 'system');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
    setLoading(false);
  }, [session?.access_token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          display_name: displayName || null,
          home_address: homeAddress || null,
          home_lat: homeLat ? parseFloat(homeLat) : null,
          home_lon: homeLon ? parseFloat(homeLon) : null,
          units_preference: units,
          theme,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setMessage({ type: 'success', text: 'Settings saved!' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
    setSaving(false);
  };

  const handleGeocodeAddress = async () => {
    if (!homeAddress.trim()) return;
    let token = (window as unknown as Record<string, unknown>).__mapboxToken as string;
    if (!token) {
      // Fetch token if not cached (Settings page may load before App)
      try {
        const res = await fetch(`${API_BASE}/mapbox-token`);
        const data = await res.json();
        token = data.token;
        (window as unknown as Record<string, unknown>).__mapboxToken = token;
      } catch { return; }
    }
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(homeAddress)}.json?access_token=${token}&limit=1&country=US`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        const [lon, lat] = data.features[0].center;
        setHomeLat(lat.toFixed(6));
        setHomeLon(lon.toFixed(6));
        setHomeAddress(data.features[0].place_name || homeAddress);
      }
    } catch {
      // Geocoding failed silently
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently remove all your data including trips, private locations, and favorites. This cannot be undone.')) {
      return;
    }
    if (!session?.access_token) return;

    try {
      await fetch(`${API_BASE}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      await signOut();
      navigate('/login');
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete account' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-700 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-dark-700 transition text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Mountain className="w-5 h-5 text-orange-500" />
            </div>
            <h1 className="text-lg font-semibold text-white">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-400" /> Profile
          </h2>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition" />
            </div>

            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-dark-800 border border-dark-600 rounded-md text-gray-400">
                Tier: {profile?.tier || 'free'}
              </span>
              <span className="px-2 py-1 bg-dark-800 border border-dark-600 rounded-md text-gray-400">
                Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Home Address Section */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" /> Home Address
          </h2>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Address</label>
              <div className="flex gap-2">
                <input type="text" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="flex-1 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition" />
                <button onClick={handleGeocodeAddress}
                  className="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-gray-300 rounded-lg transition text-sm whitespace-nowrap">
                  📍 Locate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Used to calculate "distance from home" on locations</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Latitude</label>
                <input type="text" value={homeLat} onChange={(e) => setHomeLat(e.target.value)}
                  placeholder="41.5925"
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Longitude</label>
                <input type="text" value={homeLon} onChange={(e) => setHomeLon(e.target.value)}
                  placeholder="-81.3614"
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition" />
              </div>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Units</label>
              <div className="flex gap-2">
                {(['imperial', 'metric'] as const).map((u) => (
                  <button key={u} onClick={() => setUnits(u)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      units === u
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        : 'bg-dark-800 text-gray-400 border border-dark-600 hover:border-dark-500'
                    }`}>
                    {u === 'imperial' ? '🇺🇸 Miles / °F' : '🌍 Km / °C'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <div className="flex gap-2">
                {[
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map(({ value, icon: Icon, label }) => (
                  <button key={value} onClick={() => setTheme(value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                      theme === value
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        : 'bg-dark-800 text-gray-400 border border-dark-600 hover:border-dark-500'
                    }`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium rounded-xl transition flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>

        {/* Danger Zone */}
        <section>
          <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
          <div className="bg-dark-900 border border-red-500/20 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-4">
              Permanently delete your account and all associated data (trips, private locations, favorites).
              This action cannot be undone.
            </p>
            <button onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
