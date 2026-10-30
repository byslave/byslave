import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { stripPhotoFile } from '@/src/features/photos/stripExif';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

const usernamePattern = /^[a-z0-9_]{3,20}$/i;

export default function SetupScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);
  const currentName = useAppStore((state) => state.displayName);
  const currentUser = useAppStore((state) => state.username);
  const currentBio = useAppStore((state) => state.bio);
  const avatarDataUrl = useAppStore((state) => state.avatarDataUrl);
  const finishSetup = useAppStore((state) => state.finishSetup);
  const [name, setName] = useState(currentName);
  const [username, setUsername] = useState(currentUser);
  const [bio, setBio] = useState(currentBio);
  const [photo, setPhoto] = useState<string | null>(avatarDataUrl);
  const [error, setError] = useState<string | null>(null);

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
          useAppStore.getState().setConsent('photos', true);
          setPhoto(url);
        })
        .catch(() => showToast(t('profile.photoFailed')));
    };
    input.click();
  }

  function save() {
    if (!usernamePattern.test(username.trim())) {
      setError(t('setup.usernameInvalid'));
      return;
    }
    finishSetup({
      displayName: name.trim() || username.trim(),
      username: username.trim().replace(/^@/, ''),
      bio: bio.trim(),
      avatarDataUrl: photo,
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <AppText variant="display">{t('setup.title')}</AppText>
      <AppText variant="body">{t('setup.body')}</AppText>
      <Avatar name={name || username || 'P'} imageUri={photo} size={72} />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('setup.name')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('setup.name')}
        style={styles.input}
      />
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder={t('setup.usernamePh')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('setup.username')}
        style={styles.input}
      />
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder={t('profile.bioPlaceholder')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('profile.bioPlaceholder')}
        style={[styles.input, styles.bio]}
        multiline
      />
      {error ? <AppText variant="muted">{error}</AppText> : null}
      <Button label={t('setup.photo')} variant="secondary" onPress={choosePhoto} />
      <View style={styles.spacer} />
      <Button label={t('setup.done')} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 12 },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  bio: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  spacer: { flex: 1 },
});
