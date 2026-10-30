import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { EmptyState } from '@/src/components/ui/States';
import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notifyFriends = useAppStore((state) => state.notifyFriends);
  const notifyEvents = useAppStore((state) => state.notifyEvents);
  const notifyWaves = useAppStore((state) => state.notifyWaves);
  const setNotify = useAppStore((state) => state.setNotify);

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('inbox.title')}</AppText>
      <AppText variant="label">{t('inbox.settings')}</AppText>
      <View style={styles.wrap}>
        <Chip label={t('inbox.friends')} selected={notifyFriends} onPress={() => setNotify('notifyFriends', !notifyFriends)} />
        <Chip label={t('inbox.events')} selected={notifyEvents} onPress={() => setNotify('notifyEvents', !notifyEvents)} />
        <Chip label={t('inbox.waves')} selected={notifyWaves} onPress={() => setNotify('notifyWaves', !notifyWaves)} />
      </View>
      <EmptyState title={t('inbox.emptyTitle')} body={t('inbox.emptyBody')} />
      <Badge label={t('inbox.sample')} tone="accent" />
      <Card style={styles.card}>
        <AppText variant="body">{t('inbox.sampleFriend')}</AppText>
      </Card>
      <Card style={styles.card}>
        <AppText variant="body">{t('inbox.sampleEvent')}</AppText>
      </Card>
      <Card style={styles.card}>
        <AppText variant="body">{t('inbox.sampleWave')}</AppText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  wrap: { gap: 8 },
  card: { gap: 6 },
});
