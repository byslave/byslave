import { useRouter } from 'expo-router';
import { Bell, Image as ImageIcon, MapPin, Activity } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { StepHeader } from '@/src/features/onboarding/StepHeader';
import { colors, radii } from '@/src/theme/tokens';

export default function PermissionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rows = [
    [MapPin, 'onboarding.permLocation', 'onboarding.permLocationBody'],
    [Activity, 'onboarding.permMotion', 'onboarding.permMotionBody'],
    [Bell, 'onboarding.permNotifications', 'onboarding.permNotificationsBody'],
    [ImageIcon, 'onboarding.permPhotos', 'onboarding.permPhotosBody'],
  ] as const;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <StepHeader step={3} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.list}>
        <AppText variant="display">{t('onboarding.permTitle')}</AppText>
        <AppText variant="body">{t('onboarding.permBody')}</AppText>
        {rows.map(([Icon, title, body]) => (
          <View key={title} style={styles.card} accessibilityRole="text">
            <View style={styles.icon}>
              <Icon color={colors.accent} size={18} />
            </View>
            <View style={styles.copy}>
              <AppText variant="bodyMedium">{t(title)}</AppText>
              <AppText variant="muted">{t(body)}</AppText>
            </View>
          </View>
        ))}
      </ScrollView>
      <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/auth')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 14 },
  list: { gap: 12, paddingBottom: 16 },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radii.md, backgroundColor: colors.surface },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  copy: { flex: 1, gap: 4 },
});
