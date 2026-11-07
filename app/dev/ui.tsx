import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { AvatarStack } from '@/src/components/ui/AvatarStack';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { CounterPill } from '@/src/components/ui/CounterPill';
import { PodiumRow } from '@/src/components/ui/PodiumRow';
import { RatingStars } from '@/src/components/ui/RatingStars';
import { Segmented } from '@/src/components/ui/Segmented';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { StatBlock } from '@/src/components/ui/StatBlock';
import { colors } from '@/src/theme/tokens';

export default function ComponentGallery() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(4);
  const [segment, setSegment] = useState('one');
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 20 }]}>
      <AppText variant="display">{t('dev.title')}</AppText>
      <Button label={t('map.viewEvent')} onPress={() => undefined} />
      <Button label={t('common.share')} variant="secondary" onPress={() => undefined} />
      <Chip label={t('genres.techno')} selected />
      <Chip label={t('genres.house')} />
      <CounterPill label="Klein Phönix" count={184} selected />
      <Badge label={t('common.sample')} tone="accent" />
      <AvatarStack people={[{ name: 'Ece', portrait: 'p1' }, { name: 'Kerem', portrait: 'p2' }]} />
      <Card>
        <StatBlock label={t('night.jumps')} value="1.248" />
      </Card>
      <Segmented
        value={segment}
        onChange={setSegment}
        values={[
          { id: 'one', label: t('feed.forYou') },
          { id: 'two', label: t('feed.nearby') },
        ]}
      />
      <RatingStars value={stars} onChange={setStars} />
      <PodiumRow rank={1} name="Ece Yılmaz" value="1.820" portrait="p1" highlight />
      <Skeleton style={styles.skeleton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, padding: 16, gap: 16, paddingBottom: 48 },
  skeleton: { height: 72 },
});
