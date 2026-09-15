import racesJson from "@content/characters/races.json";
import classesJson from "@content/characters/classes.json";
import abilitiesJson from "@content/characters/abilities.json";
import itemsJson from "@content/items/items.json";
import lootJson from "@content/items/loot-tables.json";
import enemiesJson from "@content/combat/enemies.json";
import behaviorsJson from "@content/combat/ai-behaviors.json";
import locationsJson from "@content/world/locations.json";
import npcsJson from "@content/npcs/npcs.json";
import dialogueJson from "@content/npcs/dialogue.json";
import questsJson from "@content/quests/quests.json";
import formulasJson from "@content/catalog/formulas.json";
import type { Catalog } from "./Catalog";
import {
  abilitySchema,
  behaviorSchema,
  classSchema,
  dialogueTreeSchema,
  enemySchema,
  itemSchema,
  locationSchema,
  lootTableSchema,
  npcSchema,
  questSchema,
  raceSchema,
  type FormulasConfig,
} from "./schema";

function indexById<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((entry) => [entry.id, entry]));
}

function must<T>(map: Map<string, T>, id: string, kind: string): T {
  const value = map.get(id);
  if (!value) throw new Error(`Unknown ${kind}: ${id}`);
  return value;
}

export function loadCatalog(): Catalog {
  const races = raceSchema.array().parse(racesJson);
  const classes = classSchema.array().parse(classesJson);
  const abilities = abilitySchema.array().parse(abilitiesJson);
  const items = itemSchema.array().parse(itemsJson);
  const lootTables = lootTableSchema.array().parse(lootJson);
  const enemies = enemySchema.array().parse(enemiesJson);
  const behaviors = behaviorSchema.array().parse(behaviorsJson);
  const locations = locationSchema.array().parse(locationsJson);
  const npcs = npcSchema.array().parse(npcsJson);
  const quests = questSchema.array().parse(questsJson);
  const dialogue = Object.fromEntries(
    Object.entries(dialogueJson).map(([id, tree]) => [id, dialogueTreeSchema.parse(tree)]),
  );
  const formulas = formulasJson as FormulasConfig;

  const raceMap = indexById(races);
  const classMap = indexById(classes);
  const itemMap = indexById(items);
  const enemyMap = indexById(enemies);
  const locationMap = indexById(locations);
  const npcMap = indexById(npcs);
  const questMap = indexById(quests);
  const abilityMap = indexById(abilities);
  const lootMap = indexById(lootTables);

  return {
    races,
    classes,
    abilities,
    items,
    lootTables,
    enemies,
    behaviors,
    locations,
    npcs,
    dialogue,
    quests,
    formulas,
    race: (id) => must(raceMap, id, "race"),
    class: (id) => must(classMap, id, "class"),
    item: (id) => must(itemMap, id, "item"),
    enemy: (id) => must(enemyMap, id, "enemy"),
    location: (id) => must(locationMap, id, "location"),
    npc: (id) => must(npcMap, id, "npc"),
    quest: (id) => must(questMap, id, "quest"),
    ability: (id) => must(abilityMap, id, "ability"),
    lootTable: (id) => must(lootMap, id, "loot table"),
    dialogueTree: (id) => {
      const tree = dialogue[id];
      if (!tree) throw new Error(`Unknown dialogue tree: ${id}`);
      return tree;
    },
  };
}
