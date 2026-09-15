import { describe, expect, it } from "vitest";
import { assetManifest, heroKey, lookupHero, lookupNpc } from "@/content/assetManifest";
import { loadCatalog } from "@/content/loadCatalog";
import { townFrameAt } from "@/content/townTiles";
import { frameSourceRect } from "@/presentation/pixel/atlas";

const catalog = loadCatalog();

describe("asset manifest", () => {
  it("covers every race×class combo", () => {
    for (const race of catalog.races) {
      for (const klass of catalog.classes) {
        const key = heroKey(race.id, klass.id);
        expect(assetManifest.heroes[key], key).toBeDefined();
        expect(lookupHero(race.id, klass.id).frame).toBeGreaterThanOrEqual(0);
      }
    }
    expect(Object.keys(assetManifest.heroes)).toHaveLength(catalog.races.length * catalog.classes.length);
  });

  it("maps Oakvale NPCs and the wolf to dungeon frames", () => {
    for (const npc of catalog.npcs.filter((n) => n.locationId === "oakvale")) {
      expect(lookupNpc(npc.id).frame).toBeGreaterThanOrEqual(0);
    }
    expect(assetManifest.enemies.wolf.frame).toBe(120);
  });

  it("keeps both Kenney sheets on a 16×16 grid", () => {
    expect(assetManifest.sheets.town.frameWidth).toBe(16);
    expect(assetManifest.sheets.dungeon.frameWidth).toBe(16);
    expect(assetManifest.sheets.town.columns).toBe(12);
    expect(frameSourceRect(14, 12, 16, 16)).toEqual({ sx: 32, sy: 16, sw: 16, sh: 16 });
  });
});

describe("Oakvale town autotile", () => {
  it("uses stone roofs on the elder hall and wood on the smith", () => {
    expect(townFrameAt(3, 3)).toBe(assetManifest.tiles.stone.roofL);
    expect(townFrameAt(6, 3)).toBe(assetManifest.tiles.stone.roofR);
    expect(townFrameAt(4, 3)).toBe(assetManifest.tiles.stone.roofM);
    expect(townFrameAt(1, 7)).toBe(assetManifest.tiles.wood.roofL);
  });

  it("uses doors on D tiles and the well on o", () => {
    expect(townFrameAt(4, 5)).toBe(assetManifest.tiles.stone.door);
    expect(townFrameAt(2, 8)).toBe(assetManifest.tiles.wood.door);
    expect(townFrameAt(5, 12)).toBe(assetManifest.tiles.well);
  });

  it("keeps open yard as grass and the square road as path", () => {
    expect(assetManifest.tiles.grass).toContain(townFrameAt(8, 6));
    expect(townFrameAt(11, 10)).toBe(assetManifest.tiles.path);
  });
});
