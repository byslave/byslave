import type { Rng } from "@/core/Rng";

export function abilityMod(score: number): number {
  return Math.floor((score - 4) / 2);
}

export function proficiencyBonus(level: number): number {
  return 1 + Math.ceil(level / 4);
}

export interface DiceRoll {
  notation: string;
  rolls: number[];
  bonus: number;
  total: number;
}

const DICE_RE = /^(\d+)d(\d+)([+-]\d+)?$/i;

export function parseDice(notation: string): { count: number; sides: number; bonus: number } {
  const match = notation.replace(/\s/g, "").match(DICE_RE);
  if (!match) throw new Error(`Bad dice notation: ${notation}`);
  return {
    count: Number(match[1]),
    sides: Number(match[2]),
    bonus: match[3] ? Number(match[3]) : 0,
  };
}

export function rollDice(notation: string, rng: Rng): DiceRoll {
  const parsed = parseDice(notation);
  const rolls = Array.from({ length: parsed.count }, () => rng.int(1, parsed.sides));
  const sum = rolls.reduce((a, b) => a + b, 0);
  return {
    notation,
    rolls,
    bonus: parsed.bonus,
    total: sum + parsed.bonus,
  };
}

export interface AttackInput {
  attackBonus: number;
  armorClass: number;
  damageDice: string;
  damageBonus: number;
}

export interface AttackResult {
  d20: number;
  attackBonus: number;
  total: number;
  ac: number;
  hit: boolean;
  crit: boolean;
  fumble: boolean;
  damage: number;
  damageRoll: DiceRoll | null;
  text: string;
}

export function resolveAttack(input: AttackInput, rng: Rng): AttackResult {
  const d20 = rng.int(1, 20);
  const total = d20 + input.attackBonus;
  const fumble = d20 === 1;
  const crit = d20 === 20;
  const hit = !fumble && (crit || total >= input.armorClass);

  let damage = 0;
  let damageRoll: DiceRoll | null = null;
  if (hit) {
    damageRoll = rollDice(input.damageDice, rng);
    damage = Math.max(1, damageRoll.total + input.damageBonus);
    if (crit) {
      const extra = rollDice(input.damageDice, rng);
      damage += extra.rolls.reduce((a, b) => a + b, 0);
      damageRoll = {
        ...damageRoll,
        rolls: [...damageRoll.rolls, ...extra.rolls],
        total: damageRoll.total + extra.rolls.reduce((a, b) => a + b, 0),
      };
    }
  }

  const vs = `${d20}${input.attackBonus >= 0 ? "+" : ""}${input.attackBonus}=${total} vs AC ${input.armorClass}`;
  let text: string;
  if (fumble) text = `Nat 1 miss (${vs})`;
  else if (crit) text = `Nat 20 crit! ${vs} → ${damage} dmg`;
  else if (hit) text = `Hit ${vs} → ${damage} dmg`;
  else text = `Miss ${vs}`;

  return {
    d20,
    attackBonus: input.attackBonus,
    total,
    ac: input.armorClass,
    hit,
    crit,
    fumble,
    damage,
    damageRoll,
    text,
  };
}

export function resolveHit(
  input: { attack: number; defense: number; critChance?: number; critDamage?: number; power?: number },
  rng: Rng,
): { damage: number; crit: boolean } {
  const result = resolveAttack(
    {
      attackBonus: Math.round(input.attack / 2),
      armorClass: 10 + Math.round(input.defense / 2),
      damageDice: "1d8",
      damageBonus: Math.round((input.power ?? 1) + input.attack * 0.15),
    },
    rng,
  );
  return { damage: result.hit ? result.damage : 0, crit: result.crit };
}
