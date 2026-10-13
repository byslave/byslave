import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function haptic(kind: 'tap' | 'success' | 'select'): void {
  if (Platform.OS === 'web') return;
  const impact =
    kind === 'success' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
  void Haptics.impactAsync(impact).catch(() => undefined);
}
