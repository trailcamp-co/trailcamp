import { createClient } from '@supabase/supabase-js';

// These come from the API at /api/config, but we also support build-time env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// We'll initialize lazily if env vars aren't set (fetch from API)
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
}

export async function initSupabaseFromApi(): Promise<void> {
  if (supabaseUrl && supabaseAnonKey) return; // Already configured via env

  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiBase}/api/config`);
    const config = await res.json();

    if (config.supabaseUrl && config.supabaseAnonKey) {
      _supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
  } catch (err) {
    console.error('Failed to fetch Supabase config:', err);
  }
}

export { _supabase as supabase };
