import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, radii } from '@/src/theme/tokens';

export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 12 }]}>
      <View style={styles.toast}>
        <AppText variant="bodyMedium">{message}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 20, alignItems: 'center' },
  toast: {
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
