import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { personById } from '@/src/data/demo';
import { toHref } from '@/src/lib/nav';
import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export default function MessagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAppStore((state) => state.user?.id);
  const requests = useAppStore((state) => state.messageRequests);
  const review = useAppStore((state) => state.reviewMessageRequest);

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('messages.title')}</AppText>
      <AppText variant="body">{t('messages.safety')}</AppText>
      {requests.length === 0 ? <AppText variant="muted">{t('messages.empty')}</AppText> : null}
      {requests.map((request) => {
        const incoming = request.recipientId === userId;
        const otherId = incoming ? request.senderId : request.recipientId;
        const person = personById(otherId);
        return (
          <Card key={request.id} style={styles.card}>
            <View style={styles.person}>
              <Avatar name={person?.name ?? otherId} portrait={person?.portrait} size={44} />
              <View style={styles.copy}>
                <AppText variant="bodyMedium">{person?.name ?? otherId}</AppText>
                <AppText variant="muted">{incoming ? t('messages.incoming') : t('messages.outgoing')}</AppText>
              </View>
              {request.sample ? <Badge label={t('common.sample')} tone="accent" /> : null}
              <Badge label={t(`messages.status.${request.status}`)} tone={request.status === 'accepted' ? 'success' : 'neutral'} />
            </View>
            {incoming && request.status === 'pending' ? (
              <View style={styles.actions}>
                <Button label={t('messages.accept')} onPress={() => review(request.id, 'accepted')} style={styles.action} />
                <Button label={t('messages.decline')} variant="secondary" onPress={() => review(request.id, 'declined')} style={styles.action} />
              </View>
            ) : null}
            {request.status === 'accepted' ? (
              <Button label={t('messages.open')} variant="secondary" onPress={() => router.push(toHref(`/messages/${request.id}`))} />
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 12 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
