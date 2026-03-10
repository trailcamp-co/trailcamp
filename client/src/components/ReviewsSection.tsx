import { useState, useEffect, useCallback } from 'react';
import { Star, Send, Loader2, Trash2, Edit3 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Review {
  id: number;
  rating: number;
  title: string | null;
  content: string | null;
  visited_date: string | null;
  created_at: string;
  author: string;
  is_own: boolean;
}

interface ReviewsData {
  reviews: Review[];
  average_rating: number | null;
  review_count: number;
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

interface Props {
  locationId: number;
  darkMode: boolean;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ReviewsSection({ locationId, darkMode, showToast }: Props) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formHover, setFormHover] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/reviews/${locationId}`, { headers });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [locationId]);

  useEffect(() => { setLoading(true); fetchReviews(); }, [fetchReviews]);

  // Pre-fill form if user has existing review
  useEffect(() => {
    if (data?.reviews) {
      const own = data.reviews.find(r => r.is_own);
      if (own) {
        setFormRating(own.rating);
        setFormTitle(own.title || '');
        setFormContent(own.content || '');
      }
    }
  }, [data?.reviews]);

  const handleSubmit = async () => {
    if (formRating === 0) return;
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/reviews/${locationId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating: formRating,
          title: formTitle || null,
          content: formContent || null,
        }),
      });
      if (res.ok) {
        showToast?.('Review submitted', 'success');
        setShowForm(false);
        await fetchReviews();
      }
    } catch {
      showToast?.('Failed to save review', 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete your review?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_BASE}/reviews/${locationId}`, { method: 'DELETE', headers });
      setFormRating(0); setFormTitle(''); setFormContent('');
      showToast?.('Review deleted', 'info');
      await fetchReviews();
    } catch {}
  };

  const bg = darkMode ? 'bg-dark-800' : 'bg-gray-50';
  const border = darkMode ? 'border-dark-700' : 'border-gray-200';
  const text2 = darkMode ? 'text-gray-400' : 'text-gray-500';
  const hasOwnReview = data?.reviews?.some(r => r.is_own);

  return (
    <div className="space-y-3">
      {/* Header with average */}
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Reviews {data?.review_count ? `(${data.review_count})` : ''}
        </h3>
        {data?.average_rating && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(data.average_rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
              ))}
            </div>
            <span className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {data.average_rating}
            </span>
          </div>
        )}
      </div>

      {/* Write review button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full py-2 rounded-lg text-sm font-medium transition ${
            darkMode ? 'bg-dark-700 hover:bg-dark-600 text-gray-300 border border-dark-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
          }`}
        >
          {hasOwnReview ? '✏️ Edit your review' : '⭐ Write a review'}
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <div className={`rounded-xl p-4 border ${border} ${bg} space-y-3`}>
          {/* Rating */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${text2}`}>Your Rating *</label>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onMouseEnter={() => setFormHover(s)} onMouseLeave={() => setFormHover(0)}
                  onClick={() => setFormRating(s)} className="p-0.5">
                  <Star className={`w-6 h-6 transition ${
                    s <= (formHover || formRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${text2}`}>Title (optional)</label>
            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Sum it up..." maxLength={200}
              className={`w-full px-3 py-2 rounded-lg text-sm border ${darkMode ? 'bg-dark-900 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-orange-500/50`} />
          </div>

          {/* Content */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${text2}`}>Review (optional)</label>
            <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)}
              placeholder="Share your experience..." rows={3} maxLength={2000}
              className={`w-full px-3 py-2 rounded-lg text-sm border ${darkMode ? 'bg-dark-900 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none`} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting || formRating === 0}
              className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {hasOwnReview ? 'Update' : 'Post Review'}
            </button>
            <button onClick={() => setShowForm(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className={`w-5 h-5 animate-spin ${text2}`} />
        </div>
      ) : data?.reviews && data.reviews.length > 0 ? (
        <div className="space-y-2">
          {data.reviews.map((review) => (
            <div key={review.id} className={`rounded-xl p-3 border ${border} ${bg}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {review.author}
                  </span>
                  {review.is_own && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">You</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] ${text2}`}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  {review.is_own && (
                    <button onClick={handleDelete} className="p-0.5 text-gray-500 hover:text-red-400 transition">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {review.title && (
                <p className={`text-sm font-medium mb-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{review.title}</p>
              )}
              {review.content && (
                <p className={`text-xs leading-relaxed ${text2}`}>{review.content}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-xs text-center py-3 ${text2}`}>No reviews yet. Be the first!</p>
      )}
    </div>
  );
}
