import type { Catalog } from "@/content/Catalog";
import { nextId } from "@/core/ids";
import type { EquipSlot, ItemInstance, PrimaryStat, StatMap } from "@/core/types";
import { computeStats } from "@/domain/stats/computeStats";
import { Inventory } from "@/domain/inventory/Inventory";

export interface Player {
  name: string;
  raceId: string;
  classId: string;
  level: number;
  xp: number;
  attributes: Record<PrimaryStat, number>;
  derived: StatMap;
  hp: number;
  mana: number;
  stamina: number;
  gold: number;
  x: number;
  y: number;
  locationId: string;
  radius: number;
  facing: { x: number; y: number };
  equipment: Partial<Record<EquipSlot, ItemInstance | null>>;
  inventory: Inventory;
}

export function createPlayer(
  catalog: Catalog,
  options: { name?: string; raceId: string; classId: string },
): Player {
  const race = catalog.race(options.raceId);
  const classDef = catalog.class(options.classId);
  const spawn = catalog.location("oakvale").spawnPoints.default;

  const attributes = { ...classDef.baseAttributes };
  for (const [stat, bonus] of Object.entries(race.attributeBonuses)) {
    const key = stat as PrimaryStat;
    attributes[key] = (attributes[key] ?? 0) + bonus;
  }

  const startingWeapon: ItemInstance = {
    instanceId: nextId("item"),
    itemId: classDef.startingWeaponId,
    qty: 1,
  };
  const potions: ItemInstance = {
    instanceId: nextId("item"),
    itemId: "health_potion",
    qty: 3,
  };

  const equipment: Player["equipment"] = { weapon: startingWeapon };
  const equippedDefs = { weapon: catalog.item(startingWeapon.itemId) };
  const derived = computeStats({
    catalog,
    race,
    classDef,
    level: 1,
    attributes,
    equipped: equippedDefs,
  });

  const inventory = Inventory.empty(catalog.formulas.inventory.width, catalog.formulas.inventory.height);
  inventory.add(potions, catalog.item("health_potion"));

  return {
    name: options.name ?? "Adventurer",
    raceId: options.raceId,
    classId: options.classId,
    level: 1,
    xp: 0,
    attributes,
    derived,
    hp: derived.hpMax,
    mana: derived.manaMax,
    stamina: derived.staminaMax,
    gold: 20,
    x: spawn.x,
    y: spawn.y,
    locationId: "oakvale",
    radius: 6,
    facing: { x: 0, y: 1 },
    equipment,
    inventory,
  };
}

export function refreshDerived(catalog: Catalog, player: Player): void {
  const equippedDefs: Parameters<typeof computeStats>[0]["equipped"] = {};
  for (const [slot, inst] of Object.entries(player.equipment)) {
    if (inst) equippedDefs[slot as EquipSlot] = catalog.item(inst.itemId);
  }
  player.derived = computeStats({
    catalog,
    race: catalog.race(player.raceId),
    classDef: catalog.class(player.classId),
    level: player.level,
    attributes: player.attributes,
    equipped: equippedDefs,
  });
  player.hp = Math.min(player.hp, player.derived.hpMax);
  player.mana = Math.min(player.mana, player.derived.manaMax);
  player.stamina = Math.min(player.stamina, player.derived.staminaMax);
}
