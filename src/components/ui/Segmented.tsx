import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptic } from '@/src/lib/haptics';
import { colors, fonts, radii } from '@/src/theme/tokens';

interface SegmentedProps {
  values: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}

export function Segmented({ values, value, onChange }: SegmentedProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {values.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptic('select');
              onChange(item.id);
            }}
            style={[styles.item, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]} maxFontSizeMultiplier={1.3}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  item: { flex: 1, minHeight: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.surface2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  selectedLabel: { color: colors.text },
});
