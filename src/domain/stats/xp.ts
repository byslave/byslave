export function xpToNext(level: number, base: number, growth: number): number {
  return Math.round(base * level ** growth);
}

export function addXp(
  level: number,
  xp: number,
  gained: number,
  xpGainMul: number,
  levelCap: number,
  base: number,
  growth: number,
): { level: number; xp: number; levelsGained: number } {
  let currentLevel = level;
  let currentXp = xp + Math.round(gained * xpGainMul);
  let levelsGained = 0;
  while (currentLevel < levelCap) {
    const need = xpToNext(currentLevel, base, growth);
    if (currentXp < need) break;
    currentXp -= need;
    currentLevel += 1;
    levelsGained += 1;
  }
  return { level: currentLevel, xp: currentXp, levelsGained };
}
