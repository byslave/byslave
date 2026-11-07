import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

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
import { loc, personById, venueById } from '@/src/data/demo';
import { findPulseEvent } from '@/src/features/events/catalog';
import { postponeEvent } from '@/src/features/events/lifecycle';
import { formatIstanbul, istanbulClock, istanbulDateISO, nightPhase } from '@/src/features/events/time';
import { useServerNow } from '@/src/features/events/useServerNow';
import { checkTicketUrl, shouldNotify } from '@/src/features/events/verification';
import { formatNumber } from '@/src/lib/format';
import { toHref } from '@/src/lib/nav';
import { shareText } from '@/src/lib/shareText';
import { visiblePrivacy } from '@/src/features/profile/privacy';
import { isSupabaseConfigured } from '@/src/lib/supabase/client';
import { useAppStore, useAttendanceStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

const reasons = ['fake', 'wrong', 'cancelled', 'spam'] as const;

export function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const localEvents = useAppStore((state) => state.localEvents);
  const eventOverrides = useAppStore((state) => state.eventOverrides);
  const customVenues = useAppStore((state) => state.customVenues);
  const event = typeof id === 'string' ? findPulseEvent(id, localEvents, eventOverrides) : undefined;
  const listedVenue = event ? venueById(event.venueId) : undefined;
  const customVenue = event ? customVenues.find((venue) => venue.id === event.venueId) : undefined;
  const venue = listedVenue ?? customVenue;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useServerNow();
  const privacy = useAppStore((state) => state.privacy);
  const privacyOnServer = useAppStore((state) => state.privacyOnServer);
  const user = useAppStore((state) => state.user);
  const blockedIds = useAppStore((state) => state.blockedIds);
  const addReport = useAppStore((state) => state.addReport);
  const reportEvent = useAppStore((state) => state.reportEvent);
  const blockPerson = useAppStore((state) => state.blockPerson);
  const cancelOwnedEvent = useAppStore((state) => state.cancelOwnedEvent);
  const postponeOwnedEvent = useAppStore((state) => state.postponeOwnedEvent);
  const pushInbox = useAppStore((state) => state.pushInbox);
  const shownPrivacy = visiblePrivacy({ privacy, privacyOnServer, userId: user?.id ?? null, serverConfigured: isSupabaseConfigured });
  const status = useAttendanceStore((state) => (event ? state.byEvent[event.id] : undefined));
  const setStatus = useAttendanceStore((state) => state.setStatus);
  const showToast = useToastStore((state) => state.show);
  const [reportOpen, setReportOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [personId, setPersonId] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState('');
  const [nextEndDate, setNextEndDate] = useState('');
  const [nextStart, setNextStart] = useState('23:00');
  const [nextEnd, setNextEnd] = useState('05:00');
  const [postponeError, setPostponeError] = useState('');

  if (!event || !venue) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState title={t('event.missing')} body={t('common.errorBody')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </View>
    );
  }

  const going = status === 'going';
  const interested = status === 'interested';
  const phase = nightPhase(new Date(event.startAt), new Date(event.endAt), now);
  const ticket = event.ticketUrl ? checkTicketUrl(event.ticketUrl) : null;
  const official = Boolean(ticket && ticket.ok && ticket.official);
  const owner = Boolean(user && event.createdBy === user.id);
  const when = `${formatIstanbul(new Date(event.startAt), i18n.language)} – ${formatIstanbul(new Date(event.endAt), i18n.language)}`;

  function notify(kind: 'cancelled' | 'postponed') {
    if (!shouldNotify(kind, status ?? null)) return;
    pushInbox({ kind, title: event?.title ?? '', eventId: event?.id ?? '' });
  }

  function savePostpone() {
    if (!event) return;
    const result = postponeEvent(
      {
        status: event.status,
        startAt: event.startAt,
        endAt: event.endAt,
        sessions: event.sessions,
        verificationStatus: event.verificationStatus,
        held: event.held,
      },
      { date: nextDate, endDate: nextEndDate || nextDate, startTime: nextStart, endTime: nextEnd, now },
    );
    if (!result.ok) {
      setPostponeError(t(`verify.${result.error}`));
      return;
    }
    postponeOwnedEvent({
      ...event,
      ...result.event,
      date: istanbulDateISO(new Date(result.event.startAt)),
      endDate: istanbulDateISO(new Date(result.event.endAt)),
      startTime: istanbulClock(new Date(result.event.startAt)),
      endTime: istanbulClock(new Date(result.event.endAt)),
    });
    notify('postponed');
    setPostponeOpen(false);
    showToast(t('event.postponed'));
  }

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
          <View style={styles.badges}>
            <Badge label={event.genres.map((genre) => t(`genres.${genre}`)).join(' · ')} tone="accent" />
            {event.sample ? <Badge label={t('event.sampleNote')} tone="accent" /> : null}
            <Badge
              label={event.verificationStatus === 'verified' ? t('event.verified') : t('event.unverified')}
              tone={event.verificationStatus === 'verified' ? 'success' : 'neutral'}
            />
            {phase === 'soon' ? <Badge label={t('event.soon')} tone="accent" /> : null}
            {phase === 'live' ? <Badge label={t('event.live')} tone="success" /> : null}
          </View>
          <AppText variant="display">{event.title}</AppText>
          <AppText variant="muted">
            {venue.name} · {venue.district}
            {venue.street ? ` · ${venue.street}` : ''} · {t(`venueTypes.${venue.type}`)}
          </AppText>
          <AppText variant="bodyMedium">{when}</AppText>
          {phase === 'over' || event.status === 'expired' ? <AppText variant="body">{t('event.ended')}</AppText> : null}
          {event.status === 'cancelled' ? <AppText variant="body">{t('event.cancelled')}</AppText> : null}
          {event.status === 'postponed' ? <AppText variant="body">{t('event.postponed')}</AppText> : null}
          <AppText variant="muted">
            {event.verificationStatus === 'verified' ? t('event.verifiedBody') : event.verificationStatus === 'pending' || event.held ? t('event.pendingBody') : t('event.unverifiedBody')}
          </AppText>
          {event.verificationStatus === 'verified' ? (
            <AppText variant="muted">{event.source === 'official_feed' || official ? t('event.sourceFeed') : t('event.sourceOrganizer')}</AppText>
          ) : null}
          <AppText variant="muted">
            {loc(event.price, i18n.language)} · {t('event.age', { count: event.ageLimit })}
          </AppText>
          {event.ticketUrl && ticket?.ok ? (
            <View style={styles.block}>
              {official ? <Badge label={t('event.officialTicket')} tone="success" /> : null}
              <Button label={t('event.openTicket')} variant="secondary" onPress={() => void Linking.openURL(event.ticketUrl ?? '')} />
            </View>
          ) : (
            <AppText variant="muted">{t('event.noTicket')}</AppText>
          )}
          <Button label={t('event.openVenue')} variant="secondary" onPress={() => router.push(toHref(`/venue/${venue.id}`))} />
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
          {going ? <Button label={t('event.record')} variant="secondary" onPress={() => router.push(toHref(`/session?event=${event.id}`))} /> : null}
          {owner && event.status === 'scheduled' ? (
            <View style={styles.actions}>
              <Button
                label={t('event.cancelEvent')}
                variant="danger"
                style={styles.action}
                onPress={() => {
                  const cancelled = cancelOwnedEvent(event.id);
                  if (!cancelled) return;
                  notify('cancelled');
                  showToast(t('event.cancelled'));
                }}
              />
              <Button
                label={t('event.postponeEvent')}
                variant="secondary"
                style={styles.action}
                onPress={() => {
                  setNextDate(event.date);
                  setNextEndDate(event.endDate);
                  setNextStart(event.startTime);
                  setNextEnd(event.endTime);
                  setPostponeError('');
                  setPostponeOpen(true);
                }}
              />
            </View>
          ) : null}
          <AppText variant="label">{t('event.samplePeople')}</AppText>
          {event.sample ? <Badge label={t('event.sampleNote')} tone="accent" /> : null}
          {shownPrivacy === 'ghost' && (going || interested) ? <AppText variant="muted">{t('event.ghostNote')}</AppText> : null}
          <View style={styles.people}>
            {event.attendeeIds.map((attendeeId) => {
              const person = personById(attendeeId);
              if (!person || blockedIds.includes(person.id)) return null;
              return (
                <Pressable key={person.id} accessibilityRole="button" accessibilityLabel={t('event.blockPerson')} onPress={() => setPersonId(person.id)} style={styles.person}>
                  <Avatar name={person.name} portrait={person.portrait} />
                  <AppText variant="muted">{person.name}</AppText>
                </Pressable>
              );
            })}
            {shownPrivacy !== 'ghost' && going ? (
              <View style={styles.person}>
                <Avatar name={t('profile.name')} />
                <AppText variant="muted">{t('board.you')}</AppText>
              </View>
            ) : null}
          </View>
          {event.lineup.length > 0 ? (
            <Card style={styles.block}>
              <AppText variant="label">{t('event.lineup')}</AppText>
              {event.lineup.map((artist) => (
                <AppText key={artist} variant="bodyMedium">
                  {artist}
                </AppText>
              ))}
            </Card>
          ) : null}
          <Card style={styles.block}>
            <AppText variant="label">{t('event.about')}</AppText>
            <AppText variant="body">{loc(event.description, i18n.language) || t('event.rulesBody')}</AppText>
          </Card>
          <Card style={styles.block}>
            <AppText variant="label">{t('event.rules')}</AppText>
            <AppText variant="body">{t('event.rulesBody')}</AppText>
          </Card>
          <Button
            label={t('common.share')}
            variant="secondary"
            onPress={() => void shareText(t('event.shareMessage', { title: event.title, venue: venue.name, when }))}
          />
          <AppText variant="muted">{t('event.reportPrompt')}</AppText>
          <Button label={t('event.report')} variant="ghost" onPress={() => setReportOpen(true)} />
        </View>
      </ScrollView>
      <BottomSheet visible={reportOpen} title={t('event.reportTitle')} onClose={() => setReportOpen(false)}>
        {reasons.map((reason) => (
          <Chip
            key={reason}
            label={t(`reasons.${reason}`)}
            onPress={() => {
              addReport({ target: 'event', targetId: event.id, reason });
              const result = reportEvent(event.id, user?.id ?? 'local');
              setReportOpen(false);
              showToast(result.held ? t('event.pendingBody') : t('event.reportThanks'));
            }}
          />
        ))}
      </BottomSheet>
      <BottomSheet visible={postponeOpen} title={t('event.postponeEvent')} onClose={() => setPostponeOpen(false)}>
        <AppText variant="label">{t('verify.start')}</AppText>
        <TextInput value={nextDate} onChangeText={setNextDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textFaint} style={styles.input} accessibilityLabel={t('verify.start')} />
        <TextInput value={nextStart} onChangeText={setNextStart} placeholder="HH:MM" placeholderTextColor={colors.textFaint} style={styles.input} accessibilityLabel={t('verify.start')} />
        <AppText variant="label">{t('verify.end')}</AppText>
        <AppText variant="muted">{t('verify.endHelp')}</AppText>
        <TextInput value={nextEndDate} onChangeText={setNextEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textFaint} style={styles.input} accessibilityLabel={t('verify.end')} />
        <TextInput value={nextEnd} onChangeText={setNextEnd} placeholder="HH:MM" placeholderTextColor={colors.textFaint} style={styles.input} accessibilityLabel={t('verify.end')} />
        {postponeError ? <AppText variant="muted">{postponeError}</AppText> : null}
        <Button label={t('event.postponeSave')} onPress={savePostpone} />
      </BottomSheet>
      <BottomSheet visible={personId !== null} title={t('event.blockPerson')} onClose={() => setPersonId(null)}>
        <Chip
          label={t('common.report')}
          onPress={() => {
            if (!personId) return;
            addReport({ target: 'person', targetId: personId, reason: 'unsafe' });
            setPersonId(null);
            showToast(t('event.reportThanks'));
          }}
        />
        <Chip
          label={t('common.block')}
          onPress={() => {
            if (!personId) return;
            blockPerson(personId);
            setPersonId(null);
            showToast(t('feed.blocked'));
          }}
        />
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  person: { alignItems: 'center', gap: 6, width: 84 },
  block: { gap: 8 },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: 14,
  },
});
