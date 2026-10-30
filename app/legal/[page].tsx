import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Chip } from '@/src/components/ui/Chip';
import { useAppStore, type ConsentKind } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

const pages = ['notice', 'privacy', 'terms', 'consent'] as const;
type LegalPage = (typeof pages)[number];

export default function LegalScreen() {
  const params = useLocalSearchParams<{ page: string }>();
  const page: LegalPage = pages.includes(params.page as LegalPage) ? (params.page as LegalPage) : 'notice';
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const consents = useAppStore((state) => state.consents);
  const setConsent = useAppStore((state) => state.setConsent);
  const title =
    page === 'privacy' ? t('legal.privacyTitle') : page === 'terms' ? t('legal.termsTitle') : page === 'consent' ? t('legal.consentTitle') : t('legal.noticeTitle');
  const paragraphs = page === 'privacy' ? t('legal.privacy', { returnObjects: true }) : page === 'terms' ? t('legal.terms', { returnObjects: true }) : t('legal.notice', { returnObjects: true });
  const body = Array.isArray(paragraphs) ? paragraphs : [];
  const kinds: ConsentKind[] = ['location', 'motion', 'photos'];

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{title}</AppText>
      <AppText variant="muted">{t('legal.updated')}</AppText>
      {page === 'consent' ? <AppText variant="body">{t('legal.consentBody')}</AppText> : null}
      {page === 'consent' ? (
        <View style={styles.wrap}>
          {kinds.map((kind) => {
            const granted = consents[kind]?.granted === true;
            const label = kind === 'location' ? t('profile.consentLocation') : kind === 'motion' ? t('profile.consentMotion') : t('profile.consentPhotos');
            return <Chip key={kind} label={label} selected={granted} onPress={() => setConsent(kind, !granted)} />;
          })}
        </View>
      ) : (
        body.map((paragraph) => (
          <AppText key={paragraph} variant="body">
            {paragraph}
          </AppText>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 14, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  wrap: { gap: 8 },
});
