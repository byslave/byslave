import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii } from '@/src/theme/tokens';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'accent' }) {
  return (
    <View style={[styles.badge, tone === 'success' && styles.success, tone === 'accent' && styles.accent]}>
      <Text style={[styles.label, tone === 'success' && styles.successLabel]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  success: { backgroundColor: 'rgba(61,220,151,0.14)' },
  accent: { backgroundColor: 'rgba(217,204,255,0.16)' },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  successLabel: { color: colors.success },
});
