import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { colors } from '@/src/theme/tokens';

export default function PermissionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rows = [
    ['onboarding.permLocation', 'onboarding.permLocationBody'],
    ['onboarding.permMotion', 'onboarding.permMotionBody'],
    ['onboarding.permNotifications', 'onboarding.permNotificationsBody'],
    ['onboarding.permPhotos', 'onboarding.permPhotosBody'],
  ] as const;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <AppText variant="display">{t('onboarding.permTitle')}</AppText>
      <AppText variant="body">{t('onboarding.permBody')}</AppText>
      <View style={styles.list}>
        {rows.map(([title, body]) => (
          <Card key={title} style={styles.card}>
            <AppText variant="bodyMedium">{t(title)}</AppText>
            <AppText variant="muted">{t(body)}</AppText>
          </Card>
        ))}
      </View>
      <View style={styles.spacer} />
      <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/auth')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 14 },
  list: { gap: 10 },
  card: { gap: 6 },
  spacer: { flex: 1 },
});
