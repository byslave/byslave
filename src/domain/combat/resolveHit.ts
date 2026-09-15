import type { Rng } from "@/core/Rng";

export interface HitInput {
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
  power?: number;
}

export interface HitResult {
  damage: number;
  crit: boolean;
}

export function resolveHit(input: HitInput, rng: Rng): HitResult {
  const power = input.power ?? 1;
  const mitigated = Math.max(1, input.attack * power - input.defense * 0.4);
  const crit = rng.next() < input.critChance;
  const damage = Math.max(1, Math.round(mitigated * (crit ? input.critDamage : 1)));
  return { damage, crit };
}

export function canSpend(
  current: number,
  cost: number,
): boolean {
  return current >= cost;
}
