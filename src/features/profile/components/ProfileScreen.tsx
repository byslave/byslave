import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { StatBlock } from '@/src/components/ui/StatBlock';
import { stripPhotoFile } from '@/src/features/photos/stripExif';
import { persistPrivacy } from '@/src/features/profile/savePrivacy';
import { visiblePrivacy } from '@/src/features/profile/privacy';
import type { Genre } from '@/src/data/demo';
import { sampleNight } from '@/src/data/demo';
import { formatNumber } from '@/src/lib/format';
import { toHref } from '@/src/lib/nav';
import { shareText } from '@/src/lib/shareText';
import { isSupabaseConfigured } from '@/src/lib/supabase/client';
import { useAppStore, useAttendanceStore, type ConsentKind, type PrivacyMode } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii, tabClearance } from '@/src/theme/tokens';

const genreOrder: Genre[] = ['techno', 'house', 'electro', 'trance', 'dnb', 'hiphop', 'pop'];
const privacyModes: PrivacyMode[] = ['friends', 'public', 'ghost'];
const consentKinds: ConsentKind[] = ['location', 'motion', 'photos'];

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const privacy = useAppStore((state) => state.privacy);
  const privacyOnServer = useAppStore((state) => state.privacyOnServer);
  const user = useAppStore((state) => state.user);
  const genres = useAppStore((state) => state.genres);
  const language = useAppStore((state) => state.language);
  const posts = useAppStore((state) => state.posts);
  const reports = useAppStore((state) => state.reports);
  const consents = useAppStore((state) => state.consents);
  const friendIds = useAppStore((state) => state.friendIds);
  const blockedIds = useAppStore((state) => state.blockedIds);
  const finishedNights = useAppStore((state) => state.finishedNights);
  const customVenues = useAppStore((state) => state.customVenues);
  const displayName = useAppStore((state) => state.displayName);
  const username = useAppStore((state) => state.username);
  const bio = useAppStore((state) => state.bio);
  const avatarDataUrl = useAppStore((state) => state.avatarDataUrl);
  const setPrivacy = useAppStore((state) => state.setPrivacy);
  const toggleGenre = useAppStore((state) => state.toggleGenre);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setConsent = useAppStore((state) => state.setConsent);
  const setAvatar = useAppStore((state) => state.setAvatar);
  const signOut = useAppStore((state) => state.signOut);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const attendance = useAttendanceStore((state) => state.byEvent);
  const resetAttendance = useAttendanceStore((state) => state.reset);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const goingCount = Object.values(attendance).filter((status) => status === 'going' || status === 'checked_in').length;
  const shownPrivacy = visiblePrivacy({
    privacy,
    privacyOnServer,
    userId: user?.id ?? null,
    serverConfigured: isSupabaseConfigured,
  });
  const name = displayName || t('profile.name');
  const handle = username ? `@${username.replace(/^@/, '')}` : t('profile.username');

  async function exportData() {
    const payload = {
      profile: { name: displayName, username, bio },
      privacy,
      genres,
      language,
      attendance,
      posts,
      reports,
      consents,
      friendIds,
      blockedIds,
      finishedNights,
      customVenues,
    };
    const text = JSON.stringify(payload, null, 2);
    if (typeof document !== 'undefined') {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pulse-verilerim.json';
      link.click();
      URL.revokeObjectURL(url);
      showToast(t('profile.exportDone'));
      return;
    }
    await shareText(text);
    showToast(t('profile.exportDone'));
  }

  function choosePhoto() {
    if (typeof document === 'undefined') {
      showToast(t('profile.photoNative'));
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void stripPhotoFile(file)
        .then((url) => {
          setConsent('photos', true);
          setAvatar(url);
          showToast(t('profile.photoReady'));
        })
        .catch(() => showToast(t('profile.photoFailed')));
    };
    input.click();
  }

  const links = [
    [t('profile.edit'), '/setup'],
    [t('profile.notifications'), '/notifications'],
    [t('profile.friendsLink'), '/friends'],
    [t('profile.help'), '/help'],
    [t('help.notice'), '/legal/notice'],
    [t('help.privacy'), '/legal/privacy'],
    [t('help.terms'), '/legal/terms'],
    [t('help.consent'), '/legal/consent'],
  ] as const;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: tabClearance + 24, gap: 16 }}
    >
      <OfflineBanner />
      <View style={styles.identity}>
        <Avatar name={name} imageUri={avatarDataUrl} size={72} />
        <View style={styles.identityText}>
          <AppText variant="heading">{name}</AppText>
          <AppText variant="muted">{handle}</AppText>
        </View>
      </View>
      <AppText variant="body">{bio || t('profile.bio')}</AppText>
      <Button label={t('profile.photo')} variant="secondary" onPress={choosePhoto} />
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
      {links.map(([label, href]) => (
        <Pressable key={href} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(toHref(href))} style={styles.link}>
          <AppText variant="bodyMedium">{label}</AppText>
        </Pressable>
      ))}
      <AppText variant="label">{t('profile.genres')}</AppText>
      <View style={styles.wrap}>
        {genreOrder.map((genre) => (
          <Chip key={genre} label={t(`genres.${genre}`)} selected={genres.includes(genre)} onPress={() => toggleGenre(genre)} />
        ))}
      </View>
      <AppText variant="label">{t('profile.privacy')}</AppText>
      <View style={styles.wrap}>
        {privacyModes.map((mode) => (
          <Chip
            key={mode}
            label={t(`profile.${mode}`)}
            selected={privacy === mode}
            onPress={() => {
              setPrivacy(mode);
              void persistPrivacy(mode);
            }}
          />
        ))}
      </View>
      <AppText variant="muted">{t('profile.privacyHint')}</AppText>
      {shownPrivacy === 'ghost' && privacy !== 'ghost' ? <AppText variant="muted">{t('profile.privacyPending')}</AppText> : null}
      <AppText variant="label">{t('profile.consents')}</AppText>
      {consentKinds.map((kind) => {
        const granted = consents[kind]?.granted === true;
        const label =
          kind === 'location' ? t('profile.consentLocation') : kind === 'motion' ? t('profile.consentMotion') : t('profile.consentPhotos');
        return <Chip key={kind} label={label} selected={granted} onPress={() => setConsent(kind, !granted)} />;
      })}
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
      <View style={styles.danger}>
        <AppText variant="label">{t('profile.danger')}</AppText>
        <AppText variant="body">{t('profile.deleteBody')}</AppText>
        {confirmDelete ? (
          <TextInput
            value={deleteText}
            onChangeText={setDeleteText}
            autoCapitalize="characters"
            accessibilityLabel={t('profile.deleteWord')}
            placeholder={t('profile.deleteWord')}
            placeholderTextColor={colors.textFaint}
            style={styles.deleteInput}
          />
        ) : null}
        <Button
          label={t('profile.delete')}
          variant="danger"
          onPress={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            if (deleteText.trim() !== t('profile.deleteWord')) {
              showToast(t('profile.deleteMismatch'));
              return;
            }
            resetAttendance();
            deleteAccount();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  identityText: { gap: 4, flex: 1 },
  stats: { flexDirection: 'row', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  link: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  danger: { gap: 12, marginTop: 12, padding: 16, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.danger },
  deleteInput: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    color: colors.text,
    fontFamily: fonts.body,
    paddingHorizontal: 12,
  },
});
