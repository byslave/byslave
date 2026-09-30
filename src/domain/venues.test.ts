import { searchPlaces } from './venues';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const hits = searchPlaces('Volkswagen', []);
assert(hits[0]?.name === 'Volkswagen Arena', 'Volkswagen Arena ilk sonuç olmalı');
assert(hits[0]?.area === 'Maslak', 'Volkswagen Arena Maslak’ta');
assert(searchPlaces('volks', []).some((hit) => hit.name === 'Volkswagen Arena'), 'küçük harf de bulmalı');
assert(searchPlaces('', []).length === 0, 'boş arama liste dökmemeli');
console.log('venues ok');
