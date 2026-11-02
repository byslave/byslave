import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { assembleEvents } from '@/src/features/events/catalog';
import { showAdminTools } from '@/src/features/events/adminGate';
import { formatIstanbul } from '@/src/features/events/time';
import { useAppStore } from '@/src/stores/appStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

export default function AdminScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((state) => state.user);
  const localEvents = useAppStore((state) => state.localEvents);
  const overrides = useAppStore((state) => state.eventOverrides);
  const organizer = useAppStore((state) => state.organizer);
  const claims = useAppStore((state) => state.venueClaims);
  const log = useAppStore((state) => state.moderationLog);
  const moderateEvent = useAppStore((state) => state.moderateEvent);
  const reviewOrganizer = useAppStore((state) => state.reviewOrganizer);
  const reviewVenueClaim = useAppStore((state) => state.reviewVenueClaim);
  const [reason, setReason] = useState('');
  const actorId = user?.id ?? 'local-admin';
  const open = showAdminTools();
  const events = assembleEvents(localEvents, overrides);
  const waiting = events.filter((event) => event.verificationStatus === 'pending' || event.held);
  const reported = events.filter((event) => event.reporters.length > 0);

  if (!open) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>
        <AppText variant="heading">{t('verify.adminTitle')}</AppText>
        <AppText variant="body">{t('verify.adminEmpty')}</AppText>
      </View>
    );
  }

  function act(eventId: string, action: 'approve' | 'reject' | 'hide') {
    if (!reason.trim()) return;
    moderateEvent({ eventId, actorId, action, reason: reason.trim() });
    setReason('');
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('verify.adminTitle')}</AppText>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder={t('verify.reasonPh')}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t('verify.reasonPh')}
        style={styles.input}
      />
      <AppText variant="label">{t('verify.adminEvents')}</AppText>
      {waiting.length === 0 ? <AppText variant="muted">{t('verify.adminEmpty')}</AppText> : null}
      {waiting.map((event) => (
        <Card key={event.id} style={styles.card}>
          <AppText variant="heading">{event.title}</AppText>
          <AppText variant="muted">
            {event.verificationStatus} · {formatIstanbul(new Date(event.startAt), i18n.language)}
          </AppText>
          <View style={styles.row}>
            <Button label={t('verify.approve')} onPress={() => act(event.id, 'approve')} style={styles.action} />
            <Button label={t('verify.reject')} variant="danger" onPress={() => act(event.id, 'reject')} style={styles.action} />
            <Button label={t('verify.hide')} variant="secondary" onPress={() => act(event.id, 'hide')} style={styles.action} />
          </View>
        </Card>
      ))}
      <AppText variant="label">{t('verify.adminReports')}</AppText>
      {reported.length === 0 ? <AppText variant="muted">{t('verify.adminEmpty')}</AppText> : null}
      {reported.map((event) => (
        <Card key={`report-${event.id}`} style={styles.card}>
          <AppText variant="bodyMedium">{event.title}</AppText>
          <AppText variant="muted">{String(event.reporters.length)}</AppText>
        </Card>
      ))}
      <AppText variant="label">{t('verify.adminOrganizer')}</AppText>
      {organizer?.status === 'pending' ? (
        <Card style={styles.card}>
          <AppText variant="heading">{organizer.businessName}</AppText>
          <AppText variant="muted">
            {organizer.venueName} · {organizer.email}
          </AppText>
          <View style={styles.row}>
            <Button
              label={t('verify.approve')}
              style={styles.action}
              onPress={() => reason.trim() && reviewOrganizer({ actorId, status: 'approved', reason: reason.trim() })}
            />
            <Button
              label={t('verify.reject')}
              variant="danger"
              style={styles.action}
              onPress={() => reason.trim() && reviewOrganizer({ actorId, status: 'rejected', reason: reason.trim() })}
            />
          </View>
        </Card>
      ) : (
        <AppText variant="muted">{t('verify.adminEmpty')}</AppText>
      )}
      <AppText variant="label">{t('verify.adminClaims')}</AppText>
      {claims.filter((claim) => claim.status === 'pending').length === 0 ? <AppText variant="muted">{t('verify.adminEmpty')}</AppText> : null}
      {claims
        .filter((claim) => claim.status === 'pending')
        .map((claim) => (
          <Card key={claim.id} style={styles.card}>
            <AppText variant="bodyMedium">{claim.venueId}</AppText>
            <AppText variant="muted">{claim.contact}</AppText>
            <View style={styles.row}>
              <Button
                label={t('verify.approve')}
                style={styles.action}
                onPress={() => reason.trim() && reviewVenueClaim({ claimId: claim.id, actorId, status: 'approved', reason: reason.trim() })}
              />
              <Button
                label={t('verify.reject')}
                variant="danger"
                style={styles.action}
                onPress={() => reason.trim() && reviewVenueClaim({ claimId: claim.id, actorId, status: 'rejected', reason: reason.trim() })}
              />
            </View>
          </Card>
        ))}
      <AppText variant="label">{t('verify.adminLog')}</AppText>
      {log.length === 0 ? <AppText variant="muted">{t('verify.adminEmpty')}</AppText> : null}
      {log.slice(0, 20).map((entry) => (
        <AppText key={entry.id} variant="muted">
          {entry.action} · {entry.targetId} · {entry.reason}
        </AppText>
      ))}
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
  card: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
