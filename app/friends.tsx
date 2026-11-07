import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { SafetySheet } from '@/src/components/SafetySheet';
import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { people } from '@/src/data/demo';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

export default function FriendsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<string | null>(null);
  const friendIds = useAppStore((state) => state.friendIds);
  const blockedIds = useAppStore((state) => state.blockedIds);
  const addFriend = useAppStore((state) => state.addFriend);
  const removeFriend = useAppStore((state) => state.removeFriend);
  const blockPerson = useAppStore((state) => state.blockPerson);
  const unblockPerson = useAppStore((state) => state.unblockPerson);
  const addReport = useAppStore((state) => state.addReport);
  const showToast = useToastStore((state) => state.show);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(i18n.language);
    return people.filter((person) => !needle || person.name.toLocaleLowerCase(i18n.language).includes(needle));
  }, [i18n.language, query]);

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('notes.friendsTitle')}</AppText>
      <Badge label={t('notes.sample')} tone="accent" />
      <AppText variant="body">{t('notes.body')}</AppText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('notes.search')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('notes.search')}
        style={styles.input}
      />
      {matches.length === 0 ? <AppText variant="muted">{t('notes.empty')}</AppText> : null}
      {matches.map((person) => {
        const added = friendIds.includes(person.id);
        const blocked = blockedIds.includes(person.id);
        return (
          <View key={person.id} style={styles.row}>
            <Avatar name={person.name} portrait={person.portrait} size={44} />
            <AppText variant="bodyMedium" style={styles.name}>
              {person.name}
            </AppText>
            <Button
              label={blocked ? t('event.blocked') : added ? t('notes.added') : t('notes.add')}
              variant="secondary"
              disabled={blocked}
              onPress={() => (added ? removeFriend(person.id) : addFriend(person.id))}
              style={styles.action}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.report')} onPress={() => setTarget(person.id)} style={styles.more}>
              <AppText variant="muted">{t('common.report')}</AppText>
            </Pressable>
          </View>
        );
      })}
      <AppText variant="label">{t('notes.yourFriends')}</AppText>
      {friendIds.length === 0 ? <AppText variant="muted">{t('notes.noneYet')}</AppText> : null}
      <SafetySheet
        visible={target !== null}
        blocked={target ? blockedIds.includes(target) : false}
        onClose={() => setTarget(null)}
        onReport={(reason) => {
          if (!target) return;
          addReport({ target: 'person', targetId: target, reason });
          setTarget(null);
          showToast(t('event.reportSaved'));
        }}
        onBlock={() => {
          if (!target) return;
          if (blockedIds.includes(target)) unblockPerson(target);
          else blockPerson(target);
          setTarget(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fonts.body,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1 },
  action: { minWidth: 96 },
  more: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
