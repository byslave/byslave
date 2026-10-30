import type { CityId } from '@/src/data/demo';

export interface DirectoryPlace {
  id: string;
  name: string;
  aliases: string[];
  city: CityId;
  district: string;
  street: string;
  lat: number;
  lng: number;
  source: 'openstreetmap' | 'listing';
}

export function foldPlaceName(value: string): string {
  return value
    .toLocaleLowerCase('tr')
    .replaceAll('ö', 'o')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ç', 'c')
    .replaceAll('ı', 'i')
    .replaceAll('â', 'a')
    .replaceAll('phoenix', 'phonix');
}

function scorePlace(place: DirectoryPlace, needle: string): number {
  const names = [place.name, ...place.aliases].map(foldPlaceName);
  if (names.some((name) => name === needle)) return 100;
  const words = needle.split(/\s+/).filter(Boolean);
  if (words.length > 1 && names.some((name) => words.every((word) => name.includes(word)))) return 90;
  if (names.some((name) => name.startsWith(needle))) return 80;
  if (names.some((name) => name.includes(needle))) return 60;
  return 0;
}

export function searchPlaces(places: DirectoryPlace[], query: string, city: CityId): DirectoryPlace[] {
  const needle = foldPlaceName(query.trim());
  if (needle.length < 2) return [];
  return places
    .filter((place) => place.city === city)
    .map((place) => ({ place, score: scorePlace(place, needle) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'tr'))
    .slice(0, 6)
    .map((row) => row.place);
}
