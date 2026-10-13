import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { ErrorState } from '@/src/components/ui/States';
import { confirmedCount } from '@/src/features/attendance/count';
import { covers } from '@/src/data/images';
import { eventById, loc, personById, venueById } from '@/src/data/demo';
import { formatClockRange, formatDayLabel, formatNumber } from '@/src/lib/format';
import { shareText } from '@/src/lib/shareText';
import { useAppStore, useAttendanceStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors } from '@/src/theme/tokens';

const reasons = ['wrong', 'spam', 'unsafe', 'duplicate'] as const;

export function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = typeof id === 'string' ? eventById(id) : undefined;
  const venue = event ? venueById(event.venueId) : undefined;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const privacy = useAppStore((state) => state.privacy);
  const addReport = useAppStore((state) => state.addReport);
  const status = useAttendanceStore((state) => (event ? state.byEvent[event.id] : undefined));
  const setStatus = useAttendanceStore((state) => state.setStatus);
  const showToast = useToastStore((state) => state.show);
  const [reportOpen, setReportOpen] = useState(false);

  if (!event || !venue) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState title={t('event.missing')} body={t('common.errorBody')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </View>
    );
  }

  const going = status === 'going';
  const interested = status === 'interested';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <View style={styles.hero}>
          <Image source={covers[event.cover]} style={styles.heroImage} contentFit="cover" />
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]}>
            <ChevronLeft color={colors.text} size={22} />
          </Pressable>
        </View>
        <View style={styles.body}>
          <Badge label={event.genres.map((genre) => t(`genres.${genre}`)).join(' · ')} tone="accent" />
          <AppText variant="display">{event.title}</AppText>
          <AppText variant="muted">
            {venue.name} · {venue.district} · {t(`venueTypes.${venue.type}`)}
          </AppText>
          <AppText variant="bodyMedium">
            {formatDayLabel(event.date, i18n.language)} · {formatClockRange(event.startTime, event.endTime)}
          </AppText>
          <AppText variant="muted">
            {loc(event.price, i18n.language)} · {t('event.age', { count: event.ageLimit })}
          </AppText>
          <AppText variant="stat">
            {formatNumber(confirmedCount(event.going, status ?? null), i18n.language)} {t('map.going')}
          </AppText>
          <View style={styles.actions}>
            <Button
              label={going ? t('event.goingDone') : t('event.going')}
              onPress={() => {
                setStatus(event.id, going ? null : 'going');
                showToast(t('event.savedGoing'));
              }}
              style={styles.action}
            />
            <Button
              label={interested ? t('event.interestedDone') : t('event.interested')}
              variant="secondary"
              onPress={() => setStatus(event.id, interested ? null : 'interested')}
              style={styles.action}
            />
          </View>
          <AppText variant="label">{t('event.samplePeople')}</AppText>
          {privacy === 'ghost' && (going || interested) ? <AppText variant="muted">{t('event.ghostNote')}</AppText> : null}
          <View style={styles.people}>
            {event.attendeeIds.map((personId) => {
              const person = personById(personId);
              if (!person) return null;
              return (
                <View key={person.id} style={styles.person}>
                  <Avatar name={person.name} portrait={person.portrait} />
                  <AppText variant="muted">{person.name}</AppText>
                </View>
              );
            })}
            {privacy !== 'ghost' && going ? (
              <View style={styles.person}>
                <Avatar name={t('profile.name')} />
                <AppText variant="muted">{t('board.you')}</AppText>
              </View>
            ) : null}
          </View>
          <Card style={styles.block}>
            <AppText variant="label">{t('event.lineup')}</AppText>
            {event.lineup.map((artist) => (
              <AppText key={artist} variant="bodyMedium">
                {artist}
              </AppText>
            ))}
          </Card>
          <Card style={styles.block}>
            <AppText variant="label">{t('event.about')}</AppText>
            <AppText variant="body">{loc(event.description, i18n.language)}</AppText>
          </Card>
          <Card style={styles.block}>
            <AppText variant="label">{t('event.rules')}</AppText>
            <AppText variant="body">{t('event.rulesBody')}</AppText>
          </Card>
          <Button
            label={t('common.share')}
            variant="secondary"
            onPress={() =>
              void shareText(
                t('event.shareMessage', {
                  title: event.title,
                  venue: venue.name,
                  when: `${formatDayLabel(event.date, i18n.language)} ${formatClockRange(event.startTime, event.endTime)}`,
                }),
              )
            }
          />
          <Button label={t('event.report')} variant="ghost" onPress={() => setReportOpen(true)} />
        </View>
      </ScrollView>
      <BottomSheet visible={reportOpen} title={t('event.reportTitle')} onClose={() => setReportOpen(false)}>
        {reasons.map((reason) => (
          <Chip
            key={reason}
            label={t(`reasons.${reason}`)}
            onPress={() => {
              addReport(event.id, reason);
              setReportOpen(false);
              showToast(t('event.reportSaved'));
            }}
          />
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 280, backgroundColor: colors.surface2 },
  heroImage: { width: '100%', height: '100%' },
  back: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,6,12,0.72)',
  },
  body: { padding: 16, gap: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  person: { alignItems: 'center', gap: 6, width: 84 },
  block: { gap: 8 },
});
