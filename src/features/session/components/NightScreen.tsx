import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { StatBlock } from '@/src/components/ui/StatBlock';
import { NightChart } from '@/src/features/session/components/NightChart';
import { eventById, sampleNight, venueById } from '@/src/data/demo';
import { formatDayLabel, formatNumber } from '@/src/lib/format';
import { shareText } from '@/src/lib/shareText';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, tabClearance } from '@/src/theme/tokens';

export function NightScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const [open, setOpen] = useState(false);
  const event = eventById(sampleNight.eventId);
  const venue = event ? venueById(event.venueId) : undefined;
  const hours = Math.floor(sampleNight.minutes / 60);
  const minutes = sampleNight.minutes % 60;
  const duration = t('night.durationValue', { hours, minutes });

  async function share() {
    if (!event || !venue) return;
    const result = await shareText(
      t('night.shareMessage', {
        event: event.title,
        venue: venue.name,
        duration,
        jumps: formatNumber(sampleNight.jumps, i18n.language),
      }),
    );
    showToast(result === 'copied' ? t('night.copied') : t('night.shared'));
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: tabClearance + 24, gap: 16 }}
    >
      <AppText variant="muted">{event ? formatDayLabel(event.date, i18n.language) : ''}</AppText>
      <AppText variant="display">{t('night.title')}</AppText>
      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.cardTitles}>
            <Badge label={t('night.sample')} tone="accent" />
            <AppText variant="heading">{event?.title}</AppText>
            <AppText variant="muted">
              {venue?.name} · {venue?.district}
            </AppText>
          </View>
          <Badge label={t('night.completed')} tone="success" />
        </View>
        <View style={styles.stats}>
          <StatBlock label={t('night.duration')} value={duration} />
          <StatBlock label={t('night.jumps')} value={formatNumber(sampleNight.jumps, i18n.language)} />
        </View>
        <AppText variant="muted">{t('night.jumpsHint')}</AppText>
        <Button label={t('night.share')} onPress={() => void share()} />
      </Card>
      <Card>
        <Button label={t('night.details')} variant="secondary" onPress={() => setOpen((value) => !value)} />
        {open ? (
          <View style={styles.details}>
            <Detail label={t('night.arrival')} value={sampleNight.arrival} />
            <Detail label={t('night.peak')} value={sampleNight.peak} />
            <Detail label={t('night.departure')} value={sampleNight.departure} />
          </View>
        ) : null}
      </Card>
      <Card>
        <AppText variant="label">{t('night.chart')}</AppText>
        <AppText variant="heading">{t('night.chartTitle')}</AppText>
        <AppText variant="muted">{t('night.chartHint')}</AppText>
        <NightChart values={sampleNight.series} />
      </Card>
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { gap: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitles: { flex: 1, gap: 6 },
  stats: { flexDirection: 'row', gap: 12 },
  details: { marginTop: 16, gap: 10 },
  detail: { flexDirection: 'row', justifyContent: 'space-between' },
});
