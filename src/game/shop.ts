import type { BlockSkin, Progress } from './types'

export const BOX_COST = 80
export const DUPLICATE_REFUND = 35

export const BLOCK_SKINS: BlockSkin[] = [
  {
    id: 'neon',
    name: 'Neon Klasik',
    tagline: 'Reaktör varsayılanı',
    rarity: 'common',
    emoji: '🔷',
    motion: false,
  },
  {
    id: 'meyve',
    name: 'Meyve Pazarı',
    tagline: 'Çilek, limon, üzüm',
    rarity: 'rare',
    emoji: '🍓',
    motion: false,
  },
  {
    id: 'jelibon',
    name: 'Jelibon Zıpla',
    tagline: 'Titreyen şeker küpleri',
    rarity: 'rare',
    emoji: '🍬',
    motion: true,
  },
  {
    id: 'pixel',
    name: '8-Bit Tuğla',
    tagline: 'Retro arcade',
    rarity: 'common',
    emoji: '🧱',
    motion: false,
  },
  {
    id: 'magma',
    name: 'Lav Damar',
    tagline: 'Yanıp sönen çekirdek',
    rarity: 'epic',
    emoji: '🔥',
    motion: true,
  },
  {
    id: 'buz',
    name: 'Buz Kristali',
    tagline: 'Donmuş parıltı',
    rarity: 'rare',
    emoji: '❄️',
    motion: true,
  },
  {
    id: 'yildiz',
    name: 'Yıldız Tozu',
    tagline: 'Kayan ışıltı',
    rarity: 'epic',
    emoji: '✨',
    motion: true,
  },
  {
    id: 'disko',
    name: 'Disko Beat',
    tagline: 'Renk dansı',
    rarity: 'epic',
    emoji: '🪩',
    motion: true,
  },
]

const WEIGHT: Record<BlockSkin['rarity'], number> = {
  common: 3,
  rare: 2,
  epic: 1,
}

export function getSkin(id: string): BlockSkin {
  return BLOCK_SKINS.find((s) => s.id === id) ?? BLOCK_SKINS[0]!
}

export function coinsFromGain(scoreGain: number): number {
  return Math.max(0, Math.floor(scoreGain / 8))
}

export function fruitForColor(color: string): string {
  const fruits = ['🍓', '🍋', '🍇', '🍊', '🍉', '🫐', '🍒']
  let hash = 0
  for (let i = 0; i < color.length; i++) hash = (hash + color.charCodeAt(i) * (i + 1)) % fruits.length
  return fruits[hash] ?? '🍓'
}

export type BoxResult =
  | { ok: true; progress: Progress; drop: BlockSkin; duplicate: boolean }
  | { ok: false; error: string }

export function openMysteryBox(progress: Progress, rng: () => number = Math.random): BoxResult {
  if (progress.coins < BOX_COST) {
    return { ok: false, error: `Kutu ${BOX_COST}⚡ ister. Biraz daha patlat.` }
  }

  const owned = new Set(progress.skins)
  const pool = BLOCK_SKINS.filter((skin) => !owned.has(skin.id))
  let coins = progress.coins - BOX_COST

  if (pool.length === 0) {
    coins += DUPLICATE_REFUND
    return {
      ok: true,
      duplicate: true,
      drop: getSkin(progress.equippedSkin),
      progress: { ...progress, coins },
    }
  }

  const bag: BlockSkin[] = []
  for (const skin of pool) {
    const copies = WEIGHT[skin.rarity]
    for (let i = 0; i < copies; i++) bag.push(skin)
  }
  const drop = bag[Math.floor(rng() * bag.length)] ?? pool[0]!
  return {
    ok: true,
    duplicate: false,
    drop,
    progress: {
      ...progress,
      coins,
      skins: [...progress.skins, drop.id],
      equippedSkin: drop.id,
    },
  }
}
