export function clearStamp(lines: number, perfect: boolean): string {
  if (perfect) return 'PERFECT'
  if (lines >= 4) return 'QUAD'
  if (lines >= 3) return 'TRIPLE'
  if (lines >= 2) return 'DOUBLE'
  return 'PATLAT!'
}
