/** Bluetooth nabız ölçüm paketi. Tahmin yazılmaz; bayt yoksa nabız da yoktur. */
export function parseHeartRate(data: DataView): number | null {
  if (data.byteLength < 2) return null;
  const flags = data.getUint8(0);
  const wide = (flags & 0x1) === 1;
  if (wide && data.byteLength < 3) return null;
  const bpm = wide ? data.getUint16(1, true) : data.getUint8(1);
  if (!Number.isFinite(bpm) || bpm <= 0 || bpm > 250) return null;
  return bpm;
}

export const heartRateService = 0x180d;
export const heartRateMeasurement = 0x2a37;

export function isFresh(at: number | null, now = Date.now(), maxAgeMs = 8_000): boolean {
  return at != null && now - at <= maxAgeMs;
}
