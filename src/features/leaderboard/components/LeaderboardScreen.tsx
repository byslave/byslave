import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { SafetySheet } from '@/src/components/SafetySheet';
import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Chip } from '@/src/components/ui/Chip';
import { EmptyState } from '@/src/components/ui/States';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { PodiumRow } from '@/src/components/ui/PodiumRow';
import { boardRows, eventById, sampleNight, type BoardRow } from '@/src/data/demo';
import { isInCurrentWeek, localISODate } from '@/src/features/events/dates';
import { acceptJumps } from '@/src/features/session/jumps';
import { formatNumber } from '@/src/lib/format';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, tabClearance } from '@/src/theme/tokens';

type Metric = 'jumps' | 'stay' | 'venues';
type Scope = 'venue' | 'friends';
type Range = 'tonight' | 'week' | 'all';

export function LeaderboardScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [metric, setMetric] = useState<Metric>('stay');
  const [scope, setScope] = useState<Scope>('venue');
  const [range, setRange] = useState<Range>('all');
  const [target, setTarget] = useState<string | null>(null);
  const friendIds = useAppStore((state) => state.friendIds);
  const blockedIds = useAppStore((state) => state.blockedIds);
  const finishedNights = useAppStore((state) => state.finishedNights);
  const displayName = useAppStore((state) => state.displayName);
  const addReport = useAppStore((state) => state.addReport);
  const blockPerson = useAppStore((state) => state.blockPerson);
  const showToast = useToastStore((state) => state.show);

  const rows = useMemo(() => {
    const now = new Date();
    const sampleDate = eventById(sampleNight.eventId)?.date ?? '';
    const sampleInRange =
      range === 'all' || (range === 'tonight' ? sampleDate === localISODate(now) : isInCurrentWeek(sampleDate, now));
    const mine = finishedNights.find((night) => {
      const iso = night.startedAt.slice(0, 10);
      if (range === 'tonight') return iso === localISODate(now);
      if (range === 'week') return isInCurrentWeek(iso, now);
      return true;
    });
    const source: BoardRow[] = sampleInRange
      ? boardRows.map((row) =>
          row.you && mine
            ? {
                ...row,
                name: displayName,
                minutes: mine.minutes,
                jumps: mine.rankable ? mine.jumps : 0,
                venues: Math.max(row.venues, 1),
              }
            : row,
        )
      : mine
        ? [
            {
              id: 'you',
              name: displayName,
              portrait: 'you' as const,
              jumps: mine.rankable ? mine.jumps : 0,
              minutes: mine.minutes,
              venues: 1,
              you: true,
            },
          ]
        : [];
    return source
      .filter((row) => !blockedIds.includes(row.id))
      .filter((row) => scope === 'venue' || row.you || friendIds.includes(row.id))
      .filter((row) => metric !== 'jumps' || row.you || acceptJumps({ jumps: row.jumps, minutes: row.minutes }).accepted)
      .filter((row) => metric !== 'jumps' || !row.you || acceptJumps({ jumps: row.jumps, minutes: Math.max(row.minutes, 1) }).accepted || row.jumps === 0)
      .sort((a, b) => {
        if (metric === 'jumps') return b.jumps - a.jumps;
        if (metric === 'venues') return b.venues - a.venues;
        return b.minutes - a.minutes;
      });
  }, [blockedIds, displayName, finishedNights, friendIds, metric, range, scope]);

  function valueOf(row: BoardRow) {
    if (metric === 'jumps') return formatNumber(row.jumps, i18n.language);
    if (metric === 'venues') return formatNumber(row.venues, i18n.language);
    return t('night.durationValue', { hours: Math.floor(row.minutes / 60), minutes: row.minutes % 60 });
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: tabClearance + 28, gap: 14 }}>
        <OfflineBanner />
        <AppText variant="display">{t('board.title')}</AppText>
        <Badge label={t('board.sample')} tone="accent" />
        <AppText variant="label">{t('board.when')}</AppText>
        <View style={styles.filters}>
          <Chip label={t('board.tonight')} selected={range === 'tonight'} onPress={() => setRange('tonight')} />
          <Chip label={t('board.week')} selected={range === 'week'} onPress={() => setRange('week')} />
          <Chip label={t('board.all')} selected={range === 'all'} onPress={() => setRange('all')} />
        </View>
        <AppText variant="label">{t('board.where')}</AppText>
        <View style={styles.filters}>
          <Chip label={t('board.venue')} selected={scope === 'venue'} onPress={() => setScope('venue')} />
          <Chip label={t('board.friends')} selected={scope === 'friends'} onPress={() => setScope('friends')} />
        </View>
        <AppText variant="label">{t('board.by')}</AppText>
        <View style={styles.filters}>
          <Chip label={t('board.stay')} selected={metric === 'stay'} onPress={() => setMetric('stay')} />
          <Chip label={t('board.venues')} selected={metric === 'venues'} onPress={() => setMetric('venues')} />
          <Chip label={t('board.jumps')} selected={metric === 'jumps'} onPress={() => setMetric('jumps')} />
        </View>
        {rows.length === 0 ? (
          <EmptyState
            title={scope === 'friends' && friendIds.length === 0 ? t('board.friendsEmptyTitle') : t('board.emptyTitle')}
            body={scope === 'friends' && friendIds.length === 0 ? t('board.friendsEmptyBody') : t('board.emptyBody')}
          />
        ) : (
          rows.map((row, index) => (
            <View key={row.id} style={styles.line}>
              <PodiumRow
                rank={index + 1}
                name={row.you ? t('board.you') : row.name}
                portrait={row.portrait}
                highlight={Boolean(row.you)}
                podium={index < 3}
                value={valueOf(row)}
              />
              {!row.you ? (
                <Pressable accessibilityRole="button" accessibilityLabel={t('common.report')} onPress={() => setTarget(row.id)} style={styles.report}>
                  <AppText variant="muted">{t('common.report')}</AppText>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
      <SafetySheet
        visible={target !== null}
        onClose={() => setTarget(null)}
        onReport={(reason) => {
          if (!target) return;
          addReport({ target: 'person', targetId: target, reason });
          setTarget(null);
          showToast(t('event.reportSaved'));
        }}
        onBlock={() => {
          if (!target) return;
          blockPerson(target);
          setTarget(null);
          showToast(t('feed.blocked'));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  line: { gap: 0 },
  report: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
});
