import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, Screen } from '../../components/ui';
import { eventPhase, formatWhen } from '../../domain/format';
import { compareLine, leaderboard, rankOf } from '../../domain/leaderboard';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { events, activities, users, profile, joinEvent } = useAppState();
  const event = events.find((item) => item.id === id);
  if (!event) {
    return (
      <Screen back={{ onPress: () => router.back() }}>
        <Text style={styles.title}>Etkinlik yok</Text>
      </Screen>
    );
  }
  const rows = leaderboard(activities, event.id, users);
  const joined = profile ? event.attendeeIds.includes(profile.id) : false;
  const place = profile ? rankOf(rows, profile.id) : null;
  const versus = profile ? compareLine(rows, profile.id) : null;
  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label={joined ? 'Katıldın' : 'Katıl'} kind="ghost" disabled={joined} onPress={() => void joinEvent(event.id)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Kaydı bağla" onPress={() => router.push({ pathname: '/(tabs)/record', params: { eventId: event.id } })} />
          </View>
        </View>
      }
    back={{ onPress: () => router.back() }}
    >
      <Text style={styles.phase}>{eventPhase(event.startsAt)}</Text>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>
        {event.venue}, {event.city}
      </Text>
      <Text style={styles.meta}>{formatWhen(event.startsAt)}</Text>
      <Text style={styles.meta}>{event.musicBpm ? `Etkinlik BPM ${event.musicBpm}` : 'BPM yok'}</Text>
      <Text style={styles.meta}>{event.attendeeIds.length} katılımcı</Text>
      {place ? <Text style={styles.meta}>Senin sıran {place.rank} / {place.total}</Text> : null}
      {versus ? <Text style={styles.meta}>{versus}</Text> : null}
      <Text style={styles.section}>Liderlik</Text>
      {rows.length === 0 ? (
        <Card>
          <Text style={styles.meta}>Bu gece için henüz skor yok.</Text>
        </Card>
      ) : (
        rows.map((row, index) => (
          <Pressable key={row.activity.id} onPress={() => router.push(`/session/${row.activity.id}`)}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.rank}>{index + 1}</Text>
                <Avatar label={row.user?.displayName ?? '?'} color={row.user?.avatarColor ?? colors.card} uri={row.user?.avatarUri} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{row.user?.displayName ?? 'Katılımcı'}</Text>
                  <Text style={styles.meta}>{row.activity.jumps} zıplama</Text>
                </View>
                <Text style={styles.score}>{row.activity.partyScore}</Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  phase: { color: colors.red, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 36, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 15 },
  section: { color: colors.white, fontSize: 18, fontWeight: '700', marginTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rank: { color: colors.textSecondary, width: 20 },
  name: { color: colors.white, fontSize: 16, fontWeight: '600' },
  score: { color: colors.red, fontSize: 24, fontWeight: '700' },
});
