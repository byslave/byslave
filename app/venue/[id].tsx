import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ErrorState } from '@/src/components/ui/States';
import { events, venueById } from '@/src/data/demo';
import { formatClockRange, formatDayLabel } from '@/src/lib/format';
import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customVenues = useAppStore((state) => state.customVenues);
  const listed = typeof id === 'string' ? venueById(id) : undefined;
  const custom = typeof id === 'string' ? customVenues.find((venue) => venue.id === id) : undefined;
  const venue = listed ?? custom;

  if (!venue) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState title={t('venue.missing')} body={t('common.errorBody')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </View>
    );
  }

  const nights = events.filter((event) => event.venueId === venue.id);

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <Badge label={listed ? t('venue.sample') : t('map.pending')} tone="accent" />
      <AppText variant="display">{venue.name}</AppText>
      <AppText variant="muted">
        {t(`venueTypes.${venue.type}`)} · {venue.district}
        {venue.street ? ` · ${venue.street}` : ''}
      </AppText>
      <AppText variant="label">{t('venue.about')}</AppText>
      <AppText variant="body">{custom?.rules ? custom.rules : t('event.rulesBody')}</AppText>
      <AppText variant="label">{t('venue.events')}</AppText>
      {nights.length === 0 ? <AppText variant="muted">{t('venue.empty')}</AppText> : null}
      {nights.map((event) => (
        <Card key={event.id} style={styles.card}>
          <AppText variant="heading">{event.title}</AppText>
          <AppText variant="muted">
            {formatDayLabel(event.date, i18n.language)} · {formatClockRange(event.startTime, event.endTime)} · {t('event.age', { count: event.ageLimit })}
          </AppText>
          <Button label={t('map.viewEvent')} variant="secondary" onPress={() => router.push(`/event/${event.id}`)} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 8 },
});
