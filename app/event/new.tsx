import { createElement, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { venues, type Genre } from '@/src/data/demo';
import { assembleEvents } from '@/src/features/events/catalog';
import type { ScheduleError } from '@/src/features/events/schedule';
import { validateWindow } from '@/src/features/events/schedule';
import { istanbulClock, istanbulDateISO } from '@/src/features/events/time';
import { useServerNow } from '@/src/features/events/useServerNow';
import { checkTicketUrl, initialVerification, isDuplicateSlot, titlesTooSimilar, withinDailyCap } from '@/src/features/events/verification';
import type { PulseEvent } from '@/src/features/events/model';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

const genreOrder: Genre[] = ['techno', 'house', 'electro', 'trance', 'dnb', 'hiphop', 'pop'];

export default function NewEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useServerNow();
  const user = useAppStore((state) => state.user);
  const city = useAppStore((state) => state.city);
  const customVenues = useAppStore((state) => state.customVenues);
  const localEvents = useAppStore((state) => state.localEvents);
  const eventOverrides = useAppStore((state) => state.eventOverrides);
  const organizer = useAppStore((state) => state.organizer);
  const accountCreatedAt = useAppStore((state) => state.accountCreatedAt);
  const addLocalEvent = useAppStore((state) => state.addLocalEvent);
  const showToast = useToastStore((state) => state.show);
  const places = useMemo(
    () => [...venues.filter((venue) => venue.city === city), ...customVenues.filter((venue) => venue.city === city)],
    [city, customVenues],
  );
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [venueId, setVenueId] = useState(places[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('23:00');
  const [endTime, setEndTime] = useState('05:00');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [age, setAge] = useState(18);
  const [genre, setGenre] = useState<Genre>('techno');
  const [ticket, setTicket] = useState('');
  const [image, setImage] = useState('');
  const [second, setSecond] = useState(false);
  const [date2, setDate2] = useState('');
  const [endDate2, setEndDate2] = useState('');
  const [start2, setStart2] = useState('23:00');
  const [end2, setEnd2] = useState('05:00');
  const [error, setError] = useState('');
  const [similarArmed, setSimilarArmed] = useState(false);
  const verifiedHost = organizer?.status === 'approved';

  function fail(key: string) {
    setError(t(key as 'verify.needDate'));
  }

  function save() {
    setError('');
    if (!title.trim() || !concept.trim() || !venueId) {
      fail('verify.requiredDetails');
      return;
    }
    const main = validateWindow({
      date,
      endDate: endDate || date,
      startTime,
      endTime,
      timeUnconfirmed: timeUnknown,
      now,
    });
    if (!main.ok) {
      fail(`verify.${main.error satisfies ScheduleError}`);
      return;
    }
    let extra: { start: Date; end: Date } | null = null;
    if (second) {
      const next = validateWindow({ date: date2, endDate: endDate2 || date2, startTime: start2, endTime: end2, timeUnconfirmed: false, now });
      if (!next.ok) {
        fail(`verify.${next.error}`);
        return;
      }
      extra = next;
    }
    const startAt = main.start.toISOString();
    const catalog = assembleEvents(localEvents, eventOverrides);
    if (isDuplicateSlot(catalog, venueId, startAt) || (extra && isDuplicateSlot(catalog, venueId, extra.start.toISOString()))) {
      fail('verify.duplicate');
      return;
    }
    const createdAt = localEvents.filter((event) => event.createdBy === (user?.id ?? null)).map((event) => event.createdAt);
    const account = accountCreatedAt ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (!withinDailyCap({ accountCreatedAt: account, createdAt, now })) {
      fail('verify.dailyCap');
      return;
    }
    if (!similarArmed && catalog.some((event) => event.status === 'scheduled' && titlesTooSimilar(event.title, title))) {
      setSimilarArmed(true);
      fail('verify.similar');
      return;
    }
    if (!ticket.trim()) {
      fail('verify.ticketRequired');
      return;
    }
    let officialTicket: string | null = null;
    if (ticket.trim()) {
      const checked = checkTicketUrl(ticket.trim());
      if (!checked.ok) {
        fail(checked.error === 'https' ? 'verify.ticketHttps' : checked.error === 'shortener' ? 'verify.ticketShort' : 'verify.ticketFormat');
        return;
      }
      officialTicket = ticket.trim();
    }
    if (image.trim()) {
      const checked = checkTicketUrl(image.trim());
      if (!checked.ok) {
        fail('verify.ticketFormat');
        return;
      }
    }
    const end = extra && extra.end.getTime() > main.end.getTime() ? extra.end : main.end;
    const start = extra && extra.start.getTime() < main.start.getTime() ? extra.start : main.start;
    const verification = initialVerification(verifiedHost);
    const event: PulseEvent = {
      id: `evt-${Date.now()}`,
      venueId,
      title: title.trim(),
      concept: concept.trim(),
      date: istanbulDateISO(start),
      endDate: istanbulDateISO(end),
      startTime: timeUnknown ? istanbulClock(start) : startTime,
      endTime: timeUnknown ? istanbulClock(end) : istanbulClock(end),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      genres: [genre],
      lineup: [],
      price: { tr: '', en: '' },
      ageLimit: age,
      description: { tr: '', en: '' },
      going: 0,
      checkedIn: 0,
      mutuals: 0,
      cover: 'crowd',
      attendeeIds: [],
      source: verifiedHost ? 'organizer' : 'community',
      sourceName: null,
      externalId: null,
      ticketUrl: officialTicket,
      verificationStatus: verification,
      verifiedAt: verification === 'verified' ? now.toISOString() : null,
      verifiedBy: verification === 'verified' ? (user?.id ?? null) : null,
      verificationNote: null,
      status: 'scheduled',
      timeUnconfirmed: timeUnknown,
      sessions: extra
        ? [
            { id: 'one', startAt: main.start.toISOString(), endAt: main.end.toISOString() },
            { id: 'two', startAt: extra.start.toISOString(), endAt: extra.end.toISOString() },
          ]
        : [],
      held: false,
      reporters: [],
      createdBy: user?.id ?? null,
      createdAt: now.toISOString(),
      sample: false,
    };
    addLocalEvent(event);
    showToast(t('verify.saved'));
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('verify.add')}</AppText>
      <AppText variant="body">{t('verify.addHint')}</AppText>
      <AppText variant="muted">{t('verify.ticketHint')}</AppText>
      <AppText variant="muted">{t('verify.autoRemove')}</AppText>
      <Field
        label={t('verify.title')}
        value={title}
        onChange={(value) => {
          setTitle(value);
          setSimilarArmed(false);
        }}
      />
      <Field label={t('verify.concept')} value={concept} onChange={setConcept} />
      <AppText variant="label">{t('verify.venue')}</AppText>
      <View style={styles.wrap}>
        {places.map((place) => (
          <Chip key={place.id} label={place.name} selected={venueId === place.id} onPress={() => setVenueId(place.id)} />
        ))}
      </View>
      <AppText variant="label">{t('verify.start')}</AppText>
      <Field label="" value={date} onChange={setDate} mode="date" />
      {timeUnknown ? null : <Field label="" value={startTime} onChange={setStartTime} mode="time" />}
      <Chip label={t('verify.timeUnknown')} selected={timeUnknown} onPress={() => setTimeUnknown((value) => !value)} />
      <AppText variant="label">{t('verify.end')}</AppText>
      <AppText variant="muted">{t('verify.endHelp')}</AppText>
      {timeUnknown ? null : (
        <>
          <Field label="" value={endDate} onChange={setEndDate} mode="date" />
          <Field label="" value={endTime} onChange={setEndTime} mode="time" />
        </>
      )}
      <AppText variant="label">{t('verify.age')}</AppText>
      <View style={styles.wrap}>
        <Chip label="18+" selected={age === 18} onPress={() => setAge(18)} />
        <Chip label="21+" selected={age === 21} onPress={() => setAge(21)} />
      </View>
      <AppText variant="label">{t('verify.genre')}</AppText>
      <View style={styles.wrap}>
        {genreOrder.map((item) => (
          <Chip key={item} label={t(`genres.${item}`)} selected={genre === item} onPress={() => setGenre(item)} />
        ))}
      </View>
      <Field label={t('verify.ticket')} value={ticket} onChange={setTicket} />
      <Field label={t('verify.image')} value={image} onChange={setImage} />
      <Chip label={t('verify.session')} selected={second} onPress={() => setSecond((value) => !value)} />
      {second ? (
        <View style={styles.block}>
          <AppText variant="muted">{t('verify.sessionHint')}</AppText>
          <Field label={t('verify.start')} value={date2} onChange={setDate2} mode="date" />
          <Field label="" value={start2} onChange={setStart2} mode="time" />
          <Field label={t('verify.end')} value={endDate2} onChange={setEndDate2} mode="date" />
          <Field label="" value={end2} onChange={setEnd2} mode="time" />
        </View>
      ) : null}
      {error ? <AppText variant="body">{error}</AppText> : null}
      <Button label={t('verify.submit')} onPress={save} />
    </ScrollView>
  );
}

function Field({ label, value, onChange, mode }: { label: string; value: string; onChange: (value: string) => void; mode?: 'date' | 'time' }) {
  const webPicker =
    Platform.OS === 'web' && mode
      ? createElement('input', {
          type: mode,
          value,
          'aria-label': label || mode,
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          style: {
            minHeight: 48,
            borderRadius: 12,
            border: `1px solid ${colors.line}`,
            background: colors.bg,
            color: colors.text,
            fontFamily: fonts.body,
            fontSize: 16,
            padding: '0 14px',
          },
        })
      : null;
  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      {webPicker ?? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={mode === 'date' ? 'YYYY-MM-DD' : mode === 'time' ? 'HH:MM' : ''}
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          accessibilityLabel={label || mode || 'field'}
          style={styles.input}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  block: { gap: 8 },
  field: { gap: 6 },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
  },
});
