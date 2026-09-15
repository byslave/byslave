import type { ItemInstance, Vec2 } from "./types";

export interface GameEvents {
  "player.moved": { x: number; y: number; locationId: string };
  "player.died": { locationId: string };
  "player.leveledUp": { level: number };
  "player.statsChanged": Record<string, never>;
  "combat.hit": {
    attackerId: string;
    targetId: string;
    damage: number;
    crit: boolean;
  };
  "combat.killed": { killerId: string; targetId: string; enemyId: string };
  "ability.used": { actorId: string; abilityId: string };
  "item.looted": { items: ItemInstance[]; gold: number };
  "item.equipped": { slot: string; itemId: string };
  "item.unequipped": { slot: string; itemId: string };
  "item.used": { itemId: string };
  "quest.accepted": { questId: string };
  "quest.objectiveUpdated": { questId: string; objectiveId: string; current: number };
  "quest.completed": { questId: string };
  "dialogue.started": { treeId: string; npcId: string };
  "dialogue.ended": { treeId: string };
  "npc.interacted": { npcId: string };
  "location.entered": { locationId: string };
  "world.flagSet": { flag: string; value: boolean | number | string };
  "save.requested": Record<string, never>;
  "save.loaded": { locationId: string };
  "intent.move": Vec2;
}

export type GameEventName = keyof GameEvents;
