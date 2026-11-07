import type { PrivacyMode } from '@/src/stores/appStore';

export function accountOnServer(userId: string | null, serverConfigured: boolean): boolean {
  if (!serverConfigured || !userId) return false;
  if (userId.startsWith('local-')) return false;
  return true;
}

/** Until a server account has a saved choice, lists use ghost mode. */
export function visiblePrivacy(input: {
  privacy: PrivacyMode;
  privacyOnServer: boolean;
  userId: string | null;
  serverConfigured: boolean;
}): PrivacyMode {
  if (accountOnServer(input.userId, input.serverConfigured) && !input.privacyOnServer) return 'ghost';
  return input.privacy;
}
