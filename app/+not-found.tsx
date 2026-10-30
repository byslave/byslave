import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { colors } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <AppText variant="heading">{t('brand')}</AppText>
        <Link href="/">
          <AppText variant="bodyMedium">{t('tabs.map')}</AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
