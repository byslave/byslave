import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { StepHeader } from '@/src/features/onboarding/StepHeader';
import { toHref } from '@/src/lib/nav';
import { sendMagicLink, signInWithProvider } from '@/src/lib/supabase/client';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

const emailSchema = z.string().trim().email();

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const birthDate = useAppStore((state) => state.birthDate);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const showToast = useToastStore((state) => state.show);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  function lookAround() {
    const parsed = emailSchema.safeParse(email);
    completeOnboarding({
      birthDate: birthDate ?? '2000-01-01',
      user: { id: `local-${Date.now()}`, email: parsed.success ? parsed.data : '' },
    });
  }

  async function sendLink() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setSentTo(null);
      setMessage(t('onboarding.emailInvalid'));
      return;
    }
    const result = await sendMagicLink(parsed.data);
    if (result === 'sent') {
      setMessage(null);
      setSentTo(parsed.data);
      setSeconds(60);
      return;
    }
    setSentTo(null);
    setMessage(result === 'demo' ? t('onboarding.magicMissing') : t('onboarding.magicError'));
  }

  async function provider(kind: 'google' | 'apple') {
    const result = await signInWithProvider(kind);
    if (result !== 'started') showToast(t('onboarding.oauthUnavailable'));
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <StepHeader step={4} onBack={() => router.back()} />
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
      {sentTo ? <AppText variant="body">{t('onboarding.magicSent', { email: sentTo })}</AppText> : null}
      {message ? (
        <AppText variant="muted" accessibilityRole="alert">
          {message}
        </AppText>
      ) : null}
      <Button
        label={sentTo ? (seconds > 0 ? t('onboarding.resendWait', { seconds }) : t('onboarding.resend')) : t('onboarding.magic')}
        disabled={seconds > 0}
        onPress={() => void sendLink()}
      />
      <Button label={t('onboarding.oauthGoogle')} variant="secondary" onPress={() => void provider('google')} />
      <Button label={t('onboarding.oauthApple')} variant="secondary" onPress={() => void provider('apple')} />
      <Button label={t('onboarding.browse')} variant="ghost" onPress={lookAround} />
      <AppText variant="muted">
        {t('onboarding.legalLead')}
        <Text style={styles.link} accessibilityRole="link" onPress={() => router.push(toHref('/legal/terms'))}>
          {t('onboarding.termsLink')}
        </Text>
        {t('onboarding.legalMid')}
        <Text style={styles.link} accessibilityRole="link" onPress={() => router.push(toHref('/legal/privacy'))}>
          {t('onboarding.privacyLink')}
        </Text>
        {t('onboarding.legalEnd')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 14 },
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
  link: { color: colors.accent, fontFamily: fonts.bodyMedium, textDecorationLine: 'underline' },
});
