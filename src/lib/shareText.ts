import { Share } from 'react-native';

export async function shareText(message: string): Promise<'shared' | 'copied' | 'dismissed'> {
  try {
    const result = await Share.share({ message });
    if (result.action === Share.dismissedAction) return 'dismissed';
    return 'shared';
  } catch {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      return 'copied';
    }
    throw new Error('share-failed');
  }
}
