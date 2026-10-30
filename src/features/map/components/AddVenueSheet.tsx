import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import type { CityId, VenueType } from '@/src/data/demo';
import { searchVenueDirectory, type DirectoryPlace } from '@/src/features/venues/directory';
import { venueDraftSchema, venueTypeValues } from '@/src/features/venues/draft';
import { foldPlaceName } from '@/src/features/venues/search';
import { useAppStore } from '@/src/stores/appStore';
import { useToastStore } from '@/src/stores/toastStore';
import { colors, fonts, radii } from '@/src/theme/tokens';

interface AddVenueSheetProps {
  visible: boolean;
  city: CityId;
  center: { lng: number; lat: number };
  onClose: () => void;
  onCreated: (id: string) => void;
  onPreview: (lng: number, lat: number) => void;
}

export function AddVenueSheet({ visible, city, center, onClose, onCreated, onPreview }: AddVenueSheetProps) {
  const { t } = useTranslation();
  const addVenue = useAppStore((state) => state.addVenue);
  const showToast = useToastStore((state) => state.show);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [type, setType] = useState<VenueType>('club');
  const [rules, setRules] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [picked, setPicked] = useState<DirectoryPlace | null>(null);
  const matches = useMemo(() => searchVenueDirectory(name, city), [name, city]);
  const activePick = picked && foldPlaceName(picked.name) === foldPlaceName(name) ? picked : null;

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
      name: activePick?.name ?? parsed.data.name,
      district: activePick?.district ?? parsed.data.district,
      street: activePick?.street ?? '',
      type: parsed.data.type,
      rules: parsed.data.rules,
      city,
      lat: activePick?.lat ?? center.lat,
      lng: activePick?.lng ?? center.lng,
    });
    setName('');
    setDistrict('');
    setRules('');
    setType('club');
    setPicked(null);
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
        onChangeText={(value) => {
          setName(value);
          setInvalid(false);
        }}
        placeholder={t('map.name')}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        accessibilityLabel={t('map.name')}
        maxLength={80}
      />
      {matches.length > 0 ? (
        <View style={styles.matches}>
          {matches.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() => {
                setName(place.name);
                setDistrict(place.district);
                setPicked(place);
                setInvalid(false);
                onPreview(place.lng, place.lat);
              }}
              style={[styles.match, activePick?.id === place.id && styles.matchSelected]}
            >
              <AppText variant="bodyMedium">{place.name}</AppText>
              <AppText variant="muted">
                {place.street ? t('map.listedPlace', { district: place.district, street: place.street }) : place.district}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : name.trim().length >= 2 ? (
        <AppText variant="muted">{t('map.directoryEmpty')}</AppText>
      ) : null}
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
  matches: { gap: 8 },
  match: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  matchSelected: { borderColor: colors.accent },
});
