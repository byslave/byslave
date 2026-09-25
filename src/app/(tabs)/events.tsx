import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card, Field, Screen, SectionTitle } from '../../components/ui';
import { eventPhase, formatWhen } from '../../domain/format';
import { useAppState } from '../../state/AppState';
import { colors } from '../../theme/tokens';

const phaseLabel = { live: 'Canlı', upcoming: 'Yakında', past: 'Geçmiş' };

export default function EventsScreen() {
  const router = useRouter();
  const { events } = useAppState();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const ordered = [...events]
    .filter((event) => {
      if (!needle) return true;
      return `${event.title} ${event.venue} ${event.city}`.toLocaleLowerCase('tr-TR').includes(needle);
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const venues = [...new Set(ordered.map((event) => `${event.venue}, ${event.city}`))];
  return (
    <Screen>
      <SectionTitle>Etkinlikler</SectionTitle>
      <Field value={query} onChangeText={setQuery} placeholder="Etkinlik veya mekân ara" />
      {ordered.length === 0 ? <Text style={styles.meta}>Bu aramada etkinlik yok.</Text> : null}
      {ordered.map((event) => {
        const phase = eventPhase(event.startsAt);
        return (
          <Pressable key={event.id} onPress={() => router.push(`/event/${event.id}`)}>
            <Card>
              <Text style={styles.phase}>{phaseLabel[phase]}</Text>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.meta}>
                {event.venue}, {event.city} · {formatWhen(event.startsAt)}
              </Text>
              <Text style={styles.meta}>
                {event.attendeeIds.length} katılımcı
                {event.musicBpm ? ` · ${event.musicBpm} BPM` : ''}
              </Text>
            </Card>
          </Pressable>
        );
      })}
      <SectionTitle>Mekânlar</SectionTitle>
      {venues.map((venue) => (
        <Card key={venue}>
          <Text style={styles.title}>{venue}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  phase: { color: colors.red, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
});
