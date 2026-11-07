import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';

export function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.block}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="stat">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 6, flex: 1 },
});
