import { isSupabaseConfigured, supabase } from '@/src/lib/supabase/client';
import { useAppStore, type PrivacyMode } from '@/src/stores/appStore';

import { accountOnServer } from './privacy';

export async function persistPrivacy(mode: PrivacyMode): Promise<'local' | 'saved' | 'pending'> {
  const user = useAppStore.getState().user;
  const mark = useAppStore.getState().setPrivacyOnServer;
  if (!accountOnServer(user?.id ?? null, isSupabaseConfigured) || !supabase || !user) {
    mark(false);
    return 'local';
  }
  mark(false);
  const { error } = await supabase
    .from('profiles')
    .update({ privacy: mode, privacy_saved_at: new Date().toISOString() })
    .eq('id', user.id);
  if (error) return 'pending';
  mark(true);
  return 'saved';
}
