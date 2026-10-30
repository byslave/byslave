import type { CoverKey, PortraitKey } from '@/src/data/images';

export type CityId = 'istanbul' | 'ankara' | 'izmir';
export type Genre = 'techno' | 'house' | 'trance' | 'hiphop' | 'pop' | 'dnb' | 'electro';
export type VenueType = 'club' | 'open-air' | 'warehouse' | 'festival';

export interface Localized {
  tr: string;
  en: string;
}

export interface Venue {
  id: string;
  name: string;
  city: CityId;
  district: string;
  street?: string;
  lat: number;
  lng: number;
  type: VenueType;
}

export interface DemoPerson {
  id: string;
  name: string;
  portrait: PortraitKey;
}

export interface DemoEvent {
  id: string;
  venueId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  genres: Genre[];
  lineup: string[];
  price: Localized;
  ageLimit: number;
  description: Localized;
  going: number;
  checkedIn: number;
  mutuals: number;
  cover: CoverKey;
  attendeeIds: string[];
}

export interface DemoPost {
  id: string;
  authorId: string;
  eventId: string;
  caption: Localized;
  minutesAgo: number;
  cover: CoverKey;
  story: boolean;
}

export interface BoardRow {
  id: string;
  name: string;
  portrait: PortraitKey | 'you';
  jumps: number;
  minutes: number;
  you?: boolean;
}

export const cities: Record<CityId, { lng: number; lat: number; zoom: number }> = {
  istanbul: { lng: 29.005, lat: 41.045, zoom: 11.55 },
  ankara: { lng: 32.854, lat: 39.925, zoom: 11.6 },
  izmir: { lng: 27.142, lat: 38.432, zoom: 11.7 },
};

export const people: DemoPerson[] = [
  { id: 'ece', name: 'Ece Yılmaz', portrait: 'p1' },
  { id: 'kerem', name: 'Kerem Aydın', portrait: 'p2' },
  { id: 'selin', name: 'Selin Uçar', portrait: 'p3' },
  { id: 'mert', name: 'Mert Koç', portrait: 'p4' },
];

export const venues: Venue[] = [
  {
    id: 'klein',
    name: 'Klein Phönix',
    city: 'istanbul',
    district: 'Maslak',
    street: 'AOS 52. Sokak No:12, Atatürk Oto Sanayi Sitesi',
    lat: 41.118384,
    lng: 29.022423,
    type: 'club',
  },
  { id: 'rx', name: 'RX Istanbul', city: 'istanbul', district: 'Karaköy', lat: 41.0256, lng: 28.9774, type: 'warehouse' },
  { id: 'banger', name: 'Banger', city: 'istanbul', district: 'Kadıköy', lat: 40.9918, lng: 29.0276, type: 'club' },
  { id: 'silo', name: 'Silo', city: 'istanbul', district: 'Bomonti', lat: 41.0562, lng: 28.9788, type: 'warehouse' },
  { id: 'bahce', name: 'Arka Bahçe', city: 'istanbul', district: 'Sarıyer', lat: 41.148, lng: 29.0502, type: 'open-air' },
  { id: 'karanlik', name: 'Karanlık Oda', city: 'ankara', district: 'Tunalı', lat: 39.9072, lng: 32.8604, type: 'club' },
  { id: 'hangar', name: 'Hangar 06', city: 'ankara', district: 'OSTİM', lat: 39.9684, lng: 32.7488, type: 'warehouse' },
  { id: 'kordon', name: 'Kordon Warehouse', city: 'izmir', district: 'Alsancak', lat: 38.4386, lng: 27.1428, type: 'warehouse' },
  { id: 'sahil', name: 'Sahil', city: 'izmir', district: 'Karşıyaka', lat: 38.4558, lng: 27.118, type: 'open-air' },
];

