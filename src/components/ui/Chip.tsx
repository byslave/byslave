import { Pressable, StyleSheet, Text } from 'react-native';

import { haptic } from '@/src/lib/haptics';
import { colors, fonts, radii } from '@/src/theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        if (!onPress) return;
        haptic('select');
        onPress();
      }}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  idle: { backgroundColor: 'rgba(22,19,30,0.86)', borderColor: colors.line },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  selectedLabel: { color: colors.accentInk },
});
