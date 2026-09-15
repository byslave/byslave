import { describe, expect, it } from "vitest";
import { Rng } from "@/core/Rng";
import { resolveHit } from "@/domain/combat/resolveHit";
import { Inventory, compareItems } from "@/domain/inventory/Inventory";
import { loadCatalog } from "@/content/loadCatalog";
import { rollLoot } from "@/domain/loot/rollLoot";
import { QuestLog } from "@/domain/quests/QuestLog";
import { DialogueRunner } from "@/domain/dialogue/DialogueRunner";
import { serializeSave } from "@/domain/save/SaveGame";
import { createPlayer } from "@/domain/character/createCharacter";
import { GameSession } from "@/application/GameSession";
import { blocked } from "@/domain/world/WorldState";

const catalog = loadCatalog();

describe("combat", () => {
  it("always deals at least 1 damage and can crit", () => {
    const miss = resolveHit(
      { attack: 8, defense: 3, critChance: 0, critDamage: 2, power: 1 },
      new Rng(1),
    );
    expect(miss.damage).toBeGreaterThanOrEqual(1);
    expect(miss.crit).toBe(false);

    const crit = resolveHit(
      { attack: 8, defense: 3, critChance: 1, critDamage: 2, power: 1 },
      new Rng(1),
    );
    expect(crit.crit).toBe(true);
    expect(crit.damage).toBeGreaterThan(miss.damage);
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

describe("phase 1 movement", () => {
  it("moves the adventurer and stops on buildings", () => {
    const session = new GameSession({ raceId: "human", classId: "ranger" });
    const startX = session.player.x;
    session.setMoveIntent(1, 0);
    session.update(0.25);
    expect(session.player.x).toBeGreaterThan(startX);

    const oakvale = catalog.location("oakvale");
    const inn = oakvale.collision.find((r) => r.w === 190 && r.h === 150)!;
    expect(blocked(inn.x + 20, inn.y + 20, 16, oakvale)).toBe(true);
    expect(blocked(startX, session.player.y, 16, oakvale)).toBe(false);

    session.player.x = 700;
    session.player.y = 80;
    session.setMoveIntent(0, 0);
    session.update(0.05);
    expect(session.world.exitHint).toMatch(/Darkwood Forest/);

    const walker = new GameSession({ raceId: "human", classId: "ranger" });
    walker.setMoveIntent(0, -1);
    for (let i = 0; i < 120; i += 1) walker.update(0.05);
    expect(walker.player.y).toBeLessThan(160);
    expect(walker.world.exitHint).toMatch(/Darkwood Forest/);
  });
});
