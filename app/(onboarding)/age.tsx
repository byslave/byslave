import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { isAtLeastAge, isRealDate, toISODate } from '@/src/features/profile/age';
import { useAppStore } from '@/src/stores/appStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

export default function AgeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setBirthDate = useAppStore((state) => state.setBirthDate);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = { day: Number(day), month: Number(month), year: Number(year) };
    if (!isRealDate(parsed.year, parsed.month, parsed.day)) {
      setError(t('onboarding.ageInvalid'));
      return;
    }
    if (!isAtLeastAge(parsed.year, parsed.month, parsed.day, new Date(), 18)) {
      setError(t('onboarding.ageError'));
      return;
    }
    setBirthDate(toISODate(parsed.year, parsed.month, parsed.day));
    router.push('/(onboarding)/permissions');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <AppText variant="display">{t('onboarding.ageTitle')}</AppText>
      <AppText variant="body">{t('onboarding.ageBody')}</AppText>
      <View style={styles.row}>
        <Field label={t('onboarding.day')} value={day} onChange={setDay} maxLength={2} />
        <Field label={t('onboarding.month')} value={month} onChange={setMonth} maxLength={2} />
        <Field label={t('onboarding.year')} value={year} onChange={setYear} maxLength={4} />
      </View>
      {error ? <AppText variant="muted">{error}</AppText> : null}
      <View style={styles.spacer} />
      <Button label={t('common.continue')} onPress={submit} />
    </View>
  );
}

function Field({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (value: string) => void; maxLength: number }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={maxLength}
        accessibilityLabel={label}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 16 },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 8 },
  input: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textAlign: 'center',
    backgroundColor: colors.surface,
  },
  spacer: { flex: 1 },
});
