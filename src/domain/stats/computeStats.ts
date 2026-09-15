import type { Catalog } from "@/content/Catalog";
import type { ClassDef, ItemDef, RaceDef } from "@/content/schema";
import type { EquipSlot, Modifier, PrimaryStat, StatMap } from "@/core/types";
import { EQUIP_SLOTS } from "@/core/types";

function resolveBase(base: string | number, classDef: ClassDef): number {
  if (typeof base === "number") return base;
  const table: Record<string, number> = {
    "class.baseHp": classDef.baseHp,
    "class.baseMana": classDef.baseMana,
    "class.baseStamina": classDef.baseStamina,
    "class.baseAttack": classDef.baseAttack,
    "class.baseDefense": classDef.baseDefense,
    "class.baseCritChance": classDef.baseCritChance,
    "class.baseSpeed": classDef.baseSpeed,
  };
  if (!(base in table)) throw new Error(`Unknown formula base: ${base}`);
  return table[base];
}

export interface ComputeStatsInput {
  catalog: Catalog;
  race: RaceDef;
  classDef: ClassDef;
  level: number;
  attributes: Record<PrimaryStat, number>;
  equipped: Partial<Record<EquipSlot, ItemDef | null>>;
  extraModifiers?: Modifier[];
}

export function sumEquipmentStats(
  equipped: Partial<Record<EquipSlot, ItemDef | null>>,
): { stats: StatMap; weaponAttack: number; armorDefense: number } {
  const stats: StatMap = {};
  let weaponAttack = 0;
  let armorDefense = 0;
  for (const slot of EQUIP_SLOTS) {
    const item = equipped[slot];
    if (!item) continue;
    for (const [key, value] of Object.entries(item.stats)) {
      stats[key] = (stats[key] ?? 0) + value;
    }
    if (slot === "weapon") weaponAttack += item.stats.attackDamage ?? 0;
    else armorDefense += item.stats.defense ?? 0;
  }
  return { stats, weaponAttack, armorDefense };
}

export function computeStats(input: ComputeStatsInput): StatMap {
  const { catalog, race, classDef, level, attributes, equipped } = input;
  const { formulas } = catalog.formulas;
  const gear = sumEquipmentStats(equipped);
  const attackStatKey = catalog.formulas.attackStatByStyle[classDef.combatStyle] ?? "strength";

  const lookup: StatMap = {
    ...attributes,
    level,
    attackStat: attributes[attackStatKey as PrimaryStat] ?? attributes.strength,
    weaponAttack: gear.weaponAttack,
    armorDefense: gear.armorDefense,
  };

  const derived: StatMap = { ...attributes, xpGain: 1 };

  for (const [statId, formula] of Object.entries(formulas)) {
    let value = resolveBase(formula.base, classDef);
    for (const part of formula.adds) {
      value += (lookup[part.stat] ?? derived[part.stat] ?? 0) * part.per;
    }
    if (gear.stats[statId]) value += gear.stats[statId];
    derived[statId] = value;
  }

  for (const [stat, value] of Object.entries(gear.stats)) {
    if (!(stat in formulas) && !(stat in derived)) {
      derived[stat] = (derived[stat] ?? 0) + value;
    } else if (!(stat in formulas)) {
      derived[stat] = (derived[stat] ?? 0) + value;
    }
  }

  const modifiers: Modifier[] = [
    ...race.modifiers,
    ...(input.extraModifiers ?? []),
  ];

  for (const mod of modifiers) {
    if (mod.op === "add") {
      derived[mod.stat] = (derived[mod.stat] ?? 0) + mod.value;
    }
  }
  for (const mod of modifiers) {
    if (mod.op === "mul") {
      derived[mod.stat] = (derived[mod.stat] ?? 0) * (1 + mod.value);
    }
  }

  if (typeof derived.critChance === "number") {
    derived.critChance = Math.min(catalog.formulas.critChanceCap, derived.critChance);
  }

  return derived;
}
