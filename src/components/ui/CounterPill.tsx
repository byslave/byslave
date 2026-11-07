import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '@/src/theme/tokens';

export function CounterPill({ label, count, selected = false }: { label: string; count: number; selected?: boolean }) {
  return (
    <View style={[styles.pill, selected && styles.selected]}>
      <View style={[styles.dot, selected && styles.dotSelected]} />
      <Text style={[styles.label, selected && styles.selectedText]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <Text style={[styles.count, selected && styles.selectedText]} maxFontSizeMultiplier={1.2}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(18,14,28,0.92)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  selected: { backgroundColor: colors.accent },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  dotSelected: { backgroundColor: colors.accentInk },
  label: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 13 },
  count: { fontFamily: fonts.bodySemibold, color: colors.text, fontSize: 13, fontVariant: ['tabular-nums'] },
  selectedText: { color: colors.accentInk },
});
