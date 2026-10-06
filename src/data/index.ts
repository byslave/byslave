import { getSupabase } from '../supabase/client';
import { DemoRepository } from './demoRepository';
import type { ActivityRepository } from './repository';
import { SupabaseRepository } from './supabaseRepository';

export async function createRepository(): Promise<{ repo: ActivityRepository; note: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      repo: new DemoRepository(),
      note: 'Demo modu. Veriler bu cihazda. Supabase anahtarı gelince aynı arayüz bağlanır.',
    };
  }
  try {
    const repo = new SupabaseRepository(supabase);
    await repo.load();
    return { repo, note: 'Supabase bağlı.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'bağlantı kurulamadı';
    return {
      repo: new DemoRepository(),
      note: `Supabase anahtarı var ama kullanılamadı (${message}). Demo veri açık.`,
    };
  }
}

export type { ActivityRepository };
