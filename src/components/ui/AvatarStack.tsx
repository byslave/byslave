import { View } from 'react-native';

import { Avatar } from '@/src/components/ui/Avatar';
import type { PortraitKey } from '@/src/data/images';

interface Person {
  name: string;
  portrait?: PortraitKey | 'you';
}

export function AvatarStack({ people, size = 28 }: { people: Person[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', height: size }}>
      {people.slice(0, 4).map((person, index) => (
        <View key={`${person.name}-${index}`} style={{ marginLeft: index === 0 ? 0 : -8 }}>
          <Avatar name={person.name} portrait={person.portrait} size={size} />
        </View>
      ))}
    </View>
  );
}
