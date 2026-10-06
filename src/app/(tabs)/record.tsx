import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { PlaceList } from '../../components/PlaceList';
import { Button, Card, Field, Screen, Stat } from '../../components/ui';
import { searchPlaces, type PlaceHit } from '../../domain/venues';
import { nightKindLabel, nightKindOptions } from '../../domain/labels';
import { liveStats, needsWaterBreak, summaryFromTotals } from '../../domain/liveStats';
import type { NightKind } from '../../domain/types';
import { bleHeartState, subscribeBleHeart } from '../../health/bleHeartRate';
import { heartRateOriginForWatch } from '../../health/providers';
import { formatCalories, formatDistance, formatDuration } from '../../domain/format';
import { useRecording } from '../../features/record/useRecording';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { profile, events, saveActivity, updateProfile, addEvent } = useAppState();
  const recording = useRecording();
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventQuery, setEventQuery] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [nightKind, setNightKind] = useState<NightKind>('rave');
  const [note, setNote] = useState('');
  const [shared, setShared] = useState(true);
  const [sharePlace, setSharePlace] = useState(false);
  const [askPlace, setAskPlace] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ble, setBle] = useState(() => bleHeartState());

  useEffect(() => subscribeBleHeart(setBle), []);

  useEffect(() => {
    if (typeof params.eventId === 'string') setEventId(params.eventId);
  }, [params.eventId]);

  useEffect(() => {
    if (!profile || !recording.permissions) return;
    if (
      profile.motionStatus === recording.permissions.motion &&
      profile.locationStatus === recording.permissions.location
    ) {
      return;
    }
    void updateProfile({
      motionStatus: recording.permissions.motion,
      locationStatus: recording.permissions.location,
    });
  }, [profile, recording.permissions, updateProfile]);

  const heartRateOrigin = heartRateOriginForWatch(ble.connected ? 'granted' : 'skipped');
  const waterBreak = needsWaterBreak(recording.totals, heartRateOrigin);
  const preview = useMemo(() => {
    if (!profile) return null;
    return liveStats({
      totals: recording.totals,
      activeSeconds: recording.activeSeconds,
      body: profile,
      heartRateOrigin,
    });
  }, [heartRateOrigin, profile, recording.activeSeconds, recording.totals]);

  const { setContext } = recording;
  useEffect(() => {
    setContext({ eventId, nightKind, note, shared, locationShared: sharePlace });
  }, [eventId, nightKind, note, setContext, shared, sharePlace]);

  useEffect(() => {
    if (!eventQuery.trim() || typeof document === 'undefined') return;
    const timer = setTimeout(() => {
      document.getElementById('place-results')?.scrollIntoView({ block: 'center' });
    }, 40);
    return () => clearTimeout(timer);
  }, [eventQuery, events]);

  const restoreContext = (found: NonNullable<typeof recording.pending>) => {
    const context = found.context;
    if (!context) return;
    setEventId(context.eventId);
    setNightKind((context.nightKind as NightKind | undefined) ?? 'rave');
    setNote(context.note);
    setShared(context.shared);
    setSharePlace(context.locationShared);
  };

  const selectedEvent = events.find((item) => item.id === eventId) ?? null;
  const eventNeedle = eventQuery.trim();
  const places = searchPlaces(eventQuery, events);

  const pickPlace = async (place: PlaceHit) => {
    if (place.eventId) {
      setEventId(place.eventId);
      setEventQuery('');
      return;
    }
    if (creatingEvent) return;
    setCreatingEvent(true);
    const id = await addEvent({
      title: place.name,
      venue: place.name,
      city: place.city,
      startsAt: new Date().toISOString(),
      musicBpm: null,
      lineup: null,
    });
    setCreatingEvent(false);
    if (id) {
      setEventId(id);
      setEventQuery('');
    }
  };

  const createFromQuery = async () => {
    const name = eventQuery.trim();
    if (name.length < 2 || creatingEvent) return;
    setCreatingEvent(true);
    const id = await addEvent({
      title: name,
      venue: name,
      city: 'İstanbul',
      startsAt: new Date().toISOString(),
      musicBpm: null,
      lineup: null,
    });
    setCreatingEvent(false);
    if (id) {
      setEventId(id);
      setEventQuery('');
    }
  };

  const save = async () => {
    if (!profile || !preview || saving) return;
    setSaving(true);
    const snapshot = recording.finish();
    const event = events.find((item) => item.id === eventId) ?? null;
    const summary = summaryFromTotals({
      id: crypto.randomUUID(),
      userId: profile.id,
      event,
      totals: snapshot.totals,
      activeSeconds: snapshot.activeSeconds,
      body: profile,
      shared,
      locationShared: sharePlace,
      nightKind,
      note,
      heartRateOrigin,
    });
    await saveActivity(summary);
    setSaving(false);
    router.push(`/session/${summary.id}`);
  };

  const savePending = async (found: NonNullable<typeof recording.pending>) => {
    if (!profile || saving) return;
    setSaving(true);
    const context = found.context;
    const event = events.find((item) => item.id === (context?.eventId ?? null)) ?? null;
    const summary = summaryFromTotals({
      id: crypto.randomUUID(),
      userId: profile.id,
      event,
      totals: found.totals,
      activeSeconds: found.activeSeconds,
      body: profile,
      shared: context?.shared ?? true,
      locationShared: context?.locationShared ?? false,
      nightKind: (context?.nightKind as NightKind | undefined) ?? 'rave',
      note: context?.note ?? null,
      heartRateOrigin,
      now: found.savedAt,
    });
    recording.dropPending();
    await saveActivity(summary);
    setSaving(false);
    router.push(`/session/${summary.id}`);
  };

  return (
    <Screen
      footer={
        recording.phase === 'idle' ? (
          <Button label="Geceyi başlat" onPress={() => void recording.start()} />
        ) : (
          <View style={{ gap: space.sm }}>
            {recording.phase === 'running' ? (
              <Button label="Duraklat" kind="ghost" onPress={recording.pause} />
            ) : (
              <Button label="Devam" onPress={() => void recording.resume()} />
            )}
            <Button label="Bitir" onPress={() => void save()} disabled={recording.activeSeconds < 3 || saving} />
            <Button label="Vazgeç" kind="ghost" onPress={recording.discard} />
          </View>
        )
      }
    >
      {recording.pending && recording.phase === 'idle' ? (
        <Card>
          <Text style={styles.pendingTitle}>Yarım kalan gece</Text>
          <Text style={styles.meta}>
            {formatDuration(recording.pending.activeSeconds)} kayıtlı. Uygulama kapanmadan önce ölçülenler duruyor.
          </Text>
          <Button
            label="Kayda devam et"
            onPress={() => {
              const found = recording.pending;
              if (found) {
                restoreContext(found);
                void recording.continuePending(found);
              }
            }}
          />
          <Button label="Olduğu gibi kaydet" kind="ghost" onPress={() => recording.pending && void savePending(recording.pending)} />
          <Button label="Sil" kind="ghost" onPress={recording.dropPending} />
        </Card>
      ) : null}
      <Text style={styles.timer}>{formatDuration(recording.activeSeconds)}</Text>
      <Text style={styles.meta}>
        {recording.phase === 'running' ? 'Canlı' : recording.phase === 'paused' ? 'Duraklatıldı' : 'Hazır'}
        {recording.kind === 'device' ? ' · Telefon hareketi' : ''}
        {recording.kind === 'unavailable' ? ' · Sensör yok' : ''}
      </Text>
      {recording.kind === 'device' ? (
        <Text style={styles.meta}>Sayılar telefonun ivmesinden gelir. Hareket yoksa zıplama ve kalori sıfır kalır.</Text>
      ) : null}
      {recording.kind === 'unavailable' ? (
        <Text style={styles.meta}>Hareket algılanmıyor. Otururken zıplama ve kalori yazılmaz. iPhone’da Ayarlar, Safari, Hareket ve Yön açık olmalı.</Text>
      ) : null}
      <Text style={styles.meta}>
        {ble.connected
          ? ble.bpm != null
            ? `${ble.deviceName ?? 'Saat'} bağlı. Nabız ${ble.bpm}.`
            : `${ble.deviceName ?? 'Saat'} bağlı. İlk nabız bekleniyor.`
          : 'Saat bağlı değil. Nabız alınmıyor.'}
      </Text>
      {recording.activeSeconds > 0 && recording.activeSeconds < 3 ? (
        <Text style={styles.meta}>Bitirmek için birkaç saniye.</Text>
      ) : null}
      <Card>
        <View style={styles.stats}>
          <Stat label="Kalori · tahmin" value={formatCalories(preview?.calories ?? 0)} hint={(preview?.calories ?? 0) <= 0 ? 'Hareket yok' : preview?.assumedWeight ? '70 kg varsayıldı' : preview?.calorieMethod === 'heart-rate' ? 'Nabız formülü' : 'Hareket formülü'} />
          <Stat label="Party Score" value={String(preview?.partyScore ?? 0)} hint="Süre, zıplama, yoğunluk, kalori, mesafe" />
        </View>
        <View style={styles.stats}>
          <Stat label="Zıplama" value={String(preview?.jumps ?? 0)} />
          <Stat label="Mesafe" value={formatDistance(preview?.distanceMeters ?? 0)} />
        </View>
        <View style={styles.stats}>
          <Stat
            label="Nabız"
            value={heartRateOrigin === 'measured' && preview?.avgHeartRate ? Math.round(preview.avgHeartRate).toString() : '—'}
            hint={heartRateOrigin === 'measured' ? undefined : ble.connected ? 'Nabız bekleniyor' : 'Saat yok'}
          />
          <Stat label="Yoğunluk" value={`${Math.round((preview?.intensity ?? 0) * 100)}`} hint="Hareketin sertliği" />
        </View>
        <View style={styles.intensity}>
          <View style={[styles.fill, { width: `${Math.round((preview?.intensity ?? 0) * 100)}%` }]} />
        </View>
        <Text style={styles.meta}>Yoğunluk, ne kadar sert zıpladığın. 0 sakin, 100 en sert an. Nerede durduğunu göstermez.</Text>
      </Card>
      <Text style={styles.meta}>Gece türü · {nightKindLabel(nightKind)}</Text>
      <View style={styles.chips}>
        {nightKindOptions.map((option) => (
          <Pressable key={option.id} onPress={() => setNightKind(option.id)} style={[styles.chip, nightKind === option.id && styles.chipOn]}>
            <Text style={styles.chipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.meta}>Etkinlik</Text>
      <Field value={eventQuery} onChangeText={setEventQuery} placeholder="Mekân veya etkinlik ara" autoCorrect={false} />
      {eventNeedle.length === 0 ? (
        <View style={styles.chips}>
          <Pressable accessibilityRole="button" onPress={() => setEventId(null)} style={[styles.chip, eventId == null && styles.chipOn]}>
            <Text style={styles.chipText}>Serbest gece</Text>
          </Pressable>
          {selectedEvent ? (
            <Pressable accessibilityRole="button" onPress={() => setEventId(null)} style={[styles.chip, styles.chipOn]}>
              <Text style={styles.chipText}>
                {selectedEvent.venue} · {selectedEvent.title}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <PlaceList places={places} onPick={(place) => void pickPlace(place)} />
          {places.length === 0 && eventNeedle.trim().length >= 2 ? (
            <Pressable accessibilityRole="button" onPress={() => void createFromQuery()} disabled={creatingEvent} style={styles.chip}>
              <Text style={styles.chipText}>{creatingEvent ? 'Ekleniyor' : `“${eventQuery.trim()}” mekanını ekle`}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      <Field value={note} onChangeText={(value) => setNote(value.slice(0, 80))} placeholder="Gece notu, 80 karakter" />
      {waterBreak ? (
        <Card>
          <Text style={styles.meta}>Su molası. Nabız bir süredir yüksek.</Text>
        </Card>
      ) : null}
      <View style={styles.shareRow}>
        <Text style={styles.meta}>Arkadaşların görsün</Text>
        <Switch value={shared} onValueChange={setShared} trackColor={{ true: colors.red, false: colors.border }} />
      </View>
      <View style={styles.shareRow}>
        <Text style={styles.meta}>Arkadaşını bul</Text>
        <Switch
          value={sharePlace}
          onValueChange={(value) => {
            if (value) setAskPlace(true);
            else setSharePlace(false);
          }}
          trackColor={{ true: colors.red, false: colors.border }}
        />
      </View>
      {askPlace ? (
        <Card>
          <Text style={styles.meta}>Takipçilerin bu gecenin rotasını görür. Kapalı kalsın istersen vazgeç.</Text>
          <Button label="Rotayı aç" onPress={() => { setSharePlace(true); setAskPlace(false); }} />
          <Button label="Vazgeç" kind="ghost" onPress={() => setAskPlace(false)} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { color: colors.white, fontSize: 64, fontWeight: '700', letterSpacing: -1 },
  pendingTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
  stats: { flexDirection: 'row', gap: space.md },
  intensity: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.red },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { borderColor: colors.red, backgroundColor: '#2A0C0E' },
  chipText: { color: colors.white, fontSize: 13 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
