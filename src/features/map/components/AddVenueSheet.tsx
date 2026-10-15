import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import type { CityId, VenueType } from '@/src/data/demo';
import { venueDraftSchema, venueTypeValues } from '@/src/features/venues/draft';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

interface AddVenueSheetProps {
  visible: boolean;
  city: CityId;
  center: { lng: number; lat: number };
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function AddVenueSheet({ visible, city, center, onClose, onCreated }: AddVenueSheetProps) {
  const { t } = useTranslation();
  const addVenue = useAppStore((state) => state.addVenue);
  const showToast = useToastStore((state) => state.show);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [type, setType] = useState<VenueType>('club');
  const [rules, setRules] = useState('');
  const [invalid, setInvalid] = useState(false);

  function close() {
    setInvalid(false);
    onClose();
  }

  function save() {
    const parsed = venueDraftSchema.safeParse({ name, district, type, rules });
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    const id = addVenue({
      name: parsed.data.name,
      district: parsed.data.district,
      type: parsed.data.type,
      rules: parsed.data.rules,
      city,
      lat: center.lat,
      lng: center.lng,
    });
    setName('');
    setDistrict('');
    setRules('');
    setType('club');
    setInvalid(false);
    showToast(t('map.saved'));
    onCreated(id);
    onClose();
  }

  return (
    <BottomSheet visible={visible} title={t('map.addTitle')} onClose={close}>
      <AppText variant="muted">{t('map.pinHint')}</AppText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('map.name')}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        accessibilityLabel={t('map.name')}
        maxLength={80}
      />
      <TextInput
        value={district}
        onChangeText={setDistrict}
        placeholder={t('map.district')}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        accessibilityLabel={t('map.district')}
        maxLength={80}
      />
      <View style={styles.types}>
        {venueTypeValues.map((value) => (
          <Chip key={value} label={t(`venueTypes.${value}`)} selected={type === value} onPress={() => setType(value)} />
        ))}
      </View>
      <TextInput
        value={rules}
        onChangeText={setRules}
        placeholder={t('map.rulesPlaceholder')}
        placeholderTextColor={colors.textFaint}
        style={[styles.input, styles.rules]}
        accessibilityLabel={t('map.rules')}
        maxLength={280}
        multiline
      />
      {invalid ? <AppText variant="muted">{t('map.invalid')}</AppText> : null}
      <Button label={t('common.save')} onPress={save} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: 14,
  },
  rules: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
