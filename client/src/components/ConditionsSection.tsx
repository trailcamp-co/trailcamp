import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, Loader2, Send, Trash2, ChevronDown } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Categories that support condition reports
const SUPPORTED_CATEGORIES = [
  'hiking', 'mtb', 'riding', 'offroad', 'horseback', 'climbing',
  'campsite', 'boating', 'swimming', 'fishing',
];

// Labels per category
const SECTION_LABELS: Record<string, string> = {
  hiking: 'Trail Conditions',
  mtb: 'Trail Conditions',
  riding: 'Trail Conditions',
  offroad: 'Road Conditions',
  horseback: 'Trail Conditions',
  climbing: 'Climbing Conditions',
  campsite: 'Site Conditions',
  boating: 'Ramp Conditions',
  swimming: 'Water Conditions',
  fishing: 'Fishing Report',
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  info: { color: 'text-gray-300', bg: 'bg-gray-500/15 border-gray-500/30', label: 'Info' },
  caution: { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', label: 'Caution' },
  warning: { color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', label: 'Warning' },
  danger: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Danger' },
  closed: { color: 'text-red-500', bg: 'bg-red-500/20 border-red-500/40', label: 'Closed' },
};

interface Condition {
  id: number;
  condition_type: string;
  severity: string;
  description: string | null;
  expires_at: string;
  created_at: string;
  author: string;
  is_own: boolean;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return { 'Content-Type': 'application/json' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function expiresIn(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'expiring soon';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

interface Props {
  locationId: number;
  category: string;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ConditionsSection({ locationId, category, showToast }: Props) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionTypes, setConditionTypes] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('info');
  const [description, setDescription] = useState('');

  // Don't render for unsupported categories
  if (!SUPPORTED_CATEGORIES.includes(category)) return null;

  const fetchConditions = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/conditions/${locationId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConditions(data.conditions);
      }
    } catch {}
    setLoading(false);
  }, [locationId]);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/conditions/types/${category}`);
      if (res.ok) {
        const data = await res.json();
        setConditionTypes(data.types || []);
      }
    } catch {}
  }, [category]);

  useEffect(() => { setLoading(true); fetchConditions(); fetchTypes(); }, [fetchConditions, fetchTypes]);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/conditions/${locationId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          condition_type: selectedType,
          severity: selectedSeverity,
          description: description || undefined,
        }),
      });
      if (res.ok) {
        showToast?.('Condition reported!', 'success');
        setShowForm(false);
        setSelectedType('');
        setSelectedSeverity('info');
        setDescription('');
        fetchConditions();
      } else {
        const err = await res.json();
        showToast?.(err.error || 'Failed to submit', 'error');
      }
    } catch {
      showToast?.('Failed to submit', 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/conditions/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setConditions(c => c.filter(r => r.id !== id));
        showToast?.('Report removed', 'success');
      }
    } catch {}
  };

  if (loading) return null;

  const sectionLabel = SECTION_LABELS[category] || 'Conditions';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {sectionLabel} {conditions.length > 0 && `(${conditions.length})`}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-dark-800 hover:bg-dark-700 text-orange-400 border border-dark-700/50 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          Report
        </button>
      </div>

      {/* Active condition badges */}
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {conditions.map((c) => {
            const sev = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG.info;
            return (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${sev.bg} ${sev.color}`}
              >
                {c.severity === 'closed' && <X className="w-2.5 h-2.5" />}
                {c.condition_type}
              </span>
            );
          })}
        </div>
      )}

      {/* Detailed reports list */}
      {conditions.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {conditions.map((c) => {
            const sev = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG.info;
            return (
              <div key={c.id} className={`rounded-lg px-3 py-2 border ${sev.bg}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${sev.color}`}>{c.condition_type}</span>
                      <span className="text-[10px] text-gray-500">· {sev.label}</span>
                    </div>
                    {c.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{c.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600">
                      <span>{c.author}</span>
                      <span>·</span>
                      <span>{timeAgo(c.created_at)}</span>
                      <span>·</span>
                      <span>{expiresIn(c.expires_at)}</span>
                    </div>
                  </div>
                  {c.is_own && (
                    <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-600 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {conditions.length === 0 && !showForm && (
        <p className="text-[11px] text-gray-600 mb-2">No recent reports</p>
      )}

      {/* Report form */}
      {showForm && (
        <div className="rounded-xl bg-dark-800 border border-dark-700/50 p-3 space-y-3">
          {/* Condition type chips */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1.5">What's the condition?</label>
            <div className="flex flex-wrap gap-1.5">
              {conditionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                    selectedType === type
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-dark-700 text-gray-400 border-dark-600/50 hover:border-dark-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1.5">How serious?</label>
            <div className="flex gap-1">
              {Object.entries(SEVERITY_CONFIG).map(([key, conf]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSeverity(key)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors border ${
                    selectedSeverity === key
                      ? `${conf.bg} ${conf.color}`
                      : 'bg-dark-700 text-gray-500 border-dark-600/50'
                  }`}
                >
                  {conf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
            maxLength={500}
            rows={2}
            className="w-full text-xs rounded-lg px-3 py-2 resize-none bg-dark-900 border border-dark-700/50 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />

          {/* Submit */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedType || submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit Report
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-dark-700 text-gray-400 hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
