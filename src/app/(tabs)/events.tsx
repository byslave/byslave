import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card, Field, Screen, SectionTitle } from '../../components/ui';
import { averageMusicBpm, eventPulse, similarByBpm } from '../../domain/discover';
import { eventPhase, formatWhen } from '../../domain/format';
import { useAppState } from '../../state/AppState';
import { colors } from '../../theme/tokens';

const phaseLabel = { live: 'Canlı', upcoming: 'Yakında', past: 'Geçmiş' };

export default function EventsScreen() {
  const router = useRouter();
  const { events, activities, profile } = useAppState();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const ordered = [...events]
    .filter((event) => {
      if (!needle) return true;
      return `${event.title} ${event.venue} ${event.city} ${event.lineup ?? ''}`.toLocaleLowerCase('tr-TR').includes(needle);
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const venues = [...new Set(ordered.map((event) => event.venue))];
  const similar = similarByBpm(ordered, profile ? averageMusicBpm(activities, profile.id) : null);
  return (
    <Screen>
      <SectionTitle>Etkinlikler</SectionTitle>
      <Field value={query} onChangeText={setQuery} placeholder="Etkinlik veya mekân ara" />
      {ordered.length === 0 ? <Text style={styles.meta}>Bu aramada etkinlik yok.</Text> : null}
      {ordered.map((event) => {
        const phase = eventPhase(event.startsAt);
        const pulse = eventPulse(event, activities);
        return (
          <Pressable key={event.id} onPress={() => router.push(`/event/${event.id}`)}>
            <Card>
              <Text style={styles.phase}>{phaseLabel[phase]}</Text>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.meta}>
                {event.venue}, {event.city} · {formatWhen(event.startsAt)}
              </Text>
              {event.lineup ? <Text style={styles.meta}>{event.lineup}</Text> : null}
              <Text style={styles.meta}>
                {pulse.attendees} katılımcı
                {pulse.avgBpm ? ` · ${pulse.avgBpm} BPM` : ''}
                {pulse.avgScore != null ? ` · ort. ${pulse.avgScore}` : ''}
                {pulse.topRespects ? ` · en çok saygı ${pulse.topRespects}` : ''}
              </Text>
            </Card>
          </Pressable>
        );
      })}
      {similar.length > 0 ? (
        <>
          <SectionTitle>Sana yakın BPM</SectionTitle>
          {similar.map((event) => (
            <Pressable key={`sim-${event.id}`} onPress={() => router.push(`/event/${event.id}`)}>
              <Card>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.meta}>{event.musicBpm} BPM · {event.venue}</Text>
              </Card>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          <SectionTitle>Sana yakın BPM</SectionTitle>
          <Text style={styles.meta}>Kayıtların biriktikçe yakın BPM’li etkinlikler burada durur.</Text>
        </>
      )}
      <SectionTitle>Mekânlar</SectionTitle>
      {venues.map((venue) => {
        const nights = activities.filter((item) => item.shared && item.venue === venue);
        const latest = ordered.filter((event) => event.venue === venue).at(-1);
        const avg = nights.length ? Math.round(nights.reduce((sum, item) => sum + item.partyScore, 0) / nights.length) : null;
        return (
          <Pressable key={venue} onPress={() => latest && router.push(`/event/${latest.id}`)}>
            <Card>
              <Text style={styles.title}>{venue}</Text>
              <Text style={styles.meta}>{nights.length} gece{avg != null ? ` · ort. skor ${avg}` : ''}</Text>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  phase: { color: colors.red, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
});
