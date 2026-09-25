import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Button, Card, Screen } from '../components/ui';
import { formatWhen } from '../domain/format';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppState();
  const unread = notifications.some((item) => !item.read);
  return (
    <Screen>
      <Button label="Geri" kind="ghost" onPress={() => router.back()} />
      <Text style={styles.title}>Bildirimler</Text>
      {unread ? <Button label="Tümünü okundu say" kind="ghost" onPress={() => void markAllNotificationsRead()} /> : null}
      {notifications.length === 0 ? <Text style={styles.meta}>Bildirim yok.</Text> : null}
      {notifications.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            void markNotificationRead(item.id);
            if (item.href) router.push(item.href as '/');
          }}
        >
          <Card>
            <Text style={[styles.name, item.read && styles.read]}>{item.title}</Text>
            <Text style={styles.meta}>{item.body}</Text>
            <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontSize: 32, fontWeight: '700' },
  name: { color: colors.white, fontSize: 16, fontWeight: '700' },
  read: { color: colors.textSecondary },
  meta: { color: colors.textSecondary, fontSize: 14 },
});
