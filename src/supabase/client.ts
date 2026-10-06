import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function env(name: string): string | null {
  const value = process.env[name];
  if (!value?.trim()) return null;
  return value.trim();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env('EXPO_PUBLIC_SUPABASE_URL') && env('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(env('EXPO_PUBLIC_SUPABASE_URL')!, env('EXPO_PUBLIC_SUPABASE_ANON_KEY')!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
