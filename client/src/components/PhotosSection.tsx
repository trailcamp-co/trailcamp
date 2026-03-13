import { hapticSuccess } from '../utils/haptics';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, X, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Photo {
  id: number;
  url: string;
  thumbnail_url: string;
  caption: string | null;
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
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  locationId: number;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PhotosSection({ locationId, showToast }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/photos/${locationId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos);
      }
    } catch {}
    setLoading(false);
  }, [locationId]);

  useEffect(() => { setLoading(true); fetchPhotos(); }, [fetchPhotos]);

  // Resize image client-side before upload (max 1200px, 80% JPEG quality)
  const resizeImage = (file: File, maxDim = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        // Scale down if either dimension exceeds max
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
      img.src = url;
    });
  };

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast?.('Image too large (max 5MB)', 'error');
      return;
    }
    setUploading(true);
    try {
      const b64 = await resizeImage(file);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/photos/${locationId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: b64 }),
      });
      if (res.ok) {
        hapticSuccess(); showToast?.('Photo uploaded!', 'success');
        fetchPhotos();
      } else {
        const err = await res.json();
        showToast?.(err.error || 'Upload failed', 'error');
      }
    } catch {
      showToast?.('Upload failed', 'error');
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/photos/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showToast?.('Photo deleted', 'success');
        setPhotos(p => p.filter(ph => ph.id !== id));
        setLightboxIdx(null);
      }
    } catch {}
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  if (loading) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Photos {photos.length > 0 && `(${photos.length})`}
        </span>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-dark-800 hover:bg-dark-700 text-orange-400 border border-dark-700/50 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          {uploading ? 'Uploading...' : 'Add Photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      </div>

      {photos.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-6 rounded-xl border-2 border-dashed border-dark-600/50 text-gray-500 text-sm hover:border-orange-500/30 hover:text-gray-400 transition-colors"
        >
          📷 Be the first to add a photo
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.slice(0, 6).map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIdx(idx)}
              className="relative aspect-square rounded-lg overflow-hidden bg-dark-800"
            >
              <img src={photo.thumbnail_url} alt={photo.caption || ''} loading="lazy"
                className="w-full h-full object-cover" />
              {idx === 5 && photos.length > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                  +{photos.length - 6}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && photos[lightboxIdx] && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col" onClick={() => setLightboxIdx(null)}>
          <div className="flex items-center justify-between p-3">
            <span className="text-xs text-gray-400">
              {photos[lightboxIdx].author} · {timeAgo(photos[lightboxIdx].created_at)}
            </span>
            <div className="flex items-center gap-2">
              {photos[lightboxIdx].is_own && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(photos[lightboxIdx!].id); }}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setLightboxIdx(null)} className="p-2 rounded-lg bg-dark-800 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            {lightboxIdx > 0 && (
              <button onClick={() => setLightboxIdx(i => (i ?? 1) - 1)}
                className="absolute left-2 p-2 rounded-full bg-dark-800/80 text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <img src={photos[lightboxIdx].url} alt={photos[lightboxIdx].caption || ''}
              className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            {lightboxIdx < photos.length - 1 && (
              <button onClick={() => setLightboxIdx(i => (i ?? 0) + 1)}
                className="absolute right-2 p-2 rounded-full bg-dark-800/80 text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          {photos[lightboxIdx].caption && (
            <p className="text-center text-sm text-gray-300 p-3">{photos[lightboxIdx].caption}</p>
          )}
          <div className="text-center text-xs text-gray-600 pb-3">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
