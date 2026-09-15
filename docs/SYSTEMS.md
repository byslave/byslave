# Core systems

Each system below is a bounded module. Later phases enable presentation and AI; the domain contracts are defined now so content can be authored early.

## 1. Character creation

**Owns:** race pick, class pick, derived base attributes, starting equipment/abilities.

**Inputs:** `raceId`, `classId`, optional name.
**Outputs:** a `Player` with attributes, resources, skill bar, empty quest log.

Race bonuses are small passives. Class defines combat resource, weapon style, and the ability list. Creation math lives in `createCharacter()` so the title scene cannot accidentally apply bonuses twice.

## 2. Stats

**Owns:** primary attributes, derived stats, modifier stack.

Primary: Strength, Dexterity, Intelligence, Vitality, Luck.
Derived: HP, Mana, Stamina, Attack Damage, Defense, Crit Chance, Crit Damage, Movement Speed.

Modifiers come from race, class, level, equipment, and temporary buffs. The calculator is data-driven (`content/catalog/formulas.json`). Adding a stat means adding a catalog entry and a formula, then reading it by id.

Buffs are `{ stat, op: add|mul, value, sourceId, expiresAt? }`. Equipment is just a set of sourced modifiers.

## 3. Combat

**Owns:** targeting, ability use, resource spend, damage, death.

Real-time. The player has:

- basic attack (weapon style from class)
- 3–4 class abilities
- dodge (stamina)
- potion (inventory quick-slot)

Hit resolution is domain-only:

1. spend resource if the action allows it
2. roll accuracy (v1: melee in range always hits unless dodging)
3. compute damage from formulas + crit
4. apply to target HP
5. emit `combat.hit` / `combat.killed`

Presentation plays animations from those events. It does not decide whether a goblin died.

## 4. Enemy AI

**Owns:** behavior profiles, aggro, attack patterns.

Enemies do not subclass a unique AI class each. They reference a `behaviorId`:

| Id | Used by | Pattern |
| --- | --- | --- |
| `pack_lunge` | Wolf | Close in, periodic lunge, leash |
| `skirmish` | Goblin | Hit, backstep, flee under 25% HP |
| `aggressive_melee` | Goblin Warrior, Bandit | Commit, occasional heavy attack |
| `slow_relentless` | Skeleton | Walk in, swing, ignore kite somewhat |
| `kiting_ranged` | Skeleton Archer | Keep distance band, shoot, reposition |
| `backline_caster` | Necromancer | Strafe, bolt, summon at HP thresholds |
| `boss_phased` | Dungeon Boss | Phase list with telegraphs |

AI reads world snapshots (player position, own HP) and emits intents (`move`, `attack`, `ability`). CombatSystem executes intents.

## 5. Inventory and equipment

**Owns:** grid, gold, equip slots, use/drop/sell.

Slots: Weapon, Helmet, Chest, Gloves, Boots, Ring, Amulet.

Items are definitions (`ItemDef`) plus instances (`ItemInstance`). Consumables stack. Equipment does not.

Equip flow: check slot + level requirement → move previous item to grid → apply modifiers → emit `item.equipped`.

Comparison is a pure function: `compareItems(a, b, player)` returns per-stat deltas for the UI.

## 6. Loot

**Owns:** rolling loot tables for enemies, chests, quests.

A table has guaranteed drops plus weighted entries. Luck can bias rarity. LootSystem listens to `combat.killed` and `chest.opened`, rolls with seeded RNG, and pushes `ItemInstance`s into a pickup list. Presentation spawns sparkles; domain already decided the item.

No affix generator in v1. Tables reference concrete item ids. Affixes can later wrap `ItemDef` without changing callers.

## 7. Progression

**Owns:** XP, level-up, attribute growth, skill unlocks.

XP sources: kills, quests, optional explore bonuses.
On level-up: HP/Mana/Stamina refill, formula recompute, unlock abilities whose `unlockLevel` was reached.

The player should feel stronger after a dungeon because both **level formulas** and **loot power** scale, not because of hidden multipliers in random systems.

## 8. Quests

**Owns:** active/completed logs, objective progress, rewards.

Objective types (discriminated union):

- `kill` — enemy id + count
- `collect` — item id + count
- `talk` — npc id
- `escort` — npc id + destination location
- `explore` — location id
- `boss` — enemy id
- `deliver` — item id + npc id

QuestSystem listens to combat/inventory/world/dialogue events and updates matching objectives. When all complete, it can auto-complete or wait for a turn-in NPC (`turnInNpcId`).

## 9. NPC and dialogue

**Owns:** interaction verbs, dialogue runner, simple relationship value.

NPC roles: `quest`, `shop`, `healer`, `inn`, `info`.

Dialogue is a tree of nodes with optional choices and `actions`. The runner is data-driven; game logic is the action list, not string parsing.

Relationship is 0–100, changed by actions. v1 uses it only for extra lines and prices, not a dating sim.

## 10. World / locations

**Owns:** region graph, current location, exits, flags, discovery.

Locations: Oakvale Village, Darkwood Forest, Goblin Cave, Ancient Ruins, Forgotten Graveyard, Blackthorn Castle.

Oakvale contains: spawn, blacksmith, general store, quest NPC, healer, inn.

World flags gate exits (castle road locked until Chapter 5) without hardcoding if-else in the scene.

## 11. Save / load

**Owns:** serialize domain snapshot, migrate versions, write locally.

Saves: level, XP, stats, equipment, inventory, gold, quests, world flags, position.

Does not save sprite instances or joystick state.

## 12. Mobile UI

**Owns:** HUD layout, screens (inventory, character, dialogue), touch buttons.

See [MOBILE_UX.md](MOBILE_UX.md). UI reads domain snapshots; buttons dispatch intents.

## System registry by phase

| Phase | Systems that must run |
| --- | --- |
| 1 | Movement, Camera |
| 2 | + Combat (player only, dummy target ok) |
| 3 | + AI |
| 4 | + Stats, Progression |
| 5 | + Inventory, Equipment |
| 6 | + Loot |
| 7 | + Quests |
| 8 | + Dialogue, NPC roles |
| 9 | + World travel |
| 10 | + Dungeon encounters, Boss |
| 11 | + Save/Load |
| 12 | HUD polish, Capacitor, perf |
| 13 | Remaining story content (mostly JSON) |
| 14 | Bugs, juice, balance |

Unused systems can exist as domain modules (they already do) without being registered in `GameSession`.
