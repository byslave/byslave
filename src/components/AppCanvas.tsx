import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

export function AppCanvas({ children }: { children: ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.device}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center' },
  device: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.bg, overflow: 'hidden' },
});
