import type { NightEvent } from './types';

export type KnownVenue = {
  name: string;
  area: string;
  city: string;
};

export type PlaceHit = {
  key: string;
  name: string;
  area: string;
  city: string;
  eventId: string | null;
};

export const knownVenues: KnownVenue[] = [
  { name: 'Volkswagen Arena', area: 'Maslak', city: 'İstanbul' },
  { name: 'KüçükÇiftlik Park', area: 'Maçka', city: 'İstanbul' },
  { name: 'Zorlu PSM', area: 'Zincirlikuyu', city: 'İstanbul' },
  { name: 'Harbiye Açıkhava', area: 'Harbiye', city: 'İstanbul' },
  { name: 'Bonus Park', area: 'Kadıköy', city: 'İstanbul' },
  { name: 'IF Performance', area: 'Beşiktaş', city: 'İstanbul' },
  { name: 'Jolly Joker', area: 'Beyoğlu', city: 'İstanbul' },
  { name: 'Babylon', area: 'Şişhane', city: 'İstanbul' },
  { name: 'Klein', area: 'Şişhane', city: 'İstanbul' },
  { name: 'Sortie', area: 'Kuruçeşme', city: 'İstanbul' },
  { name: 'Parkorman', area: 'Maslak', city: 'İstanbul' },
  { name: 'Life Park', area: 'Çekmeköy', city: 'İstanbul' },
  { name: 'Maximum Uniq', area: 'Kemerburgaz', city: 'İstanbul' },
  { name: 'Blind', area: 'İstiklal', city: 'İstanbul' },
  { name: 'Arkaoda', area: 'Beyoğlu', city: 'İstanbul' },
  { name: 'Pixie', area: 'Asmalımescit', city: 'İstanbul' },
  { name: 'Gizli Bahçe', area: 'Beyoğlu', city: 'İstanbul' },
  { name: 'Indigo', area: 'Akaretler', city: 'İstanbul' },
  { name: 'Kiki', area: 'Cihangir', city: 'İstanbul' },
  { name: '360', area: 'Beyoğlu', city: 'İstanbul' },
  { name: 'Ruby', area: 'Kuruçeşme', city: 'İstanbul' },
  { name: 'Anjelique', area: 'Ortaköy', city: 'İstanbul' },
  { name: 'Suada', area: 'Kuruçeşme', city: 'İstanbul' },
  { name: 'Frankhan', area: 'Karaköy', city: 'İstanbul' },
  { name: 'Suma Han', area: 'Karaköy', city: 'İstanbul' },
  { name: 'Nardis', area: 'Galata', city: 'İstanbul' },
  { name: 'Salon İKSV', area: 'Şişhane', city: 'İstanbul' },
  { name: 'Hayal Kahvesi', area: 'Beyoğlu', city: 'İstanbul' },
  { name: 'Bronx Pi', area: 'Kadıköy', city: 'İstanbul' },
  { name: 'Peyote', area: 'Kadıköy', city: 'İstanbul' },
  { name: 'Karga', area: 'Kadıköy', city: 'İstanbul' },
  { name: 'Cozy', area: 'Kadıköy', city: 'İstanbul' },
  { name: 'Gaspar', area: 'Karaköy', city: 'İstanbul' },
  { name: 'Alexandra', area: 'Karaköy', city: 'İstanbul' },
];

function fold(value: string) {
  return value.toLocaleLowerCase('tr-TR');
}

export function searchPlaces(query: string, events: NightEvent[]): PlaceHit[] {
  const needle = fold(query.trim());
  if (!needle) return [];
  const hits: PlaceHit[] = [];
  for (const venue of knownVenues) {
    const blob = fold(`${venue.name} ${venue.area} ${venue.city}`);
    if (!blob.includes(needle)) continue;
    const event =
      events.find((item) => fold(item.venue) === fold(venue.name) || fold(item.title) === fold(venue.name)) ?? null;
    hits.push({
      key: venue.name,
      name: venue.name,
      area: venue.area,
      city: venue.city,
      eventId: event?.id ?? null,
    });
  }
  for (const event of events) {
    const blob = fold(`${event.title} ${event.venue} ${event.city}`);
    if (!blob.includes(needle)) continue;
    if (hits.some((hit) => hit.eventId === event.id || fold(hit.name) === fold(event.venue))) continue;
    hits.push({
      key: event.id,
      name: event.venue,
      area: event.title,
      city: event.city,
      eventId: event.id,
    });
  }
  return hits
    .sort((a, b) => {
      const ar = fold(a.name).startsWith(needle) ? 0 : 1;
      const br = fold(b.name).startsWith(needle) ? 0 : 1;
      return ar - br || a.name.localeCompare(b.name, 'tr-TR');
    })
    .slice(0, 8);
}
