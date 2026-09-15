# Data models

Source of truth for types: `src/content/schema.ts` and `src/domain/**`.
Source of truth for values: `content/**/*.json`.

This document is the human-readable map of those files.

## Identifiers

All content uses stable string ids (`human`, `warrior`, `iron_sword`, `oakvale`).
Runtime instances add a generated `instanceId` (items, buffs, escorts).

## Stats

```ts
type PrimaryStat = "strength" | "dexterity" | "intelligence" | "vitality" | "luck";

type DerivedStat =
  | "hpMax" | "manaMax" | "staminaMax"
  | "attackDamage" | "defense"
  | "critChance" | "critDamage"
  | "movementSpeed"
  | "xpGain";

type StatId = PrimaryStat | DerivedStat | string;

type StatMap = Record<string, number>;

type ModifierOp = "add" | "mul";

interface Modifier {
  stat: StatId;
  op: ModifierOp;
  value: number;
  sourceId: string;
}
```

`mul` is a fraction (`0.08` = +8%). Applied after `add` in the formula pipeline.

Unknown stats are legal. The catalog lists known ones for UI and validation, but `StatMap` stays open so a later `fireResist` does not require a type rewrite.

## Race

```ts
interface RaceDef {
  id: string;
  name: string;
  description: string;
  attributeBonuses: Partial<Record<PrimaryStat, number>>;
  passives: { id: string; name: string; description: string }[];
  modifiers: Modifier[];
}
```

Bonuses are small. Net primary points per race stay near +2.

## Class

```ts
interface ClassDef {
  id: string;
  name: string;
  description: string;
  combatStyle: "melee" | "ranged" | "caster" | "hybrid";
  resource: "stamina" | "mana" | "hybrid";
  baseAttributes: Record<PrimaryStat, number>;
  baseHp: number;
  baseMana: number;
  baseStamina: number;
  baseAttack: number;
  baseDefense: number;
  baseCritChance: number;
  baseSpeed: number;
  startingWeaponId: string;
  abilityIds: string[];
  strengths: string[];
  weaknesses: string[];
}
```

All five classes sum to the same primary total (25) before race bonuses.

## Ability

```ts
interface AbilityDef {
  id: string;
  name: string;
  description: string;
  classId: string;
  unlockLevel: number;
  cooldownMs: number;
  resource: "stamina" | "mana" | "none";
  cost: number;
  range: number;
  kind: "strike" | "projectile" | "aoe" | "buff" | "dash" | "heal";
  power: number;
  effects?: { type: string; durationMs?: number; value?: number }[];
}
```

## Item

```ts
type EquipSlot = "weapon" | "helmet" | "chest" | "gloves" | "boots" | "ring" | "amulet";
type ItemType = EquipSlot | "consumable" | "quest" | "material";
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface ItemDef {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  slot?: EquipSlot;
  rarity: Rarity;
  levelRequirement: number;
  stats: StatMap;
  value: number;
  stackable?: boolean;
  maxStack?: number;
}

interface ItemInstance {
  instanceId: string;
  itemId: string;
  qty: number;
}
```

## Loot table

```ts
interface LootEntry {
  itemId: string;
  weight: number;
  minQty?: number;
  maxQty?: number;
}

interface LootTableDef {
  id: string;
  guaranteed?: { itemId: string; qty: number }[];
  rolls: number;
  entries: LootEntry[];
  gold?: { min: number; max: number };
}
```

## Enemy

```ts
interface EnemyDef {
  id: string;
  name: string;
  level: number;
  attributes: Record<PrimaryStat, number>;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  behaviorId: string;
  lootTableId: string;
  tags: string[];
  attackPattern: {
    telegraphMs: number;
    recoverMs: number;
    range: number;
    abilityId?: string;
  };
}
```

Bosses use `tags: ["boss"]` and `behaviorId: "boss_phased"` plus a `phases` array.

## Quest

```ts
type QuestObjective =
  | { id: string; type: "kill"; enemyId: string; count: number; description: string }
  | { id: string; type: "collect"; itemId: string; count: number; description: string }
  | { id: string; type: "talk"; npcId: string; description: string }
  | { id: string; type: "escort"; npcId: string; toLocationId: string; description: string }
  | { id: string; type: "explore"; locationId: string; description: string }
  | { id: string; type: "boss"; enemyId: string; description: string }
  | { id: string; type: "deliver"; itemId: string; npcId: string; description: string };

interface QuestDef {
  id: string;
  title: string;
  description: string;
  chapterId: string;
  type: QuestObjective["type"];
  giverNpcId: string;
  turnInNpcId?: string;
  objectives: QuestObjective[];
  rewards: { xp: number; gold: number; itemIds?: string[] };
  nextQuestId?: string;
  requiredFlags?: string[];
  setFlagsOnComplete?: string[];
}
```

Runtime quest log stores `{ questId, status, progress: Record<objectiveId, number> }`.

## Dialogue

```ts
interface DialogueChoice {
  text: string;
  nextId: string | null;
  requiredFlags?: string[];
  actions?: DialogueAction[];
}

interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  nextId?: string | null;
  choices?: DialogueChoice[];
  actions?: DialogueAction[];
}

type DialogueAction =
  | { type: "giveQuest"; questId: string }
  | { type: "completeObjective"; questId: string; objectiveId: string }
  | { type: "openShop"; shopId: string }
  | { type: "heal" }
  | { type: "rest" }
  | { type: "giveItem"; itemId: string; qty?: number }
  | { type: "setFlag"; flag: string; value: boolean | number | string }
  | { type: "adjustRelationship"; npcId: string; delta: number };
```

## NPC

```ts
interface NpcDef {
  id: string;
  name: string;
  title: string;
  locationId: string;
  role: "quest" | "shop" | "healer" | "inn" | "info";
  dialogueTreeId: string;
  shopId?: string;
  marker: { x: number; y: number };
}
```

## World

```ts
interface ExitDef {
  id: string;
  toLocationId: string;
  toSpawnId: string;
  rect: { x: number; y: number; w: number; h: number };
  requiredFlag?: string;
}

interface LocationDef {
  id: string;
  name: string;
  kind: "village" | "forest" | "cave" | "ruins" | "graveyard" | "castle";
  width: number;
  height: number;
  spawnPoints: Record<string, { x: number; y: number }>;
  collision: { x: number; y: number; w: number; h: number }[];
  exits: ExitDef[];
  encounterTableId?: string;
  tint: number;
}
```

## Player and save

```ts
interface PlayerState {
  name: string;
  raceId: string;
  classId: string;
  level: number;
  xp: number;
  attributes: Record<PrimaryStat, number>;
  hp: number;
  mana: number;
  stamina: number;
  gold: number;
  position: { locationId: string; x: number; y: number };
}

interface SaveGame {
  version: 1;
  savedAt: number;
  player: PlayerState;
  equipment: Partial<Record<EquipSlot, ItemInstance | null>>;
  inventory: { width: number; height: number; cells: (ItemInstance | null)[] };
  quests: { active: QuestProgress[]; completed: string[] };
  world: { flags: Record<string, boolean | number | string>; discovered: string[] };
}
```

Increment `version` and add a migrator when the snapshot shape changes.

## Adding a new stat later

1. Add the id to `content/catalog/stats.json`
2. Add a formula in `content/catalog/formulas.json` if it is derived
3. Optionally show it on the character screen list (UI reads the catalog)
4. Items/races can already put it in `stats` / `modifiers` maps

No combat rewrite required unless the *rule* for how the stat is used is new (for example a brand-new damage school).
