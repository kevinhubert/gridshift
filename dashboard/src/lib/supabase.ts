import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set — using mock data mode');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Supabase Edge Function base URL — set via env
export const FUNCTION_BASE = import.meta.env.VITE_FUNCTION_BASE as string || '';

export async function fetchPrices(hub: string, day: string) {
  if (!FUNCTION_BASE) {
    console.warn('VITE_FUNCTION_BASE not set — cannot fetch from edge function');
    return null;
  }

  const res = await fetch(`${FUNCTION_BASE}/get-prices?hub=${hub}&day=${day}`);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
  return res.json();
}
