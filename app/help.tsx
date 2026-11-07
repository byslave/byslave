import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { toHref } from '@/src/lib/nav';
import { colors, radii } from '@/src/theme/tokens';

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const links = [
    [t('help.notice'), '/legal/notice'],
    [t('help.consent'), '/legal/consent'],
    [t('help.privacy'), '/legal/privacy'],
    [t('help.terms'), '/legal/terms'],
  ] as const;

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('help.title')}</AppText>
      <AppText variant="body">{t('help.body')}</AppText>
      <AppText variant="label">{t('help.legal')}</AppText>
      {links.map(([label, href]) => (
        <Pressable key={href} accessibilityRole="link" accessibilityLabel={label} onPress={() => router.push(toHref(href))} style={styles.link}>
          <AppText variant="bodyMedium">{label}</AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radii.md, backgroundColor: colors.surface },
});
