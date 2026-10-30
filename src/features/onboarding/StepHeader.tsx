import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/src/theme/tokens';

export function StepHeader({ step, total = 4, onBack }: { step: number; total?: number; onBack?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={onBack} style={styles.back}>
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <View style={styles.dots} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: step }}>
        {Array.from({ length: total }, (_, index) => (
          <View key={index} style={[styles.dot, index < step ? styles.dotOn : styles.dotOff]} />
        ))}
      </View>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: colors.accent },
  dotOff: { backgroundColor: colors.surface2 },
});
