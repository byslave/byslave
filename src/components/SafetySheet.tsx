import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Chip } from '@/src/components/ui/Chip';

const reasons = ['wrong', 'spam', 'unsafe', 'duplicate'] as const;

export function SafetySheet({
  visible,
  onClose,
  onReport,
  onBlock,
  blocked = false,
}: {
  visible: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
  onBlock?: () => void;
  blocked?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <BottomSheet visible={visible} title={t('event.reportTitle')} onClose={onClose}>
      {reasons.map((reason) => (
        <Chip key={reason} label={t(`reasons.${reason}`)} onPress={() => onReport(reason)} />
      ))}
      {onBlock ? <Chip label={blocked ? t('common.unblock') : t('common.block')} onPress={onBlock} /> : null}
    </BottomSheet>
  );
}
