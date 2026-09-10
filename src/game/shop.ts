import type { BlockSkin, BlockSkinId, Progress } from './types'

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
    name: 'Meyve',
    tagline: 'Çilek, limon, üzüm',
    rarity: 'rare',
    emoji: '🍓',
    motion: false,
  },
  {
    id: 'altin',
    name: 'Altın',
    tagline: 'Külçe küpler',
    rarity: 'epic',
    emoji: '🥇',
    motion: false,
  },
  {
    id: 'gumus',
    name: 'Gümüş',
    tagline: 'Cilalı metal',
    rarity: 'rare',
    emoji: '🥈',
    motion: false,
  },
  {
    id: 'rgb',
    name: 'RGB',
    tagline: 'Renk döngüsü',
    rarity: 'epic',
    emoji: '🌈',
    motion: true,
  },
  {
    id: 'jelibon',
    name: 'Jelibon',
    tagline: 'Titreyen şeker',
    rarity: 'rare',
    emoji: '🍬',
    motion: true,
  },
  {
    id: 'pixel',
    name: '8-Bit',
    tagline: 'Retro tuğla',
    rarity: 'common',
    emoji: '🧱',
    motion: false,
  },
  {
    id: 'magma',
    name: 'Magma',
    tagline: 'Lav damarı',
    rarity: 'epic',
    emoji: '🔥',
    motion: true,
  },
  {
    id: 'buz',
    name: 'Buz',
    tagline: 'Donmuş parıltı',
    rarity: 'rare',
    emoji: '❄️',
    motion: true,
  },
  {
    id: 'yildiz',
    name: 'Yıldız',
    tagline: 'Kayan ışıltı',
    rarity: 'epic',
    emoji: '✨',
    motion: true,
  },
  {
    id: 'disko',
    name: 'Disko',
    tagline: 'Renk dansı',
    rarity: 'epic',
    emoji: '🪩',
    motion: true,
  },
]

export const SKIN_IDS: BlockSkinId[] = BLOCK_SKINS.map((skin) => skin.id)

const WEIGHT: Record<BlockSkin['rarity'], number> = {
  common: 3,
  rare: 2,
  epic: 1,
}

const SKIN_PALETTES: Partial<Record<BlockSkinId, string[]>> = {
  meyve: ['#E11D48', '#FACC15', '#7C3AED', '#F97316', '#2563EB', '#22C55E', '#FB7185'],
  altin: ['#F5D76E', '#E0B422', '#C9A227', '#FFE566', '#A67C00'],
  gumus: ['#F8FAFC', '#E2E8F0', '#94A3B8', '#CBD5E1', '#64748B'],
  rgb: ['#FF2D55', '#00C8FF', '#7CFF4A', '#FF8A1F', '#A855FF', '#FFE14A'],
}

export function getSkin(id: string): BlockSkin {
  return BLOCK_SKINS.find((skin) => skin.id === id) ?? BLOCK_SKINS[0]!
}

export function isSkinId(id: string): id is BlockSkinId {
  return SKIN_IDS.includes(id as BlockSkinId)
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

export function colorsForSkin(skin: BlockSkinId, stagePalette: string[]): string[] {
  return SKIN_PALETTES[skin] ?? stagePalette
}

export function rollBlockSkin(
  owned: BlockSkinId[],
  equipped: BlockSkinId,
  _rng: () => number = Math.random,
): BlockSkinId {
  if (owned.includes(equipped)) return equipped
  return owned[0] ?? 'neon'
}

export type BoxResult =
  | { ok: true; progress: Progress; drop: BlockSkin; duplicate: boolean }
  | { ok: false; error: string }

export function openMysteryBox(progress: Progress, rng: () => number = Math.random): BoxResult {
  if (progress.coins < BOX_COST) {
    return { ok: false, error: `Kutu ${BOX_COST}⚡ ister. Biraz daha patlat.` }
  }

  const owned = new Set(progress.skins)
  const pool = BLOCK_SKINS.filter((skin) => skin.id !== 'neon' && !owned.has(skin.id))
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
