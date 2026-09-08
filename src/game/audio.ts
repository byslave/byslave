let ctx: AudioContext | null = null
let muted = false

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx ??= new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(value: boolean): void {
  muted = value
  if (value) void ctx?.suspend()
  else void ctx?.resume()
}

export function unlockAudio(): void {
  if (typeof window === 'undefined') return
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx ??= new AC()
  if (!muted && ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.08, slide = 0) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ac.currentTime + duration)
  g.gain.setValueAtTime(gain, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + duration + 0.02)
}

export function sfxTap(): void {
  tone(520, 0.05, 'square', 0.04)
}

export function sfxPlace(): void {
  tone(220, 0.08, 'triangle', 0.07, 80)
}

export function sfxFall(): void {
  tone(180, 0.14, 'sawtooth', 0.04, -90)
}

export function sfxClear(combo: number): void {
  const base = 320 + Math.min(combo, 8) * 55
  tone(base, 0.16, 'square', 0.07, 140)
  window.setTimeout(() => tone(base * 1.5, 0.18, 'triangle', 0.05, 80), 40)
}

export function sfxCombo(combo: number): void {
  const n = Math.min(combo, 6)
  tone(260 + n * 80, 0.12, 'square', 0.08, 220)
  window.setTimeout(() => tone(440 + n * 70, 0.18, 'triangle', 0.07, 160), 45)
  if (n >= 3) window.setTimeout(() => tone(920, 0.22, 'sawtooth', 0.045, -240), 90)
}

export function sfxOver(): void {
  tone(240, 0.22, 'sawtooth', 0.06, -160)
  window.setTimeout(() => tone(120, 0.28, 'triangle', 0.05, -40), 90)
}

export function sfxLogin(): void {
  tone(392, 0.1, 'triangle', 0.06)
  window.setTimeout(() => tone(523, 0.12, 'triangle', 0.06), 80)
  window.setTimeout(() => tone(659, 0.16, 'triangle', 0.05), 160)
}
