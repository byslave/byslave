export type PrimaryStat =
  | "strength"
  | "dexterity"
  | "intelligence"
  | "vitality"
  | "luck";

export const PRIMARY_STATS: PrimaryStat[] = [
  "strength",
  "dexterity",
  "intelligence",
  "vitality",
  "luck",
];

export type StatMap = Record<string, number>;
export type ModifierOp = "add" | "mul";

export interface Modifier {
  stat: string;
  op: ModifierOp;
  value: number;
  sourceId: string;
}

export type EquipSlot =
  | "weapon"
  | "helmet"
  | "chest"
  | "gloves"
  | "boots"
  | "ring"
  | "amulet";

export const EQUIP_SLOTS: EquipSlot[] = [
  "weapon",
  "helmet",
  "chest",
  "gloves",
  "boots",
  "ring",
  "amulet",
];

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ItemType = EquipSlot | "consumable" | "quest" | "material";
export type CombatStyle = "melee" | "ranged" | "caster" | "hybrid";
export type ResourceKind = "stamina" | "mana" | "hybrid" | "none";

export interface ItemInstance {
  instanceId: string;
  itemId: string;
  qty: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface QuestProgress {
  questId: string;
  status: "active" | "readyToTurnIn" | "completed";
  progress: Record<string, number>;
}

export type WorldFlagValue = boolean | number | string;
