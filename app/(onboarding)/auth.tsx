import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { sendMagicLink } from '@/src/lib/supabase/client';
import { useAppStore } from '@/src/stores/appStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

const emailSchema = z.string().trim().email();

export default function AuthScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const birthDate = useAppStore((state) => state.birthDate);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function enterDemo() {
    completeOnboarding({
      birthDate: birthDate ?? '2000-01-01',
      user: { id: 'demo-user', email: emailSchema.safeParse(email).success ? email.trim() : 'demo@pulse.app' },
    });
  }

  async function sendLink() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setMessage(t('onboarding.emailInvalid'));
      return;
    }
    const result = await sendMagicLink(parsed.data);
    if (result === 'sent') setMessage(t('onboarding.magicSent'));
    else if (result === 'demo') setMessage(t('onboarding.magicMissing'));
    else setMessage(t('onboarding.magicError'));
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <AppText variant="display">{t('onboarding.authTitle')}</AppText>
      <AppText variant="body">{t('onboarding.authBody')}</AppText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder={t('onboarding.email')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('onboarding.email')}
        style={styles.input}
      />
      {message ? <AppText variant="muted">{message}</AppText> : null}
      <Button label={t('onboarding.magic')} variant="secondary" onPress={() => void sendLink()} />
      <Button label={t('onboarding.demo')} onPress={enterDemo} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 16 },
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
});
