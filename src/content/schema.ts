import { z } from "zod";

const modifierSchema = z.object({
  stat: z.string(),
  op: z.enum(["add", "mul"]),
  value: z.number(),
  sourceId: z.string(),
});

const attributesSchema = z.object({
  strength: z.number(),
  dexterity: z.number(),
  intelligence: z.number(),
  vitality: z.number(),
  luck: z.number(),
});

export const raceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  attributeBonuses: z.record(z.string(), z.number()),
  passives: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
    }),
  ),
  modifiers: z.array(modifierSchema),
});

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  combatStyle: z.enum(["melee", "ranged", "caster", "hybrid"]),
  resource: z.enum(["stamina", "mana", "hybrid"]),
  baseAttributes: attributesSchema,
  baseHp: z.number(),
  baseMana: z.number(),
  baseStamina: z.number(),
  baseAttack: z.number(),
  baseDefense: z.number(),
  baseCritChance: z.number(),
  baseSpeed: z.number(),
  startingWeaponId: z.string(),
  abilityIds: z.array(z.string()).min(3).max(4),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  dice: z.object({
    attackAbility: z.enum(["strength", "dexterity", "intelligence"]),
    damage: z.string(),
    acBonus: z.number(),
  }),
});

export const abilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  classId: z.string(),
  unlockLevel: z.number(),
  cooldownMs: z.number(),
  resource: z.enum(["stamina", "mana", "none"]),
  cost: z.number(),
  range: z.number(),
  kind: z.enum(["strike", "projectile", "aoe", "buff", "dash", "heal"]),
  power: z.number(),
  effects: z
    .array(
      z.object({
        type: z.string(),
        durationMs: z.number().optional(),
        value: z.number().optional(),
      }),
    )
    .optional(),
});

export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  slot: z
    .enum(["weapon", "helmet", "chest", "gloves", "boots", "ring", "amulet"])
    .optional(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  levelRequirement: z.number(),
  stats: z.record(z.string(), z.number()),
  value: z.number(),
  stackable: z.boolean().optional(),
  maxStack: z.number().optional(),
});

export const lootTableSchema = z.object({
  id: z.string(),
  guaranteed: z.array(z.object({ itemId: z.string(), qty: z.number() })).optional(),
  rolls: z.number(),
  entries: z.array(
    z.object({
      itemId: z.string(),
      weight: z.number(),
      minQty: z.number().optional(),
      maxQty: z.number().optional(),
    }),
  ),
  gold: z.object({ min: z.number(), max: z.number() }).optional(),
});

const attackPatternSchema = z.object({
  telegraphMs: z.number(),
  recoverMs: z.number(),
  range: z.number(),
  abilityId: z.string().optional(),
});

export const enemySchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  attributes: attributesSchema,
  hp: z.number(),
  attack: z.number(),
  defense: z.number(),
  speed: z.number(),
  xp: z.number(),
  behaviorId: z.string(),
  lootTableId: z.string(),
  tags: z.array(z.string()),
  attackPattern: attackPatternSchema,
  ac: z.number().optional(),
  attackBonus: z.number().optional(),
  damageDice: z.string().optional(),
  phases: z
    .array(z.object({ hpRatio: z.number(), notes: z.string() }))
    .optional(),
});

export const behaviorSchema = z.object({
  id: z.string(),
  name: z.string(),
  aggroRange: z.number(),
  leashRange: z.number(),
  preferredDistance: z.number(),
  notes: z.string(),
}).passthrough();

const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["village", "forest", "cave", "ruins", "graveyard", "castle"]),
  width: z.number(),
  height: z.number(),
  tint: z.number(),
  ground: z.string(),
  path: z.string(),
  spawnPoints: z.record(z.string(), z.object({ x: z.number(), y: z.number() })),
  places: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  ),
  collision: z.array(rectSchema),
  exits: z.array(
    z.object({
      id: z.string(),
      toLocationId: z.string(),
      toSpawnId: z.string(),
      rect: rectSchema,
      requiredFlag: z.string().optional(),
    }),
  ),
  encounterTableId: z.string().optional(),
});

