import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card, Screen, SectionTitle } from '../../components/ui';
import { eventPhase, formatWhen } from '../../domain/format';
import { useAppState } from '../../state/AppState';
import { colors } from '../../theme/tokens';

const phaseLabel = { live: 'Canlı', upcoming: 'Yakında', past: 'Geçmiş' };

export default function EventsScreen() {
  const router = useRouter();
  const { events } = useAppState();
  const ordered = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <Screen>
      <SectionTitle>Etkinlikler</SectionTitle>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  phase: { color: colors.red, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
});
