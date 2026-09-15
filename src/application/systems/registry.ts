/**
 * Systems registered after Phase 1 append here. Do not replace MovementSystem.
 *
 * Phase 2  CombatSystem
 * Phase 3  AiSystem
 * Phase 4  ProgressionSystem (XP is already a domain function)
 * Phase 5  InventorySystem
 * Phase 6  LootSystem
 * Phase 7  QuestSystem
 * Phase 8  DialogueSystem / NpcSystem
 * Phase 9  TravelSystem
 * Phase 10 EncounterSystem / BossSystem
 * Phase 11 SaveSystem
 */
export const FUTURE_SYSTEM_IDS = [
  "combat",
  "ai",
  "progression",
  "inventory",
  "loot",
  "quests",
  "dialogue",
  "travel",
  "encounters",
  "save",
] as const;
