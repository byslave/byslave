import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { useOnline } from '@/src/lib/online';
import { colors, radii } from '@/src/theme/tokens';

export function OfflineBanner() {
  const online = useOnline();
  const { t } = useTranslation();
  if (online) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <AppText variant="bodyMedium">{t('common.offlineTitle')}</AppText>
      <AppText variant="muted">{t('common.offlineBody')}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 4,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
