import type { CityId } from '@/src/data/demo';
import places from '@/src/data/venueDirectory.json';
import { searchPlaces, type DirectoryPlace } from '@/src/features/venues/search';

export type { DirectoryPlace };

export function searchVenueDirectory(query: string, city: CityId): DirectoryPlace[] {
  return searchPlaces(places as DirectoryPlace[], query, city);
}
