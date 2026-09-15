import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/content/loadCatalog";

const catalog = loadCatalog();

describe("content catalog", () => {
  it("loads the four races and five classes", () => {
    expect(catalog.races.map((r) => r.id)).toEqual(["human", "elf", "dwarf", "orc"]);
    expect(catalog.classes.map((c) => c.id)).toEqual([
      "warrior",
      "rogue",
      "mage",
      "ranger",
      "paladin",
    ]);
  });

  it("keeps class primary attributes on a shared budget", () => {
    for (const classDef of catalog.classes) {
      const total = Object.values(classDef.baseAttributes).reduce((a, b) => a + b, 0);
      expect(total).toBe(25);
      expect(classDef.abilityIds).toHaveLength(4);
    }
  });

  it("gives every race a small net primary bonus", () => {
    for (const race of catalog.races) {
      const net = Object.values(race.attributeBonuses).reduce((a, b) => a + b, 0);
      expect(net).toBe(2);
    }
  });

  it("includes the prototype enemy roster", () => {
    expect(catalog.enemies.map((e) => e.id)).toEqual([
      "wolf",
      "goblin",
      "goblin_warrior",
      "bandit",
      "skeleton",
      "skeleton_archer",
      "necromancer",
      "blackthorn_warden",
      "malrik_boss",
    ]);
  });

  it("connects the six Northmarch locations", () => {
    const ids = catalog.locations.map((l) => l.id);
    expect(ids).toEqual([
      "oakvale",
      "darkwood",
      "goblin_cave",
      "ancient_ruins",
      "forgotten_graveyard",
      "blackthorn_castle",
    ]);
    const oakvale = catalog.location("oakvale");
    expect(oakvale.places.map((p) => p.id)).toEqual(
      expect.arrayContaining(["blacksmith", "store", "elder", "healer", "inn", "square"]),
    );
    expect(oakvale.exits[0]?.toLocationId).toBe("darkwood");
    expect(catalog.location("forgotten_graveyard").exits.some((e) => e.requiredFlag === "castle_road_open")).toBe(true);
  });

  it("covers every quest objective type", () => {
    const types = new Set(catalog.quests.flatMap((q) => q.objectives.map((o) => o.type)));
    expect([...types].sort()).toEqual(
      ["boss", "collect", "deliver", "escort", "explore", "kill", "talk"].sort(),
    );
  });

  it("references only known items, enemies, and npcs", () => {
    for (const table of catalog.lootTables) {
      for (const entry of table.entries) catalog.item(entry.itemId);
    }
    for (const enemy of catalog.enemies) {
      catalog.lootTable(enemy.lootTableId);
    }
    for (const npc of catalog.npcs) {
      catalog.location(npc.locationId);
      catalog.dialogueTree(npc.dialogueTreeId);
    }
    for (const quest of catalog.quests) {
      catalog.npc(quest.giverNpcId);
    }
  });
});
