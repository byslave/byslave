import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Chip } from '@/src/components/ui/Chip';
import { EmptyState } from '@/src/components/ui/States';
import { PodiumRow } from '@/src/components/ui/PodiumRow';
import { boardRows } from '@/src/data/demo';
import { formatNumber } from '@/src/lib/format';
import { colors, tabClearance } from '@/src/theme/tokens';

type Metric = 'jumps' | 'stay';
type Scope = 'venue' | 'friends';

export function LeaderboardScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [metric, setMetric] = useState<Metric>('jumps');
  const [scope, setScope] = useState<Scope>('venue');

  const rows = useMemo(() => {
    const source = scope === 'friends' ? boardRows.filter((row) => row.you) : boardRows;
    return [...source].sort((a, b) => (metric === 'jumps' ? b.jumps - a.jumps : b.minutes - a.minutes));
  }, [metric, scope]);

  const you = rows.find((row) => row.you);
  const youRank = you ? rows.indexOf(you) + 1 : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: tabClearance + 80, gap: 16 }}>
        <AppText variant="display">{t('board.title')}</AppText>
        <Badge label={t('board.sample')} tone="accent" />
        <View style={styles.filters}>
          <Chip label={t('board.venue')} selected={scope === 'venue'} onPress={() => setScope('venue')} />
          <Chip label={t('board.friends')} selected={scope === 'friends'} onPress={() => setScope('friends')} />
          <Chip label={t('board.jumps')} selected={metric === 'jumps'} onPress={() => setMetric('jumps')} />
          <Chip label={t('board.stay')} selected={metric === 'stay'} onPress={() => setMetric('stay')} />
        </View>
        {scope === 'friends' ? (
          <EmptyState title={t('board.emptyTitle')} body={t('board.emptyBody')} />
        ) : (
          rows.map((row, index) => (
            <PodiumRow
              key={row.id}
              rank={index + 1}
              name={row.you ? t('board.you') : row.name}
              portrait={row.portrait}
              highlight={Boolean(row.you)}
              value={
                metric === 'jumps'
                  ? formatNumber(row.jumps, i18n.language)
                  : t('night.durationValue', { hours: Math.floor(row.minutes / 60), minutes: row.minutes % 60 })
              }
            />
          ))
        )}
      </ScrollView>
      {you ? (
        <View style={[styles.pin, { bottom: tabClearance - 8 }]}>
          <AppText variant="bodyMedium">{t('board.rank', { rank: youRank })}</AppText>
          <AppText variant="bodyMedium">{t('board.you')}</AppText>
          <AppText variant="bodyMedium">
            {metric === 'jumps'
              ? formatNumber(you.jumps, i18n.language)
              : t('night.durationValue', { hours: Math.floor(you.minutes / 60), minutes: you.minutes % 60 })}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pin: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
