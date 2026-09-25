import type { GeoPoint } from '../domain/types';

function encode(value: number): string {
  let number = value < 0 ? ~(value << 1) : value << 1;
  let output = '';
  while (number >= 0x20) {
    output += String.fromCharCode((0x20 | (number & 0x1f)) + 63);
    number >>= 5;
  }
  return output + String.fromCharCode(number + 63);
}

function encodePolyline(points: GeoPoint[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = '';
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    result += encode(lat - lastLat);
    result += encode(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
}

export function mapboxStaticUrl(route: GeoPoint[]): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token || route.length < 2) return null;
  const path = encodeURIComponent(encodePolyline(route));
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/path-5+e50914-0.95(${path})/auto/640x320@2x?padding=48&access_token=${token}`;
}
