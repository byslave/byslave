import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { venueById } from '@/src/data/demo';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

export default function ClaimScreen() {
  const { venue } = useLocalSearchParams<{ venue?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customVenues = useAppStore((state) => state.customVenues);
  const claims = useAppStore((state) => state.venueClaims);
  const submitVenueClaim = useAppStore((state) => state.submitVenueClaim);
  const showToast = useToastStore((state) => state.show);
  const venueId = typeof venue === 'string' ? venue : '';
  const place = venueById(venueId) ?? customVenues.find((item) => item.id === venueId);
  const pending = claims.some((claim) => claim.venueId === venueId && claim.status === 'pending');
  const [contact, setContact] = useState('');

  function save() {
    if (!venueId || contact.trim().length < 3) return;
    submitVenueClaim({ venueId, contact: contact.trim() });
    showToast(t('verify.claimSaved'));
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('verify.claimTitle')}</AppText>
      <AppText variant="body">{t('verify.claimBody')}</AppText>
      <AppText variant="heading">{place?.name ?? venueId}</AppText>
      {pending ? <AppText variant="muted">{t('venue.claimed')}</AppText> : null}
      <AppText variant="label">{t('verify.claimContact')}</AppText>
      <TextInput
        value={contact}
        onChangeText={setContact}
        placeholder={t('verify.contactEmail')}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        accessibilityLabel={t('verify.claimContact')}
        style={styles.input}
      />
      <Button label={t('common.save')} onPress={save} disabled={pending || !place} />
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
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
  },
});
