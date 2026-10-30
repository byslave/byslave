import { useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronDown, LocateFixed, Plus, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { AvatarStack } from '@/src/components/ui/AvatarStack';
import { Badge } from '@/src/components/ui/Badge';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { EmptyState, ErrorState } from '@/src/components/ui/States';
import { AddVenueSheet } from '@/src/features/map/components/AddVenueSheet';
import { PulseMap, type PulseMapHandle } from '@/src/features/map/components/PulseMap';
import { confirmedCount } from '@/src/features/attendance/count';
import { activeDateISO, eventMatchesDate, nearestEventDate, upcomingDates, type DateFilter } from '@/src/features/events/dates';
import { cities, events, personById, venueById, venues, type CityId, type Genre } from '@/src/data/demo';
import { formatClockRange, formatDayLabel, formatNumber } from '@/src/lib/format';
import { toHref } from '@/src/lib/nav';
import { mapStyleUrl } from '@/src/lib/supabase/client';
import { useAppStore, useAttendanceStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii, tabClearance } from '@/src/theme/tokens';

const genreOrder: Genre[] = ['techno', 'house', 'electro', 'trance', 'dnb', 'hiphop', 'pop'];

export function MapScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<PulseMapHandle>(null);
  const city = useAppStore((state) => state.city);
  const setCity = useAppStore((state) => state.setCity);
  const customVenues = useAppStore((state) => state.customVenues);
  const locationConsent = useAppStore((state) => state.consents.location?.granted);
  const setConsent = useAppStore((state) => state.setConsent);
  const attendance = useAttendanceStore((state) => state.byEvent);
  const showToast = useToastStore((state) => state.show);
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: 'tonight' });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>('klein');
  const [cityOpen, setCityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapEpoch, setMapEpoch] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [pan, setPan] = useState<{ city: CityId; lng: number; lat: number; zoom: number } | null>(null);
  const mapView = pan?.city === city ? pan : cities[city];

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(i18n.language);
    return events
      .map((event) => ({ event, venue: venueById(event.venueId) }))
      .filter((row): row is { event: (typeof events)[number]; venue: NonNullable<ReturnType<typeof venueById>> } => Boolean(row.venue))
      .filter((row) => row.venue.city === city)
      .filter((row) => eventMatchesDate(row.event.date, dateFilter, new Date()))
      .filter((row) => genres.length === 0 || row.event.genres.some((genre) => genres.includes(genre)))
      .filter((row) => {
        if (!needle) return true;
        const haystack = [row.event.title, row.venue.name, row.venue.district, ...row.event.lineup]
          .join(' ')
          .toLocaleLowerCase(i18n.language);
        return haystack.includes(needle);
      });
  }, [city, dateFilter, genres, i18n.language, search]);

  const pending = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(i18n.language);
    return customVenues.filter((venue) => venue.city === city).filter((venue) => {
      if (!needle) return true;
      return [venue.name, venue.district].join(' ').toLocaleLowerCase(i18n.language).includes(needle);
    });
  }, [city, customVenues, i18n.language, search]);

  const cityVenues = useMemo(() => venues.filter((venue) => venue.city === city), [city]);
  const nearest = useMemo(
    () => nearestEventDate(events.filter((event) => venueById(event.venueId)?.city === city).map((event) => event.date), new Date()),
    [city],
  );
  const selectedPending = pending.find((venue) => venue.id === selectedId) ?? null;
  const selected = selectedPending ? null : (filtered.find((row) => row.venue.id === selectedId) ?? filtered[0] ?? null);
  const fallbackVenue = filtered.length === 0 ? (cityVenues.find((venue) => venue.id === selectedId) ?? cityVenues[0] ?? null) : null;
  const center = cities[city];
  const focus = selectedPending ?? selected?.venue ?? fallbackVenue ?? null;
  const mapCenter = focus ? { lng: focus.lng, lat: focus.lat } : center;
  const mapZoom = focus ? 15 : center.zoom;

  function choosePin(id: string) {
    setSelectedId(id);
    const pendingPlace = pending.find((venue) => venue.id === id);
    const eventPlace = filtered.find((row) => row.venue.id === id)?.venue;
    const listed = cityVenues.find((venue) => venue.id === id);
    const place = pendingPlace ?? eventPlace ?? listed;
    if (place) mapRef.current?.recenter(place.lng, place.lat, 15);
  }
  const dateLabel = formatDayLabel(activeDateISO(dateFilter, new Date()), i18n.language);

  async function locate() {
    if (locationConsent === false) {
      showToast(t('map.locateDenied'));
      return;
    }
    const current = await Location.getForegroundPermissionsAsync();
    const next = current.granted ? current : await Location.requestForegroundPermissionsAsync();
    if (!next.granted) {
      setConsent('location', false);
      showToast(t('map.locateDenied'));
      return;
    }
    setConsent('location', true);
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.recenter(position.coords.longitude, position.coords.latitude);
  }

  return (
    <View style={styles.screen}>
      {mapFailed ? (
        <ErrorState
          title={t('map.errorTitle')}
          body={t('map.errorBody')}
          actionLabel={t('common.retry')}
          onAction={() => {
            setMapFailed(false);
            setMapReady(false);
            setMapEpoch((value) => value + 1);
          }}
        />
      ) : (
        <PulseMap
          key={`${city}-${mapEpoch}`}
          ref={mapRef}
          pins={[
            ...(filtered.length > 0 ? filtered : cityVenues.map((venue) => ({ event: null, venue }))).map((row) => ({
              id: row.venue.id,
              lng: row.venue.lng,
              lat: row.venue.lat,
              label: row.venue.name,
              count: row.event ? confirmedCount(row.event.going, attendance[row.event.id] ?? null) : 0,
            })),
            ...pending.map((venue) => ({
              id: venue.id,
              lng: venue.lng,
              lat: venue.lat,
              label: venue.name,
              count: 0,
            })),
          ]}
          selectedId={selectedPending?.id ?? selected?.venue.id ?? fallbackVenue?.id ?? null}
          center={mapCenter}
          zoom={mapZoom}
          clusterWord={t('map.cluster')}
          styleUrl={mapStyleUrl()}
          onSelect={choosePin}
          onMove={(next) => setPan({ city, lng: next.lng, lat: next.lat, zoom: next.zoom })}
          onError={() => setMapFailed(true)}
          onReady={() => setMapReady(true)}
        />
      )}

      <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <Pressable accessibilityRole="button" onPress={() => setCityOpen(true)} style={styles.cityHit}>
            <AppText variant="title">{t(`cities.${city}`)}</AppText>
            <ChevronDown color={colors.text} size={22} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setDateOpen(true)} style={styles.datePill}>
            <Calendar color={colors.text} size={14} />
            <AppText variant="bodyMedium">{dateLabel}</AppText>
          </Pressable>
        </View>
        <View style={styles.search}>
          <Search color={colors.textFaint} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('map.search')}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            accessibilityLabel={t('map.search')}
          />
        </View>
        <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('map.tonight')} selected={dateFilter.kind === 'tonight'} onPress={() => setDateFilter({ kind: 'tonight' })} />
          <Chip label={t('map.weekend')} selected={dateFilter.kind === 'weekend'} onPress={() => setDateFilter({ kind: 'weekend' })} />
          {genreOrder.map((genre) => (
            <Chip
              key={genre}
              label={t(`genres.${genre}`)}
              selected={genres.includes(genre)}
              onPress={() => setGenres((current) => (current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]))}
            />
          ))}
        </ScrollView>
        <LinearGradient pointerEvents="none" colors={['rgba(7,6,12,0)', 'rgba(7,6,12,0.95)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chipFade} />
        </View>
      </View>

      <View pointerEvents="box-none" style={[styles.bottom, { bottom: tabClearance }]}>
        <View style={styles.metaRow}>
          <View style={styles.metaCopy}>
            <OfflineBanner />
            <AppText variant="muted">
              {t('map.sampleCounts')} · {t('map.locationPrivate')}
            </AppText>
          </View>
          <View style={styles.mapActions}>
            {width >= 768 ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('map.addVenue')} onPress={() => setAddOpen(true)} style={styles.locate}>
                <Plus color={colors.text} size={18} />
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={t('map.locate')} onPress={() => void locate()} style={styles.locate}>
              <LocateFixed color={colors.text} size={18} />
            </Pressable>
          </View>
        </View>
        {!mapReady && !mapFailed ? <View style={styles.loadingBar} /> : null}
        {selectedPending ? (
          <Card>
            <View style={styles.cardTop}>
              <Badge label={t('map.pending')} tone="accent" />
            </View>
            <AppText variant="heading">{selectedPending.name}</AppText>
            <AppText variant="muted">
              {t(`venueTypes.${selectedPending.type}`)} · {selectedPending.district}
              {selectedPending.street ? ` · ${selectedPending.street}` : ''}
            </AppText>
            <AppText variant="muted">{t('map.pendingBody')}</AppText>
            {selectedPending.rules ? <AppText variant="body">{selectedPending.rules}</AppText> : null}
            <AppText variant="bodyMedium">0 {t('map.going')}</AppText>
          </Card>
        ) : selected ? (
          <Card>
            <View style={styles.cardTop}>
              <Badge label={selected.event.genres.map((genre) => t(`genres.${genre}`)).join(' · ')} tone="accent" />
            </View>
            <AppText variant="heading">{selected.event.title}</AppText>
            <AppText variant="muted">
              {selected.venue.name} · {selected.venue.district}
              {selected.venue.street ? ` · ${selected.venue.street}` : ''}
            </AppText>
            <AppText variant="muted">
              {formatDayLabel(selected.event.date, i18n.language)} · {formatClockRange(selected.event.startTime, selected.event.endTime)}
            </AppText>
            <View style={styles.counts}>
              <AppText variant="bodyMedium">
                {formatNumber(confirmedCount(selected.event.going, attendance[selected.event.id] ?? null), i18n.language)} {t('map.going')}
              </AppText>
              <AppText variant="muted">
                {formatNumber(selected.event.checkedIn, i18n.language)} {t('map.checkedIn')}
              </AppText>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.mutuals}>
                <AvatarStack
                  people={selected.event.attendeeIds.map((id) => {
                    const person = personById(id);
                    return { name: person?.name ?? id, portrait: person?.portrait };
                  })}
                />
                <AppText variant="muted">{t('map.mutuals', { count: selected.event.mutuals })}</AppText>
              </View>
              <Button label={t('map.viewEvent')} onPress={() => router.push(`/event/${selected.event.id}`)} />
            </View>
          </Card>
        ) : (
          <Card>
            {fallbackVenue ? (
              <View style={styles.cardTop}>
                <Badge label={t('common.sampleData')} tone="accent" />
                <AppText variant="heading">{fallbackVenue.name}</AppText>
                <AppText variant="muted">
                  {fallbackVenue.district}
                  {fallbackVenue.street ? ` · ${fallbackVenue.street}` : ''}
                </AppText>
                <AppText variant="body">{t('map.noEventHere')}</AppText>
                <Button label={t('map.openVenue')} variant="secondary" onPress={() => router.push(toHref(`/venue/${fallbackVenue.id}`))} />
              </View>
            ) : null}
            <EmptyState
              title={t('map.emptyTitle')}
              body={t('map.emptyBody')}
              actionLabel={t('map.reset')}
              onAction={() => {
                setSearch('');
                setGenres([]);
                setDateFilter({ kind: 'tonight' });
              }}
            />
            {nearest ? (
              <Button label={t('map.nearest')} variant="ghost" onPress={() => setDateFilter({ kind: 'day', iso: nearest })} />
            ) : null}
          </Card>
        )}
      </View>

      <BottomSheet visible={cityOpen} title={t('map.cityTitle')} onClose={() => setCityOpen(false)}>
        {(Object.keys(cities) as CityId[]).map((id) => (
          <Chip
            key={id}
            label={t(`cities.${id}`)}
            selected={id === city}
            onPress={() => {
              setCity(id);
              setCityOpen(false);
            }}
          />
        ))}
      </BottomSheet>
      <BottomSheet visible={dateOpen} title={t('map.dateTitle')} onClose={() => setDateOpen(false)}>
        <Chip label={t('map.tonight')} selected={dateFilter.kind === 'tonight'} onPress={() => { setDateFilter({ kind: 'tonight' }); setDateOpen(false); }} />
        <Chip label={t('map.weekend')} selected={dateFilter.kind === 'weekend'} onPress={() => { setDateFilter({ kind: 'weekend' }); setDateOpen(false); }} />
        {upcomingDates(new Date(), 7).map((iso) => (
          <Chip
            key={iso}
            label={formatDayLabel(iso, i18n.language)}
            selected={dateFilter.kind === 'day' && dateFilter.iso === iso}
            onPress={() => {
              setDateFilter({ kind: 'day', iso });
              setDateOpen(false);
            }}
          />
        ))}
      </BottomSheet>
      <AddVenueSheet
        visible={addOpen}
        city={city}
        center={mapView}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => {
          setSelectedId(id);
        }}
        onPreview={(lng, lat) => mapRef.current?.recenter(lng, lat, 15)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', left: 16, right: 16, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cityHit: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22,19,30,0.9)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22,19,30,0.92)',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 15, minHeight: 44 },
  chips: { gap: 8, paddingRight: 36 },
  chipFade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 36 },
  bottom: { position: 'absolute', left: 12, right: 12, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metaCopy: { flex: 1, gap: 2 },
  mapActions: { flexDirection: 'row', gap: 8 },
  locate: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,19,30,0.92)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  loadingBar: { height: 3, borderRadius: 2, backgroundColor: colors.accentDeep },
  cardTop: { marginBottom: 8 },
  counts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  mutuals: { flex: 1, gap: 6 },
});
