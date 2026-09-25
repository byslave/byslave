import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card, Screen, SectionTitle } from '../../components/ui';
import { formatCalories, formatDuration, formatWhen } from '../../domain/format';
import { useAppState } from '../../state/AppState';
import { colors } from '../../theme/tokens';

export default function ActivityScreen() {
  const router = useRouter();
  const { profile, activities } = useAppState();
  const mine = activities
    .filter((item) => item.userId === profile?.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return (
    <Screen>
      <SectionTitle>Geçmiş</SectionTitle>
      {mine.length === 0 ? (
        <Card>
          <Text style={styles.title}>Kayıt yok</Text>
          <Text style={styles.meta}>Bitirdiğin geceler burada durur.</Text>
        </Card>
      ) : (
        mine.map((activity) => (
          <Pressable key={activity.id} onPress={() => router.push(`/session/${activity.id}`)}>
            <Card>
              <Text style={styles.score}>{activity.partyScore}</Text>
              <Text style={styles.title}>{activity.title}</Text>
              <Text style={styles.meta}>
                {formatWhen(activity.startedAt)} · {formatDuration(activity.activeSeconds)} · {formatCalories(activity.calories)} kcal · {activity.jumps} zıplama
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { color: colors.red, fontSize: 28, fontWeight: '700' },
  title: { color: colors.white, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
});
