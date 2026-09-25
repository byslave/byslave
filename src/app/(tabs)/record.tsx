import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Field, Screen, Stat } from '../../components/ui';
import { nightKindLabel, nightKindOptions } from '../../domain/labels';
import { buildSummary } from '../../domain/scoring';
import type { NightKind } from '../../domain/types';
import { formatCalories, formatDistance, formatDuration } from '../../domain/format';
import { useRecording } from '../../features/record/useRecording';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { profile, events, saveActivity } = useAppState();
  const recording = useRecording();
  const [eventId, setEventId] = useState<string | null>(null);
  const [nightKind, setNightKind] = useState<NightKind>('rave');
  const [note, setNote] = useState('');
  const [shared, setShared] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof params.eventId === 'string') setEventId(params.eventId);
  }, [params.eventId]);

  const preview = useMemo(() => {
    if (!profile) return null;
    const event = events.find((item) => item.id === eventId) ?? null;
    return buildSummary({
      id: 'preview',
      userId: profile.id,
      event,
      activeSeconds: recording.activeSeconds,
      samples: recording.samples,
      body: profile,
      shared,
      nightKind,
      heartRateOrigin: recording.kind === 'demo' ? 'estimated' : 'none',
    });
  }, [eventId, events, nightKind, profile, recording.activeSeconds, recording.kind, recording.samples, shared]);

  const save = async () => {
    if (!profile || !preview || saving) return;
    setSaving(true);
    const snapshot = recording.finish();
    const event = events.find((item) => item.id === eventId) ?? null;
    const summary = buildSummary({
      id: crypto.randomUUID(),
      userId: profile.id,
      event,
      activeSeconds: snapshot.activeSeconds,
      samples: snapshot.samples,
      body: profile,
      shared,
      nightKind,
      note,
      heartRateOrigin: snapshot.kind === 'demo' ? 'estimated' : 'none',
    });
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
      <Text style={styles.timer}>{formatDuration(recording.activeSeconds)}</Text>
      <Text style={styles.meta}>
        {recording.phase === 'running' ? 'Canlı' : recording.phase === 'paused' ? 'Duraklatıldı' : 'Hazır'}
        {recording.kind === 'demo' ? ' · Demo hareket' : ''}
        {recording.kind === 'device' ? ' · Telefon hareketi' : ''}
      </Text>
      {recording.kind === 'demo' ? (
        <Text style={styles.meta}>Bu ortamda sensör yok. Zıplama ve nabız tahmindir.</Text>
      ) : null}
      {profile?.watchLabel ? (
        <Text style={styles.meta}>
          {profile.watchLabel} {profile.watchStatus === 'granted' ? 'bağlı' : 'eşleşmedi'}
        </Text>
      ) : null}
      {recording.activeSeconds > 0 && recording.activeSeconds < 3 ? (
        <Text style={styles.meta}>Bitirmek için birkaç saniye.</Text>
      ) : null}
      <Card>
        <View style={styles.stats}>
          <Stat label="Kalori · tahmin" value={formatCalories(preview?.calories ?? 0)} hint={preview?.assumedWeight ? '70 kg varsayıldı' : preview?.calorieMethod === 'heart-rate' ? 'Nabız formülü' : 'Hareket formülü'} />
          <Stat label="Party Score" value={String(preview?.partyScore ?? 0)} />
        </View>
        <View style={styles.stats}>
          <Stat label="Zıplama" value={String(preview?.jumps ?? 0)} />
          <Stat label="Mesafe" value={formatDistance(preview?.distanceMeters ?? 0)} />
        </View>
        <View style={styles.stats}>
          <Stat
            label={preview?.heartRateOrigin === 'estimated' ? 'Nabız · tahmin' : 'Nabız'}
            value={preview?.avgHeartRate ? Math.round(preview.avgHeartRate).toString() : '—'}
          />
          <Stat label="Yoğunluk" value={`${Math.round((preview?.intensity ?? 0) * 100)}`} />
        </View>
        <View style={styles.intensity}>
          <View style={[styles.fill, { width: `${Math.round((preview?.intensity ?? 0) * 100)}%` }]} />
        </View>
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
      <View style={styles.chips}>
        <Pressable onPress={() => setEventId(null)} style={[styles.chip, eventId == null && styles.chipOn]}>
          <Text style={styles.chipText}>Serbest gece</Text>
        </Pressable>
        {events.map((event) => (
          <Pressable key={event.id} onPress={() => setEventId(event.id)} style={[styles.chip, eventId === event.id && styles.chipOn]}>
            <Text style={styles.chipText}>{event.title}</Text>
          </Pressable>
        ))}
      </View>
      <Field value={note} onChangeText={(value) => setNote(value.slice(0, 80))} placeholder="Gece notu, 80 karakter" />
      <View style={styles.shareRow}>
        <Text style={styles.meta}>Arkadaşların görsün</Text>
        <Switch value={shared} onValueChange={setShared} trackColor={{ true: colors.red, false: colors.border }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { color: colors.white, fontSize: 64, fontWeight: '700', letterSpacing: -1 },
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
