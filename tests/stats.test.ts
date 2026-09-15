import { describe, expect, it } from "vitest";
import { loadCatalog } from "@/content/loadCatalog";
import { createPlayer } from "@/domain/character/createCharacter";
import { computeStats } from "@/domain/stats/computeStats";
import { addXp } from "@/domain/stats/xp";

const catalog = loadCatalog();

describe("stats and progression", () => {
  it("applies race bonuses once at creation", () => {
    const human = createPlayer(catalog, { raceId: "human", classId: "warrior" });
    const orc = createPlayer(catalog, { raceId: "orc", classId: "warrior" });
    expect(human.attributes.luck).toBe(5);
    expect(orc.attributes.strength).toBe(10);
    expect(orc.derived.attackDamage).toBeGreaterThan(human.derived.attackDamage);
    expect(human.derived.xpGain).toBeCloseTo(1.05);
  });

  it("lets every class start with a viable resource pool", () => {
    for (const classDef of catalog.classes) {
      const player = createPlayer(catalog, { raceId: "human", classId: classDef.id });
      expect(player.derived.hpMax).toBeGreaterThan(40);
      expect(player.derived.movementSpeed).toBeGreaterThan(150);
      expect(player.hp).toBe(player.derived.hpMax);
    }
  });

  it("grows derived stats with level", () => {
    const player = createPlayer(catalog, { raceId: "dwarf", classId: "paladin" });
    const higher = computeStats({
      catalog,
      race: catalog.race("dwarf"),
      classDef: catalog.class("paladin"),
      level: 10,
      attributes: player.attributes,
      equipped: { weapon: catalog.item(player.equipment.weapon!.itemId) },
    });
    expect(higher.hpMax).toBeGreaterThan(player.derived.hpMax);
  });

  it("levels from XP using the catalog curve", () => {
    const { base, growth } = catalog.formulas.xpPerLevel;
    const result = addXp(1, 0, 1000, 1, catalog.formulas.levelCap, base, growth);
    expect(result.level).toBeGreaterThan(1);
    expect(result.levelsGained).toBeGreaterThan(0);
  });
});
