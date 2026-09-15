import type { Player } from "@/domain/character/createCharacter";
import type { QuestProgress, WorldFlagValue } from "@/core/types";

export const SAVE_VERSION = 1 as const;

export interface SaveGame {
  version: typeof SAVE_VERSION;
  savedAt: number;
  player: {
    name: string;
    raceId: string;
    classId: string;
    level: number;
    xp: number;
    attributes: Player["attributes"];
    hp: number;
    mana: number;
    stamina: number;
    gold: number;
    x: number;
    y: number;
    locationId: string;
  };
  equipment: Player["equipment"];
  inventory: {
    width: number;
    height: number;
    cells: Player["inventory"]["cells"];
  };
  quests: { active: QuestProgress[]; completed: string[] };
  world: { flags: Record<string, WorldFlagValue>; discovered: string[] };
}

export function serializeSave(player: Player, extra: {
  flags: Record<string, WorldFlagValue>;
  discovered: string[];
  active: QuestProgress[];
  completed: string[];
}): SaveGame {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    player: {
      name: player.name,
      raceId: player.raceId,
      classId: player.classId,
      level: player.level,
      xp: player.xp,
      attributes: player.attributes,
      hp: player.hp,
      mana: player.mana,
      stamina: player.stamina,
      gold: player.gold,
      x: player.x,
      y: player.y,
      locationId: player.locationId,
    },
    equipment: player.equipment,
    inventory: {
      width: player.inventory.width,
      height: player.inventory.height,
      cells: player.inventory.cells,
    },
    quests: { active: extra.active, completed: extra.completed },
    world: { flags: extra.flags, discovered: extra.discovered },
  };
}