export const events: DemoEvent[] = [
  {
    id: 'pulse-01',
    venueId: 'klein',
    title: 'Pulse 01',
    date: '2026-10-17',
    startTime: '23:00',
    endTime: '06:00',
    genres: ['techno', 'electro'],
    lineup: ['Vera Kael', 'Nils Orth', 'Mira Sol'],
    price: { tr: '₺450–700', en: '₺450–700' },
    ageLimit: 18,
    description: {
      tr: 'Açılış seti erken başlar. Ana oda tekno, yan oda elektro. Örnek bir gece kaydıdır.',
      en: 'The opening set starts early. Main room techno, side room electro. This is a sample night.',
    },
    going: 184,
    checkedIn: 62,
    mutuals: 3,
    cover: 'crowd',
    attendeeIds: ['ece', 'kerem', 'selin'],
  },
  {
    id: 'rx-sat',
    venueId: 'rx',
    title: 'RX After Dark',
    date: '2026-10-17',
    startTime: '23:30',
    endTime: '05:00',
    genres: ['house'],
    lineup: ['Ada Wren', 'Leo Park'],
    price: { tr: '₺350', en: '₺350' },
    ageLimit: 18,
    description: {
      tr: 'Depo house gecesi. Örnek liste, doğrulanmış organizatör kaydı değildir.',
      en: 'A warehouse house night. Sample listing, not a verified organizer record.',
    },
    going: 96,
    checkedIn: 28,
    mutuals: 1,
    cover: 'lights',
    attendeeIds: ['mert', 'selin'],
  },
  {
    id: 'banger-sat',
    venueId: 'banger',
    title: 'Banger Room',
    date: '2026-10-17',
    startTime: '00:00',
    endTime: '06:00',
    genres: ['techno'],
    lineup: ['Kian Voss'],
    price: { tr: '₺300', en: '₺300' },
    ageLimit: 21,
    description: {
      tr: 'Küçük oda, yüksek tempo. 21+ örnek etkinlik.',
      en: 'Small room, high tempo. Sample 21+ event.',
    },
    going: 73,
    checkedIn: 19,
    mutuals: 2,
    cover: 'crowd',
    attendeeIds: ['ece', 'mert'],
  },
  {
    id: 'silo-tonight',
    venueId: 'silo',
    title: 'Silo Midweek',
    date: '2026-10-13',
    startTime: '22:00',
    endTime: '03:00',
    genres: ['dnb'],
    lineup: ['Noa Peck'],
    price: { tr: '₺250', en: '₺250' },
    ageLimit: 18,
    description: {
      tr: 'Salı gecesi drum and bass. Örnek “bu gece” kaydı.',
      en: 'Tuesday drum and bass. Sample “tonight” listing.',
    },
    going: 41,
    checkedIn: 11,
    mutuals: 0,
    cover: 'lights',
    attendeeIds: ['kerem'],
  },
  {
    id: 'bahce-sun',
    venueId: 'bahce',
    title: 'Bahçe Trance',
    date: '2026-10-18',
    startTime: '16:00',
    endTime: '23:00',
    genres: ['trance'],
    lineup: ['Elif Shore'],
    price: { tr: '₺200', en: '₺200' },
    ageLimit: 18,
    description: {
      tr: 'Açık hava, gün batımı. Örnek pazar kaydı.',
      en: 'Open air, sunset. Sample Sunday listing.',
    },
    going: 28,
    checkedIn: 0,
    mutuals: 1,
    cover: 'concert',
    attendeeIds: ['selin'],
  },
  {
    id: 'ankara-sat',
    venueId: 'karanlik',
    title: 'Karanlık',
    date: '2026-10-17',
    startTime: '23:00',
    endTime: '05:00',
    genres: ['techno', 'electro'],
    lineup: ['Deniz Mor'],
    price: { tr: '₺280', en: '₺280' },
    ageLimit: 18,
    description: {
      tr: 'Ankara örnek kulüp gecesi.',
      en: 'Sample Ankara club night.',
    },
    going: 54,
    checkedIn: 12,
    mutuals: 0,
    cover: 'crowd',
    attendeeIds: ['mert'],
  },
  {
    id: 'hangar-sat',
    venueId: 'hangar',
    title: 'Hangar House',
    date: '2026-10-17',
    startTime: '22:30',
    endTime: '04:00',
    genres: ['house'],
    lineup: ['Pelin Ray'],
    price: { tr: '₺220', en: '₺220' },
    ageLimit: 18,
    description: {
      tr: 'Ankara depo house. Örnek kayıt.',
      en: 'Ankara warehouse house. Sample listing.',
    },
    going: 22,
    checkedIn: 4,
    mutuals: 0,
    cover: 'lights',
    attendeeIds: [],
  },
  {
    id: 'kordon-sat',
    venueId: 'kordon',
    title: 'Kordon 17',
    date: '2026-10-17',
    startTime: '23:00',
    endTime: '05:30',
    genres: ['techno'],
    lineup: ['Arda Nil'],
    price: { tr: '₺260', en: '₺260' },
    ageLimit: 18,
    description: {
      tr: 'İzmir depo teknosu. Örnek kayıt.',
      en: 'Izmir warehouse techno. Sample listing.',
    },
    going: 37,
    checkedIn: 9,
    mutuals: 0,
    cover: 'concert',
    attendeeIds: ['ece'],
  },
  {
    id: 'sahil-sun',
    venueId: 'sahil',
    title: 'Sahil Session',
    date: '2026-10-18',
    startTime: '17:00',
    endTime: '23:00',
    genres: ['house', 'pop'],
    lineup: ['Maya Kent'],
    price: { tr: 'Ücretsiz', en: 'Free' },
    ageLimit: 18,
    description: {
      tr: 'Açık hava house. Örnek pazar kaydı.',
      en: 'Open-air house. Sample Sunday listing.',
    },
    going: 19,
    checkedIn: 0,
    mutuals: 0,
    cover: 'concert',
    attendeeIds: [],
  },
];

