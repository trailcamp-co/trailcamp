import { useState, useCallback } from 'react';

interface RecentLocation {
  id: number;
  name: string;
  category: string;
  viewedAt: number;
}

const STORAGE_KEY = 'trailcamp_recent_locations';
const MAX_RECENT = 10;

export function useRecentLocations() {
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  const addRecentLocation = useCallback((id: number, name: string, category: string) => {
    setRecentLocations(prev => {
      const filtered = prev.filter(r => r.id !== id);
      const next = [{ id, name, category, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentLocations, addRecentLocation };
}
