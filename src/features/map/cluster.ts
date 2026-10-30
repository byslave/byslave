export interface MapPin {
  id: string;
  lng: number;
  lat: number;
  label: string;
  count: number;
}

export interface ClusterGroup {
  id: string;
  lng: number;
  lat: number;
  count: number;
  label: string;
  pinIds: string[];
}

export function clusterPins(pins: MapPin[], zoom: number): ClusterGroup[] {
  if (zoom >= 11 || pins.length === 0) {
    return pins.map((pin) => ({
      id: pin.id,
      lng: pin.lng,
      lat: pin.lat,
      count: pin.count,
      label: pin.label,
      pinIds: [pin.id],
    }));
  }

  const cell = zoom >= 9.5 ? 0.22 : 0.7;
  const buckets = new globalThis.Map<string, MapPin[]>();
  for (const pin of pins) {
    const key = `${Math.floor(pin.lat / cell)}:${Math.floor(pin.lng / cell)}`;
    const list = buckets.get(key);
    if (list) list.push(pin);
    else buckets.set(key, [pin]);
  }

  const groups: ClusterGroup[] = [];
  for (const [key, list] of buckets) {
    let count = 0;
    let lng = 0;
    let lat = 0;
    const pinIds: string[] = [];
    for (const pin of list) {
      count += pin.count;
      lng += pin.lng;
      lat += pin.lat;
      pinIds.push(pin.id);
    }
    groups.push({
      id: list.length === 1 ? list[0].id : `cluster:${key}`,
      lng: lng / list.length,
      lat: lat / list.length,
      count,
      label: list.length === 1 ? list[0].label : '',
      pinIds,
    });
  }
  return groups;
}
