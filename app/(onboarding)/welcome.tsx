import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme/tokens';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <AppText variant="label">{t('brand')}</AppText>
      <AppText variant="display">{t('onboarding.welcomeTitle')}</AppText>
      <AppText variant="body">{t('onboarding.welcomeBody')}</AppText>
      <View style={styles.points}>
        <AppText variant="bodyMedium">{t('onboarding.pointMap')}</AppText>
        <AppText variant="bodyMedium">{t('onboarding.pointPeople')}</AppText>
        <AppText variant="bodyMedium">{t('onboarding.pointNight')}</AppText>
      </View>
      <View style={styles.spacer} />
      <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/age')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 16 },
  points: { gap: 10, marginTop: 12 },
  spacer: { flex: 1 },
});
