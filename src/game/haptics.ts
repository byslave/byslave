export type ImpactLevel = 'light' | 'medium' | 'heavy'

/** Web + Android WebView rumble pattern for a line clear. */
export function comboPattern(combo: number, perfect = false): number[] {
  if (perfect && combo >= 10) return [90, 40, 130, 40, 180, 50, 100]
  if (combo >= 10) return [70, 35, 110, 35, 150, 45, 90]
  if (combo >= 7) return [42, 28, 60, 28, 90]
  if (combo >= 5) return [30, 22, 48, 22, 64]
  if (combo >= 3) return [22, 18, 32]
  if (combo >= 1) return [18]
  return [12]
}

function webVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    /* unsupported */
  }
}

function nativeImpact(level: ImpactLevel, durationMs: number) {
  void import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => {
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }
      void Haptics.impact({ style: map[level] }).catch(() => {
        /* web */
      })
      if (durationMs >= 40) {
        void Haptics.vibrate({ duration: Math.min(durationMs, 400) }).catch(() => {
          /* web */
        })
      }
    })
    .catch(() => {
      /* web */
    })
}

function rumble(pattern: number[], level: ImpactLevel) {
  webVibrate(pattern)
  const duration = pattern.reduce((sum, n) => sum + n, 0)
  nativeImpact(level, duration)
}

export function hapticPlace() {
  rumble([12], 'light')
}

export function hapticBlast(combo: number, perfect = false) {
  const pattern = comboPattern(combo, perfect)
  const level: ImpactLevel =
    perfect || combo >= 7 ? 'heavy' : combo >= 5 ? 'medium' : combo >= 2 ? 'medium' : 'light'
  rumble(pattern, level)
}
