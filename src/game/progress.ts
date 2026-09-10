import { BLAST_SETS } from './pieces'
import { isSkinId } from './shop'
import type { BlockSkinId, BlastSetId, Progress } from './types'

const KEY = 'neonpatlat-progress-v1'

export const DEFAULT: Progress = {
  best: 0,
  maxCombo: 0,
  gamesPlayed: 0,
  playerName: 'Misafir',
  equipped: 'neon-yagmuru',
  unlocked: ['neon-yagmuru', 'kozmik-kupler', 'disko-simsegi'],
  muted: false,
  coins: 80,
  skins: ['neon'],
  equippedSkin: 'neon',
}

export function normalizeProgress(raw: Partial<Progress> | Progress = {}): Progress {
  const unlocked = raw.unlocked?.length ? raw.unlocked : [...DEFAULT.unlocked]
  const skins = Array.from(
    new Set((raw.skins?.length ? raw.skins : [...DEFAULT.skins]).filter(isSkinId)),
  ) as BlockSkinId[]
  if (!skins.includes('neon')) skins.unshift('neon')
  const equippedSkin = isSkinId(raw.equippedSkin ?? '') && skins.includes(raw.equippedSkin as BlockSkinId)
    ? (raw.equippedSkin as BlockSkinId)
    : 'neon'
  return {
    ...DEFAULT,
    ...raw,
    unlocked,
    skins,
    equippedSkin,
    coins: Math.max(0, Math.floor(raw.coins ?? DEFAULT.coins)),
    muted: raw.muted ?? false,
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return normalizeProgress()
    return normalizeProgress(JSON.parse(raw) as Partial<Progress>)
  } catch {
    return normalizeProgress()
  }
}

export function saveProgress(progress: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function freshlyUnlocked(progress: Progress): BlastSetId[] {
  const next: BlastSetId[] = [...progress.unlocked]
  for (const set of BLAST_SETS) {
    if (next.includes(set.id)) continue
    if (set.requiresCombo && progress.maxCombo >= set.requiresCombo) next.push(set.id)
    else if (set.requiresBest && progress.best >= set.requiresBest) next.push(set.id)
  }
  return next
}

export type RankEntry = {
  name: string
  score: number
  combo: number
  you?: boolean
}

const WORLD: RankEntry[] = [
  { name: 'Nova', score: 91240, combo: 14 },
  { name: 'Mert', score: 87410, combo: 12 },
  { name: 'PixelAda', score: 83120, combo: 11 },
  { name: 'Kuzey', score: 76200, combo: 10 },
  { name: 'Luna', score: 70110, combo: 9 },
  { name: 'Arda', score: 64880, combo: 9 },
  { name: 'Echo', score: 59040, combo: 8 },
  { name: 'Sena', score: 54120, combo: 8 },
  { name: 'Volt', score: 49800, combo: 7 },
  { name: 'Ece', score: 45210, combo: 7 },
  { name: 'Rüzgar', score: 41002, combo: 6 },
  { name: 'Mira', score: 37650, combo: 6 },
  { name: 'Can', score: 33990, combo: 5 },
  { name: 'Ada', score: 30120, combo: 5 },
  { name: 'Kaan', score: 26880, combo: 4 },
  { name: 'Yaz', score: 22140, combo: 4 },
  { name: 'Bora', score: 18400, combo: 3 },
]

const FRIENDS: RankEntry[] = [
  { name: 'Nova', score: 91240, combo: 14 },
  { name: 'Mert', score: 87410, combo: 12 },
  { name: 'PixelAda', score: 83120, combo: 11 },
  { name: 'Sena', score: 54120, combo: 8 },
  { name: 'Can', score: 33990, combo: 5 },
]

export function withPlayer(list: RankEntry[], progress: Progress): RankEntry[] {
  const you: RankEntry = {
    name: progress.playerName,
    score: progress.best,
    combo: progress.maxCombo,
    you: true,
  }
  return [...list.filter((e) => e.name.toLowerCase() !== progress.playerName.toLowerCase()), you].sort(
    (a, b) => b.score - a.score,
  )
}

export function worldBoard(progress: Progress): RankEntry[] {
  return withPlayer(WORLD, progress)
}

export function friendBoard(progress: Progress): RankEntry[] {
  return withPlayer(FRIENDS, progress)
}

export function weekResetLabel(now = new Date()): { label: string; ms: number } {
  const next = new Date(now)
  const day = now.getDay()
  const add = day === 1 ? 7 : (8 - day) % 7 || 7
  next.setDate(now.getDate() + add)
  next.setHours(10, 0, 0, 0)
  const ms = Math.max(0, next.getTime() - now.getTime())
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  return { label: `${days}g ${hours}s`, ms }
}
