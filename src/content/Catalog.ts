import type {
  AbilityDef,
  BehaviorDef,
  ClassDef,
  DialogueTreeDef,
  EnemyDef,
  FormulasConfig,
  ItemDef,
  LocationDef,
  LootTableDef,
  NpcDef,
  QuestDef,
  RaceDef,
} from "./schema";

export interface Catalog {
  races: RaceDef[];
  classes: ClassDef[];
  abilities: AbilityDef[];
  items: ItemDef[];
  lootTables: LootTableDef[];
  enemies: EnemyDef[];
  behaviors: BehaviorDef[];
  locations: LocationDef[];
  npcs: NpcDef[];
  dialogue: Record<string, DialogueTreeDef>;
  quests: QuestDef[];
  formulas: FormulasConfig;
  race(id: string): RaceDef;
  class(id: string): ClassDef;
  item(id: string): ItemDef;
  enemy(id: string): EnemyDef;
  location(id: string): LocationDef;
  npc(id: string): NpcDef;
  quest(id: string): QuestDef;
  ability(id: string): AbilityDef;
  lootTable(id: string): LootTableDef;
  dialogueTree(id: string): DialogueTreeDef;
}
