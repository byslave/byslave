import { useRouter } from 'expo-router';
import { AudioLines, Map, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { StepHeader } from '@/src/features/onboarding/StepHeader';
import { colors } from '@/src/theme/tokens';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pulse] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const points = [
    [Map, t('onboarding.pointMap')],
    [Users, t('onboarding.pointPeople')],
    [AudioLines, t('onboarding.pointNight')],
  ] as const;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <StepHeader step={1} />
      <View style={styles.mark}>
        <Animated.View style={[styles.halo, { opacity: pulse, transform: [{ scale: pulse }] }]} />
        <AppText variant="label">{t('brand')}</AppText>
      </View>
      <AppText variant="display">{t('onboarding.welcomeTitle')}</AppText>
      <AppText variant="body">{t('onboarding.welcomeBody')}</AppText>
      <View style={styles.points}>
        {points.map(([Icon, label]) => (
          <View key={label} style={styles.point}>
            <View style={styles.icon}>
              <Icon color={colors.accentInk} size={18} />
            </View>
            <AppText variant="bodyMedium" style={styles.pointText}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.spacer} />
      <Button label={t('common.start')} onPress={() => router.push('/(onboarding)/age')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 16 },
  mark: { height: 92, alignItems: 'flex-start', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    opacity: 0.7,
  },
  points: { gap: 14, marginTop: 8 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1 },
  spacer: { flex: 1 },
});
