import { useState, useEffect, useCallback } from 'react';
import type { Trip, TripStop, Location, Stats, JournalEntry } from '../types';
import { getSupabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // Auto-attach Supabase auth token if available
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Not authenticated — continue without token
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

// Trips
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Trip[]>('/trips');
      setTrips(data);
    } catch {
      // fetch failed silently
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const createTrip = async (trip: Partial<Trip>) => {
    const created = await apiFetch<Trip>('/trips', { method: 'POST', body: JSON.stringify(trip) });
    setTrips(prev => [created, ...prev]);
    return created;
  };

  const updateTrip = async (id: number, data: Partial<Trip>) => {
    const updated = await apiFetch<Trip>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    return updated;
  };

  const deleteTrip = async (id: number) => {
    await apiFetch(`/trips/${id}`, { method: 'DELETE' });
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  return { trips, loading, fetchTrips, createTrip, updateTrip, deleteTrip };
}

// Trip Stops
export function useTripStops(tripId: number | null) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStops = useCallback(async () => {
    if (!tripId) { setStops([]); return; }
    setLoading(true);
    try {
      const data = await apiFetch<TripStop[]>(`/trips/${tripId}/stops`);
      setStops(data);
    } catch {
      // fetch failed silently
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => { fetchStops(); }, [fetchStops]);

  const addStop = async (stop: Partial<TripStop>) => {
    if (!tripId) return;
    const created = await apiFetch<TripStop>(`/trips/${tripId}/stops`, { method: 'POST', body: JSON.stringify(stop) });
    setStops(prev => [...prev, created]);
    return created;
  };

  const updateStop = async (stopId: number, data: Partial<TripStop>) => {
    if (!tripId) return;
    const updated = await apiFetch<TripStop>(`/trips/${tripId}/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(data) });
    setStops(prev => prev.map(s => s.id === stopId ? { ...s, ...updated } : s));
    return updated;
  };

  const reorderStops = async (stopIds: number[]) => {
    if (!tripId) return;
    const reordered = await apiFetch<TripStop[]>(`/trips/${tripId}/reorder`, { method: 'PUT', body: JSON.stringify({ stopIds }) });
    setStops(reordered);
  };

  const deleteStop = async (stopId: number) => {
    if (!tripId) return;
    await apiFetch(`/trips/${tripId}/stops/${stopId}`, { method: 'DELETE' });
    setStops(prev => prev.filter(s => s.id !== stopId));
  };

  return { stops, loading, fetchStops, addStop, updateStop, reorderStops, deleteStop };
}

// Locations
export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const data = await apiFetch<Location[]>(`/locations${query}`);

      setLocations(data);
    } catch {
      // fetch failed silently
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const searchLocations = async (q: string) => {
    const data = await apiFetch<Location[]>(`/locations/search?q=${encodeURIComponent(q)}`);
    return data;
  };

  const createLocation = async (location: Partial<Location>) => {
    const created = await apiFetch<Location>('/locations', { method: 'POST', body: JSON.stringify(location) });
    setLocations(prev => [...prev, created]);
    return created;
  };

  const updateLocation = async (id: number, data: Partial<Location>) => {
    const updated = await apiFetch<Location>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    return updated;
  };

  const deleteLocation = async (id: number) => {
    await apiFetch(`/locations/${id}`, { method: 'DELETE' });
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const toggleFavorite = async (id: number) => {
    const updated = await apiFetch<Location>(`/locations/${id}/favorite`, { method: 'PUT' });
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    return updated;
  };

  return { locations, loading, fetchLocations, searchLocations, createLocation, updateLocation, deleteLocation, toggleFavorite };
}

// Stats
export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Stats>('/locations/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}

// Directions
export async function fetchDirections(stops: string) {
  return apiFetch<any>(`/directions?stops=${stops}`);
}

// Import
export async function importIOverlander(bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }) {
  return apiFetch<{ imported: number; skipped: number; total: number }>('/import/ioverlander', { method: 'POST', body: JSON.stringify(bounds) });
}

export async function importRecreation(params: { state?: string; query?: string; limit?: number }) {
  return apiFetch<{ imported: number; skipped: number; total: number }>('/import/recreation', { method: 'POST', body: JSON.stringify(params) });
}

// Toggle favorite
export async function toggleFavorite(id: number) {
  return apiFetch<Location>(`/locations/${id}/favorite`, { method: 'PUT' });
}

// Nearby riding
export async function fetchNearbyRiding(lat: number, lng: number, radius: number = 20) {
  return apiFetch<(Location & { distance_from: number })[]>(`/locations/nearby-riding?lat=${lat}&lng=${lng}&radius=${radius}`);
}

// Fetch group members
export async function fetchGroupMembers(groupId: number) {
  return apiFetch<Location[]>(`/locations/group/${groupId}`);
}

// Duplicate trip
export async function duplicateTrip(tripId: number) {
  return apiFetch<Trip>(`/trips/${tripId}/duplicate`, { method: 'POST' });
}

// Optimize trip route
export async function optimizeTrip(tripId: number) {
  return apiFetch<{ stops: TripStop[]; saved: number }>(`/trips/${tripId}/optimize`, { method: 'POST' });
}

// Journal entries
export async function fetchJournal(tripId: number) {
  return apiFetch<JournalEntry[]>(`/trips/${tripId}/journal`);
}

export async function createJournalEntry(tripId: number, data: { stop_id?: number | null; content: string }) {
  return apiFetch<JournalEntry>(`/trips/${tripId}/journal`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteJournalEntry(tripId: number, entryId: number) {
  return apiFetch(`/trips/${tripId}/journal/${entryId}`, { method: 'DELETE' });
}

// Mapbox token
export async function getMapboxToken() {
  const data = await apiFetch<{ token: string }>('/mapbox-token');
  return data.token;
}
