import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

export default function OrganizerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const organizer = useAppStore((state) => state.organizer);
  const submitOrganizer = useAppStore((state) => state.submitOrganizer);
  const showToast = useToastStore((state) => state.show);
  const [businessName, setBusinessName] = useState(organizer?.businessName ?? '');
  const [venueName, setVenueName] = useState(organizer?.venueName ?? '');
  const [email, setEmail] = useState(organizer?.email ?? '');
  const [link, setLink] = useState(organizer?.link ?? '');
  const [taxId, setTaxId] = useState(organizer?.taxId ?? '');
  const [documentName, setDocumentName] = useState(organizer?.documentName ?? '');

  function pickDocument() {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setDocumentName(file.name);
      showToast(t('verify.documentReady'));
    };
    input.click();
  }

  function save() {
    if (!businessName.trim() || !venueName.trim() || !email.includes('@') || !link.trim()) return;
    submitOrganizer({
      businessName: businessName.trim(),
      venueName: venueName.trim(),
      email: email.trim(),
      link: link.trim(),
      taxId: taxId.trim(),
      documentName: documentName.trim(),
    });
    showToast(t('verify.pending'));
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('verify.organizerTitle')}</AppText>
      <AppText variant="body">{t('verify.organizerBody')}</AppText>
      {organizer ? <Badge label={t(`verify.${organizer.status}`)} tone={organizer.status === 'approved' ? 'success' : 'accent'} /> : null}
      <Field label={t('verify.business')} value={businessName} onChange={setBusinessName} />
      <Field label={t('verify.venue')} value={venueName} onChange={setVenueName} />
      <Field label={t('verify.contactEmail')} value={email} onChange={setEmail} />
      <Field label={t('verify.social')} value={link} onChange={setLink} />
      <Field label={t('verify.tax')} value={taxId} onChange={setTaxId} />
      <Button label={t('verify.document')} variant="secondary" onPress={pickDocument} />
      {documentName ? <AppText variant="muted">{documentName}</AppText> : null}
      <Button label={t('common.save')} onPress={save} disabled={organizer?.status === 'pending' || organizer?.status === 'approved'} />
    </ScrollView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput value={value} onChangeText={onChange} placeholder={label} placeholderTextColor={colors.textFaint} style={styles.input} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 6 },
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
