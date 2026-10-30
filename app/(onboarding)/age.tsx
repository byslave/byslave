import { useRef, useState, type RefObject } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { StepHeader } from '@/src/features/onboarding/StepHeader';
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
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

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
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <StepHeader step={2} onBack={() => router.back()} />
      <AppText variant="display">{t('onboarding.ageTitle')}</AppText>
      <AppText variant="body">{t('onboarding.ageBody')}</AppText>
      <View style={styles.row}>
        <Field
          label={t('onboarding.day')}
          placeholder={t('onboarding.dayPh')}
          value={day}
          maxLength={2}
          onChange={(value) => {
            setDay(value);
            if (value.length === 2) monthRef.current?.focus();
          }}
        />
        <Field
          label={t('onboarding.month')}
          placeholder={t('onboarding.monthPh')}
          value={month}
          maxLength={2}
          inputRef={monthRef}
          onChange={(value) => {
            setMonth(value);
            if (value.length === 2) yearRef.current?.focus();
          }}
        />
        <Field
          label={t('onboarding.year')}
          placeholder={t('onboarding.yearPh')}
          value={year}
          maxLength={4}
          inputRef={yearRef}
          onChange={setYear}
        />
      </View>
      {error ? (
        <AppText variant="muted" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <View style={styles.spacer} />
      <Button label={t('common.continue')} onPress={submit} />
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
  inputRef,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  inputRef?: RefObject<TextInput | null>;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
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
