import { describe, expect, it } from "vitest";
import { Rng } from "@/core/Rng";
import { resolveAttack, resolveHit, abilityMod } from "@/domain/combat/dice";
import { Inventory, compareItems } from "@/domain/inventory/Inventory";
import { loadCatalog } from "@/content/loadCatalog";
import { OAKVALE_ROWS, TILE_SIZE } from "@/content/oakvaleMap";
import { rollLoot } from "@/domain/loot/rollLoot";
import { QuestLog } from "@/domain/quests/QuestLog";
import { DialogueRunner } from "@/domain/dialogue/DialogueRunner";
import { serializeSave } from "@/domain/save/SaveGame";
import { createPlayer } from "@/domain/character/createCharacter";
import { GameSession } from "@/application/GameSession";
import { blocked } from "@/domain/world/WorldState";

const catalog = loadCatalog();

class SeqRng extends Rng {
  private values: number[];
  constructor(values: number[]) {
    super(1);
    this.values = values;
  }
  int(): number {
    const next = this.values.shift();
    if (next === undefined) throw new Error("rng exhausted");
    return next;
  }
}

describe("d20 combat", () => {
  it("treats a natural 1 as a fumble and a 20 as a crit", () => {
    const miss = resolveAttack(
      { attackBonus: 10, armorClass: 10, damageDice: "1d8", damageBonus: 2 },
      new SeqRng([1]),
    );
    expect(miss.fumble).toBe(true);
    expect(miss.hit).toBe(false);
    expect(miss.damage).toBe(0);

    const crit = resolveAttack(
      { attackBonus: 0, armorClass: 99, damageDice: "1d8", damageBonus: 2 },
      new SeqRng([20, 5, 6]),
    );
    expect(crit.crit).toBe(true);
    expect(crit.hit).toBe(true);
    expect(crit.damage).toBe(5 + 6 + 2);
  });

  it("hits when d20 + bonus meets AC", () => {
    const hit = resolveAttack(
      { attackBonus: 4, armorClass: 13, damageDice: "1d6", damageBonus: 1 },
      new SeqRng([12, 3]),
    );
    expect(hit.hit).toBe(true);
    expect(hit.damage).toBe(4);
    expect(abilityMod(8)).toBe(2);
  });

  it("still exposes resolveHit for older callers", () => {
    const swing = resolveHit({ attack: 8, defense: 3 }, new SeqRng([15, 4]));
    expect(swing.damage).toBeGreaterThanOrEqual(0);
  });
});

describe("inventory", () => {
  it("stacks potions and compares gear", () => {
    const bag = Inventory.empty(5, 6);
    expect(bag.add({ instanceId: "a", itemId: "health_potion", qty: 2 }, catalog.item("health_potion"))).toBe(true);
    expect(bag.add({ instanceId: "b", itemId: "health_potion", qty: 1 }, catalog.item("health_potion"))).toBe(true);
    expect(bag.count("health_potion")).toBe(3);
    const delta = compareItems(catalog.item("iron_sword"), catalog.item("oak_training_blade"));
    expect(delta.attackDamage).toBeGreaterThan(0);
  });
});

describe("loot", () => {
  it("always drops the warden's castle key", () => {
    const result = rollLoot(catalog, "loot_warden", new Rng(3), 5);
    expect(result.items.some((item) => item.itemId === "castle_key")).toBe(true);
    expect(result.gold).toBeGreaterThan(0);
  });
});

describe("quests and dialogue", () => {
  it("tracks kill objectives and completes turn-in quests", () => {
    const log = new QuestLog();
    const quest = catalog.quest("quest_wolves");
    log.accept(quest);
    for (let i = 0; i < 5; i += 1) log.handleKill(catalog.quests, "wolf");
    const active = log.active.find((q) => q.questId === "quest_wolves");
    expect(active?.status).toBe("readyToTurnIn");
    expect(log.turnIn(quest)).toBe(true);
    expect(log.completed).toContain("quest_wolves");
  });

  it("emits giveQuest from Mira's help line", () => {
    const runner = new DialogueRunner(catalog.dialogueTree("dlg_mira"));
    const actions = runner.choose(0);
    expect(actions.some((action) => action.type === "giveQuest" && action.questId === "quest_wolves")).toBe(true);
  });
});

describe("save snapshot", () => {
  it("serializes player, gear, quests, and flags", () => {
    const player = createPlayer(catalog, { raceId: "elf", classId: "mage" });
    const save = serializeSave(player, {
      flags: { heard_malrik_name: true },
      discovered: ["oakvale"],
      active: [],
      completed: ["quest_wolves"],
    });
    expect(save.version).toBe(1);
    expect(save.player.classId).toBe("mage");
    expect(save.world.flags.heard_malrik_name).toBe(true);
    expect(JSON.parse(JSON.stringify(save)).player.locationId).toBe("oakvale");
  });
});

describe("pixel town", () => {
  it("is a compact tile map with aligned rows", () => {
    expect(new Set(OAKVALE_ROWS.map((row) => row.length))).toEqual(new Set([28]));
    const oakvale = catalog.location("oakvale");
    expect(oakvale.width).toBe(28 * TILE_SIZE);
    expect(oakvale.places.map((p) => p.id)).toEqual(
      expect.arrayContaining(["blacksmith", "store", "elder", "healer", "inn", "square"]),
    );
  });

  it("moves the adventurer, blocks walls, and can reach the north gate", () => {
    const session = new GameSession({ raceId: "human", classId: "ranger" });
    const startX = session.player.x;
    session.setMoveIntent(1, 0);
    session.update(0.25);
    expect(session.player.x).toBeGreaterThan(startX);

    const oakvale = catalog.location("oakvale");
    const wall = oakvale.collision[0];
    expect(blocked(wall.x + 2, wall.y + 2, 6, oakvale)).toBe(true);

    const walker = new GameSession({ raceId: "human", classId: "ranger" });
    walker.setMoveIntent(0, -1);
    for (let i = 0; i < 160; i += 1) walker.update(0.05);
    expect(walker.world.exitHint).toMatch(/Darkwood Forest/);
  });

  it("starts a d20 fight when walking into the wolf", () => {
    const session = new GameSession({ raceId: "orc", classId: "warrior", seed: 9 });
    const wolf = session.world.encounters[0];
    session.player.x = wolf.x;
    session.player.y = wolf.y;
    session.update(0.016);
    expect(session.world.combat?.enemyId).toBe("wolf");
    session.attack();
    const logged = session.world.combat?.log.some((line) => line.startsWith("You:"));
    const finished = Boolean(session.world.banner?.includes("falls"));
    expect(logged || finished).toBe(true);
  });
});
