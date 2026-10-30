import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/src/lib/haptics';
import { colors } from '@/src/theme/tokens';

export function RatingStars({ value, onChange }: { value: number; onChange?: (next: number) => void }) {
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: 5, now: value }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`${star}`}
          onPress={() => {
            if (!onChange) return;
            haptic('select');
            onChange(star);
          }}
          style={styles.hit}
        >
          <View style={[styles.star, star <= value && styles.filled]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  hit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  star: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  filled: { backgroundColor: colors.accent },
});
