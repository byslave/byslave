import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { venues } from '@/src/data/demo';
import { formatIstanbul } from '@/src/features/events/time';
import { toHref } from '@/src/lib/nav';
import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export default function EventSubmissionsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const events = useAppStore((state) => state.localEvents);
  const customVenues = useAppStore((state) => state.customVenues);

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('verify.submissions')}</AppText>
      <AppText variant="body">{t('verify.submissionsBody')}</AppText>
      {events.length === 0 ? <AppText variant="muted">{t('verify.submissionsEmpty')}</AppText> : null}
      {events.map((event) => {
        const venue = venues.find((item) => item.id === event.venueId) ?? customVenues.find((item) => item.id === event.venueId);
        const status =
          event.verificationStatus === 'verified'
            ? t('event.verified')
            : event.verificationStatus === 'rejected'
              ? t('verify.rejected')
              : t('verify.pending');
        return (
          <Card key={event.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <AppText variant="heading">{event.title}</AppText>
                <AppText variant="muted">{event.concept || event.genres.map((genre) => t(`genres.${genre}`)).join(' · ')}</AppText>
              </View>
              <Badge label={status} tone={event.verificationStatus === 'verified' ? 'success' : 'neutral'} />
            </View>
            <AppText variant="muted">
              {venue?.name ?? event.venueId} · {formatIstanbul(new Date(event.startAt), i18n.language)}
            </AppText>
            {event.verificationNote ? <AppText variant="body">{event.verificationNote}</AppText> : null}
            <Button label={t('verify.viewSubmission')} variant="secondary" onPress={() => router.push(toHref(`/event/${event.id}`))} />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  copy: { flex: 1, gap: 2 },
});
