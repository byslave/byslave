import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;

export function mapStyleUrl(): string {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${encodeURIComponent(token)}`;
  }
  return '';
}

export async function sendMagicLink(email: string): Promise<'sent' | 'demo' | 'error'> {
  if (!supabase) return 'demo';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'pulse://auth' },
  });
  return error ? 'error' : 'sent';
}
