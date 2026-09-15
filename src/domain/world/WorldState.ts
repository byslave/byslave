import type { Catalog } from "@/content/Catalog";
import type { LocationDef } from "@/content/schema";
import type { Player } from "@/domain/character/createCharacter";
import { QuestLog } from "@/domain/quests/QuestLog";
import type { Rect, WorldFlagValue } from "@/core/types";
import { OAKVALE_MARKERS } from "@/content/oakvaleMap";

export interface Encounter {
  id: string;
  enemyId: string;
  x: number;
  y: number;
  alive: boolean;
}

export interface CombatState {
  encounterId: string;
  enemyId: string;
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  turn: "player" | "enemy";
  log: string[];
}

export class WorldState {
  player: Player;
  flags: Record<string, WorldFlagValue> = {};
  discovered: string[] = ["oakvale"];
  quests = new QuestLog();
  moveIntent = { x: 0, y: 0 };
  exitHint: string | null = null;
  banner: string | null = null;
  combat: CombatState | null = null;
  encounters: Encounter[] = [
    { id: "oakvale_wolf", enemyId: "wolf", x: OAKVALE_MARKERS.wolf.x, y: OAKVALE_MARKERS.wolf.y, alive: true },
  ];
  enemyTurnIn = 0;

  constructor(player: Player) {
    this.player = player;
  }

  location(catalog: Catalog): LocationDef {
    return catalog.location(this.player.locationId);
  }

  setFlag(flag: string, value: WorldFlagValue): void {
    this.flags[flag] = value;
  }

  hasFlag(flag: string): boolean {
    return Boolean(this.flags[flag]);
  }
}

export function circleHitsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function blocked(x: number, y: number, radius: number, location: LocationDef): boolean {
  if (x - radius < 0 || y - radius < 0 || x + radius > location.width || y + radius > location.height) {
    return true;
  }
  return location.collision.some((rect) => circleHitsRect(x, y, radius, rect));
}