export const npcSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  locationId: z.string(),
  role: z.enum(["quest", "shop", "healer", "inn", "info"]),
  dialogueTreeId: z.string(),
  shopId: z.string().optional(),
  marker: z.object({ x: z.number(), y: z.number() }),
});

const dialogueActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("giveQuest"), questId: z.string() }),
  z.object({
    type: z.literal("completeObjective"),
    questId: z.string(),
    objectiveId: z.string(),
  }),
  z.object({ type: z.literal("openShop"), shopId: z.string() }),
  z.object({ type: z.literal("heal") }),
  z.object({ type: z.literal("rest") }),
  z.object({ type: z.literal("giveItem"), itemId: z.string(), qty: z.number().optional() }),
  z.object({
    type: z.literal("setFlag"),
    flag: z.string(),
    value: z.union([z.boolean(), z.number(), z.string()]),
  }),
  z.object({
    type: z.literal("adjustRelationship"),
    npcId: z.string(),
    delta: z.number(),
  }),
]);

const dialogueNodeSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  text: z.string(),
  nextId: z.string().nullable().optional(),
  choices: z
    .array(
      z.object({
        text: z.string(),
        nextId: z.string().nullable(),
        requiredFlags: z.array(z.string()).optional(),
        actions: z.array(dialogueActionSchema).optional(),
      }),
    )
    .optional(),
  actions: z.array(dialogueActionSchema).optional(),
});

export const dialogueTreeSchema = z.object({
  id: z.string(),
  start: z.string(),
  nodes: z.array(dialogueNodeSchema),
});

const questObjectiveSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("kill"),
    enemyId: z.string(),
    count: z.number(),
    description: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("collect"),
    itemId: z.string(),
    count: z.number(),
    description: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("talk"),
    npcId: z.string(),
    description: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("escort"),
    npcId: z.string(),
    toLocationId: z.string(),
    description: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("explore"),
    locationId: z.string(),
    description: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("boss"),
    enemyId: z.string(),
    description: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("deliver"),
    itemId: z.string(),
    npcId: z.string(),
    description: z.string(),
  }),
]);

export const questSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  chapterId: z.string(),
  type: z.string(),
  giverNpcId: z.string(),
  turnInNpcId: z.string().optional(),
  objectives: z.array(questObjectiveSchema),
  rewards: z.object({
    xp: z.number(),
    gold: z.number(),
    itemIds: z.array(z.string()).optional(),
  }),
  nextQuestId: z.string().optional(),
  requiredFlags: z.array(z.string()).optional(),
  setFlagsOnComplete: z.array(z.string()).optional(),
});

export type RaceDef = z.infer<typeof raceSchema>;
export type ClassDef = z.infer<typeof classSchema>;
export type AbilityDef = z.infer<typeof abilitySchema>;
export type ItemDef = z.infer<typeof itemSchema>;
export type LootTableDef = z.infer<typeof lootTableSchema>;
export type EnemyDef = z.infer<typeof enemySchema>;
export type BehaviorDef = z.infer<typeof behaviorSchema>;
export type LocationDef = z.infer<typeof locationSchema>;
export type NpcDef = z.infer<typeof npcSchema>;
export type DialogueTreeDef = z.infer<typeof dialogueTreeSchema>;
export type DialogueAction = z.infer<typeof dialogueActionSchema>;
export type QuestDef = z.infer<typeof questSchema>;
export type QuestObjective = z.infer<typeof questObjectiveSchema>;
export type ModifierDef = z.infer<typeof modifierSchema>;

export interface FormulaPart {
  stat: string;
  per: number;
}

export interface StatFormula {
  base: string | number;
  adds: FormulaPart[];
}

export interface FormulasConfig {
  critChanceCap: number;
  inventory: { width: number; height: number };
  levelCap: number;
  xpPerLevel: { base: number; growth: number };
  formulas: Record<string, StatFormula>;
  attackStatByStyle: Record<string, string>;
}
