import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';

export function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.box}>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="muted">{body}</AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

export function ErrorState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <View style={styles.box}>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="muted">{body}</AppText>
      <Button label={actionLabel} onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 12, padding: 20 },
});
