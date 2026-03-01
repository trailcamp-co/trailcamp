import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  home_lat: number | null;
  home_lon: number | null;
  home_address: string | null;
  units_preference: string;
  theme: string;
  tier: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // Profile fetch failed
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}

/**
 * Calculate distance in miles between two points using haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format distance as "X hrs" or "X mi" depending on magnitude.
 */
export function formatDistanceFromHome(miles: number): string {
  if (miles < 50) return `${Math.round(miles)} mi`;
  const hours = miles / 55; // Rough avg driving speed
  if (hours < 1) return `${Math.round(miles)} mi`;
  return `~${hours.toFixed(1)} hrs`;
}
