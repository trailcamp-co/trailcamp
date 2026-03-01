import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface UserLocationData {
  visited: number;
  visited_date: string | null;
  want_to_visit: number;
  user_rating: number | null;
  user_notes: string | null;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  } catch {}
  return { 'Content-Type': 'application/json' };
}

/**
 * Hook that manages per-user annotations on locations (visited, rating, notes, etc).
 * Fetches all user data on mount and provides update functions.
 */
export function useUserData() {
  const [dataMap, setDataMap] = useState<Record<number, UserLocationData>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) { setLoading(false); return; }

      const res = await fetch(`${API_BASE}/userdata`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDataMap(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateLocationData = useCallback(async (
    locationId: number,
    updates: Partial<UserLocationData>
  ): Promise<UserLocationData | null> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/userdata/${locationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        const userData: UserLocationData = {
          visited: data.visited,
          visited_date: data.visited_date,
          want_to_visit: data.want_to_visit,
          user_rating: data.user_rating,
          user_notes: data.user_notes,
        };
        setDataMap(prev => ({ ...prev, [locationId]: userData }));
        return userData;
      }
    } catch {}
    return null;
  }, []);

  const getLocationData = useCallback((locationId: number): UserLocationData => {
    return dataMap[locationId] || {
      visited: 0,
      visited_date: null,
      want_to_visit: 0,
      user_rating: null,
      user_notes: null,
    };
  }, [dataMap]);

  return { dataMap, loading, getLocationData, updateLocationData, refetch: fetchAll };
}
