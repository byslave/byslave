import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { StatBlock } from '@/src/components/ui/StatBlock';
import type { Genre } from '@/src/data/demo';
import { sampleNight } from '@/src/data/demo';
import { formatNumber } from '@/src/lib/format';
import { shareText } from '@/src/lib/shareText';
import { isSupabaseConfigured } from '@/src/lib/supabase/client';
import { useAppStore, useAttendanceStore, type PrivacyMode } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, tabClearance } from '@/src/theme/tokens';

const genreOrder: Genre[] = ['techno', 'house', 'electro', 'trance', 'dnb', 'hiphop', 'pop'];
const privacyModes: PrivacyMode[] = ['public', 'friends', 'ghost'];

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const privacy = useAppStore((state) => state.privacy);
  const genres = useAppStore((state) => state.genres);
  const language = useAppStore((state) => state.language);
  const user = useAppStore((state) => state.user);
  const posts = useAppStore((state) => state.posts);
  const reports = useAppStore((state) => state.reports);
  const setPrivacy = useAppStore((state) => state.setPrivacy);
  const toggleGenre = useAppStore((state) => state.toggleGenre);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const signOut = useAppStore((state) => state.signOut);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const attendance = useAttendanceStore((state) => state.byEvent);
  const resetAttendance = useAttendanceStore((state) => state.reset);
  const goingCount = Object.values(attendance).filter((status) => status === 'going' || status === 'checked_in').length;

  async function exportData() {
    const payload = {
      user,
      privacy,
      genres,
      language,
      attendance,
      posts,
      reports,
      supabase: isSupabaseConfigured,
    };
    await shareText(JSON.stringify(payload, null, 2));
    showToast(t('profile.exportDone'));
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: tabClearance + 24, gap: 16 }}
    >
      <View style={styles.identity}>
        <Avatar name={t('profile.name')} size={72} />
        <View style={styles.identityText}>
          <AppText variant="heading">{t('profile.name')}</AppText>
          <AppText variant="muted">{t('profile.username')}</AppText>
          <Badge label={t('profile.demo')} />
        </View>
      </View>
      <AppText variant="body">{t('profile.bio')}</AppText>
      <Card>
        <View style={styles.stats}>
          <StatBlock label={t('profile.goingStat')} value={formatNumber(goingCount, i18n.language)} />
          <StatBlock
            label={t('profile.sampleStat')}
            value={t('night.durationValue', {
              hours: Math.floor(sampleNight.minutes / 60),
              minutes: sampleNight.minutes % 60,
            })}
          />
        </View>
      </Card>
      <AppText variant="label">{t('profile.genres')}</AppText>
      <View style={styles.wrap}>
        {genreOrder.map((genre) => (
          <Chip key={genre} label={t(`genres.${genre}`)} selected={genres.includes(genre)} onPress={() => toggleGenre(genre)} />
        ))}
      </View>
      <AppText variant="label">{t('profile.privacy')}</AppText>
      <View style={styles.wrap}>
        {privacyModes.map((mode) => (
          <Chip key={mode} label={t(`profile.${mode}`)} selected={privacy === mode} onPress={() => setPrivacy(mode)} />
        ))}
      </View>
      <AppText variant="muted">{t('profile.privacyHint')}</AppText>
      <AppText variant="label">{t('profile.language')}</AppText>
      <View style={styles.wrap}>
        <Chip label="Türkçe" selected={language === 'tr'} onPress={() => setLanguage('tr')} />
        <Chip label="English" selected={language === 'en'} onPress={() => setLanguage('en')} />
      </View>
      <Button label={t('profile.export')} variant="secondary" onPress={() => void exportData()} />
      {__DEV__ ? <Button label={t('profile.gallery')} variant="ghost" onPress={() => router.push('/dev/ui')} /> : null}
      <Button
        label={t('profile.signOut')}
        variant="secondary"
        onPress={() =>
          Alert.alert(t('profile.signOutTitle'), t('profile.signOutBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('profile.signOut'), onPress: () => signOut() },
          ])
        }
      />
      <Button
        label={t('profile.delete')}
        variant="ghost"
        onPress={() =>
          Alert.alert(t('profile.deleteTitle'), t('profile.deleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () => {
                resetAttendance();
                deleteAccount();
              },
            },
          ])
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  identityText: { gap: 4, flex: 1 },
  stats: { flexDirection: 'row', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
