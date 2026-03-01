import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Manages the user's favorite locations.
 * Returns a Set of favorited location IDs and toggle function.
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const res = await fetch(`${API_BASE}/favorites`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(new Set(data.map((f: { location_id: number }) => f.location_id)));
      }
    } catch {}
    setLoading(false);
  }, []);

  // Fetch after a small delay to let auth hydrate
  useEffect(() => {
    const timer = setTimeout(fetchFavorites, 500);
    return () => clearTimeout(timer);
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (locationId: number): Promise<boolean> => {
    const wasFavorited = favoriteIds.has(locationId);
    const newState = !wasFavorited;

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (newState) next.add(locationId);
      else next.delete(locationId);
      return next;
    });

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return wasFavorited;

      const res = await fetch(`${API_BASE}/favorites/${locationId}`, {
        method: newState ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        // Revert
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (wasFavorited) next.add(locationId);
          else next.delete(locationId);
          return next;
        });
        return wasFavorited;
      }
    } catch {
      // Revert
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFavorited) next.add(locationId);
        else next.delete(locationId);
        return next;
      });
      return wasFavorited;
    }

    return newState;
  }, [favoriteIds]);

  const isFavorited = useCallback((locationId: number) => favoriteIds.has(locationId), [favoriteIds]);

  return { favoriteIds, isFavorited, toggleFavorite, loading, refetch: fetchFavorites };
}