export const posts: DemoPost[] = [
  {
    id: 'post-ece',
    authorId: 'ece',
    eventId: 'pulse-01',
    caption: {
      tr: 'Açılış seti için erken gelmeye kesinlikle değdi.',
      en: 'Showing up early for the opening set was absolutely worth it.',
    },
    minutesAgo: 42,
    cover: 'crowd',
    story: true,
  },
  {
    id: 'post-kerem',
    authorId: 'kerem',
    eventId: 'silo-tonight',
    caption: {
      tr: 'Bomonti bu gece daha sıkı. Örnek bir not.',
      en: 'Bomonti is tighter tonight. A sample note.',
    },
    minutesAgo: 18,
    cover: 'lights',
    story: true,
  },
  {
    id: 'post-selin',
    authorId: 'selin',
    eventId: 'bahce-sun',
    caption: {
      tr: 'Gün batımı seti için sahil tarafı daha iyi duyuluyor.',
      en: 'The shore side hears the sunset set more clearly.',
    },
    minutesAgo: 95,
    cover: 'concert',
    story: false,
  },
];

export const boardRows: BoardRow[] = [
  { id: 'ece', name: 'Ece Yılmaz', portrait: 'p1', jumps: 1820, minutes: 246 },
  { id: 'kerem', name: 'Kerem Aydın', portrait: 'p2', jumps: 1512, minutes: 204 },
  { id: 'you', name: '', portrait: 'you', jumps: 1248, minutes: 138, you: true },
  { id: 'mert', name: 'Mert Koç', portrait: 'p4', jumps: 980, minutes: 166 },
  { id: 'selin', name: 'Selin Uçar', portrait: 'p3', jumps: 860, minutes: 188 },
];

export const sampleNight = {
  eventId: 'pulse-01',
  minutes: 138,
  jumps: 1248,
  arrival: '23:14',
  peak: '01:30',
  departure: '01:32',
  series: [42, 86, 120, 168, 96, 154, 210, 188, 112, 72],
};

export function loc(value: Localized, language: string): string {
  return language.startsWith('en') ? value.en : value.tr;
}

export function venueById(id: string): Venue | undefined {
  return venues.find((venue) => venue.id === id);
}

export function eventById(id: string): DemoEvent | undefined {
  return events.find((event) => event.id === id);
}

export function personById(id: string): DemoPerson | undefined {
  return people.find((person) => person.id === id);
}
