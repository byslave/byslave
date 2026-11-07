import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ErrorState } from '@/src/components/ui/States';
import { personById } from '@/src/data/demo';
import { useAppStore } from '@/src/stores/appStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');
  const userId = useAppStore((state) => state.user?.id);
  const request = useAppStore((state) => state.messageRequests.find((item) => item.id === id));
  const chatMessages = useAppStore((state) => state.chatMessages);
  const messages = useMemo(() => chatMessages.filter((item) => item.requestId === id).reverse(), [chatMessages, id]);
  const send = useAppStore((state) => state.sendChatMessage);

  if (!request || request.status !== 'accepted' || !userId) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState title={t('messages.unavailable')} body={t('messages.unavailableBody')} actionLabel={t('common.back')} onAction={() => router.back()} />
      </View>
    );
  }

  const otherId = request.senderId === userId ? request.recipientId : request.senderId;
  const person = personById(otherId);
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="heading">{person?.name ?? otherId}</AppText>
          <AppText variant="muted">{t('messages.sharedEvent')}</AppText>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.thread}>
        {messages.length === 0 ? <AppText variant="muted">{t('messages.start')}</AppText> : null}
        {messages.map((message) => (
          <Card key={message.id} style={message.senderId === userId ? styles.mine : styles.theirs}>
            <AppText variant="body">{message.body}</AppText>
          </Card>
        ))}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('messages.placeholder')}
          placeholderTextColor={colors.textFaint}
          maxLength={1000}
          style={styles.input}
        />
        <Button
          label={t('messages.send')}
          disabled={!body.trim()}
          onPress={() => {
            if (send(request.id, body)) setBody('');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerCopy: { flex: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  thread: { flexGrow: 1, gap: 8, paddingVertical: 16 },
  mine: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: colors.surface2 },
  theirs: { alignSelf: 'flex-start', maxWidth: '82%' },
  composer: { gap: 8 },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    backgroundColor: colors.surface,
    fontFamily: fonts.body,
    paddingHorizontal: 14,
  },
});
