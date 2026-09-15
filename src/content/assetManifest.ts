import { z } from "zod";
import manifestJson from "@content/assets/manifest.json";

const sheetSchema = z.object({
  key: z.string(),
  url: z.string(),
  frameWidth: z.number(),
  frameHeight: z.number(),
  columns: z.number(),
});

const spriteRefSchema = z.object({
  sheet: z.string(),
  frame: z.number(),
  tint: z.string().optional(),
  note: z.string().optional(),
});

const houseStyleSchema = z.object({
  roofL: z.number(),
  roofM: z.number(),
  roofR: z.number(),
  wall: z.number(),
  window: z.number(),
  door: z.number(),
});

export const assetManifestSchema = z.object({
  version: z.number(),
  credit: z.string(),
  sheets: z.object({
    town: sheetSchema,
    dungeon: sheetSchema,
  }),
  tiles: z.object({
    grass: z.array(z.number()).min(1),
    path: z.number(),
    gate: z.number(),
    tree: z.array(z.number()).min(1),
    border: z.array(z.number()).min(1),
    well: z.number(),
    stone: houseStyleSchema,
    wood: houseStyleSchema,
  }),
  heroes: z.record(z.string(), spriteRefSchema),
  npcs: z.record(z.string(), spriteRefSchema),
  enemies: z.record(z.string(), spriteRefSchema),
});

export type AssetManifest = z.infer<typeof assetManifestSchema>;
export type SpriteRef = z.infer<typeof spriteRefSchema>;
export type SheetDef = z.infer<typeof sheetSchema>;
export type HouseStyle = z.infer<typeof houseStyleSchema>;

export const assetManifest: AssetManifest = assetManifestSchema.parse(manifestJson);

export function heroKey(raceId: string, classId: string): string {
  return `${raceId}_${classId}`;
}

export function lookupHero(raceId: string, classId: string): SpriteRef {
  const key = heroKey(raceId, classId);
  return assetManifest.heroes[key] ?? assetManifest.heroes.human_warrior;
}

export function lookupNpc(npcId: string): SpriteRef {
  return assetManifest.npcs[npcId] ?? { sheet: "dungeon", frame: 86, tint: "#ffffff" };
}

export function lookupEnemy(enemyId: string): SpriteRef {
  return assetManifest.enemies[enemyId] ?? { sheet: "dungeon", frame: 123, tint: "#ffffff" };
}

export function sheetByName(name: string): SheetDef {
  if (name === "town") return assetManifest.sheets.town;
  if (name === "dungeon") return assetManifest.sheets.dungeon;
  throw new Error(`Unknown sheet: ${name}`);
}

export function hexToTint(hex: string | undefined): number {
  if (!hex || hex.toLowerCase() === "#ffffff") return 0xffffff;
  return Number.parseInt(hex.replace("#", ""), 16);
}
