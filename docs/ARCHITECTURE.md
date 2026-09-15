# Architecture

## Goal

Ship a small, polished, **playable** single-player action RPG on phones. The code must stay modular so later phases add systems instead of rewriting them.

The first slice is not “the whole game.” It is a stable skeleton plus a playable pixel town: catalogs, typed models, d20 combat, and a 2D sprite for every race×class.

## Constraints that drive the design

- One developer + AI assistance, not a 20-person studio
- Touchscreen primary, desktop is only a development convenience
- Predefined region (six locations), not an open world
- Data-driven content so quests/items/dialogue change without combat rewrites
- After each roadmap phase the build must still boot and play

Out of scope forever for this prototype: multiplayer, procedural map generation, live-ops, trading, user accounts.

## Engine decision

**Presentation:** Phaser 3 (2D top-down).
**Rules:** TypeScript domain modules with no Phaser imports.
**Content:** JSON validated by Zod.
**Persistence:** versioned local JSON save (Phase 11).
**Native wrap:** Capacitor (Phase 12).

Top-down 2D is the cheapest readable combat style on a phone. Isometric and 3D add camera, animation, and art cost that a first prototype does not need.

## Layered architecture

Dependencies only point downward.

```
┌─────────────────────────────────────────┐
│ Presentation                            │
│ Phaser scenes, sprites, HUD, joystick   │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ Application                             │
│ GameSession, system registry, use-cases │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ Domain                                  │
│ stats, combat, inventory, loot, quests, │
│ dialogue, progression, world, save      │
└───────────────────┬─────────────────────┘
                    ▼
┌─────────────────────────────────────────┐
│ Content + Persistence                   │
│ JSON catalogs, flags, save snapshots    │
└─────────────────────────────────────────┘
```

Rules:

1. `src/domain` never imports from `src/presentation` or `phaser`.
2. Presentation may read domain state and send **intents** (Move, UseAbility). It does not compute damage, XP, or quest completion.
3. Systems do not call each other. They emit and listen on `EventBus`.
4. New gameplay content is a JSON change first. Code changes only when a new *rule* appears.

## Composition root

`GameSession` is the only object allowed to construct systems and inject shared services:

- `Catalog` — frozen content
- `EventBus` — typed events
- `Rng` — seeded random (combat, loot)
- `Time` — frame dt and game clock

This is a wiring object, not a god object. It does not contain combat formulas or quest if-statements.

## System pattern

Every gameplay system implements:

```ts
interface GameSystem {
  readonly id: string;
  bind(ctx: GameContext): void;
  update?(dt: number, ctx: GameContext): void;
  unbind?(): void;
}
```

- `bind` registers event listeners
- `update` is optional (combat and movement need it; quests often do not)
- Systems keep their own state. Shared mutable world state lives on `WorldState`

Phase 1 registers `MovementSystem` and `CameraIntent` only. Later phases **append** systems to the same registry. They do not replace movement.

## Event bus

Cross-system communication is explicit and typed. Examples:

| Event | Typical listeners |
| --- | --- |
| `combat.killed` | Loot, Quests, Progression |
| `item.equipped` | Stats, UI |
| `quest.completed` | Progression, Dialogue, World flags |
| `location.entered` | Quests (explore), Mini-map, Save |
| `npc.interacted` | Dialogue, Shops, Healing |

If two systems need a new relationship, add an event. Do not import one system into another.

## Data-driven by default

| If you want to add… | Change this |
| --- | --- |
| A stat | `content/catalog/stats.json` + a formula entry |
| A race/class | `content/characters/*.json` |
| An ability | `content/characters/abilities.json` |
| An item | `content/items/items.json` + loot table |
| An enemy | `content/combat/enemies.json` |
| A quest | `content/quests/quests.json` |
| Dialogue | `content/npcs/dialogue.json` |
| A location | `content/world/locations.json` |

Code should consume `Catalog` lookups by id (`"goblin"`, `"quest_wolves_at_the_gate"`). Never switch on English names.

## Folder structure

```
content/
  catalog/          stats, slots, rarities, formulas
  characters/       races, classes, abilities, progression
  items/            item definitions, loot tables
  combat/           enemies, AI behavior profiles
  world/            region graph, location layouts
  npcs/             NPC records, dialogue trees
  quests/           quests, story chapters
src/
  core/             EventBus, ids, rng, context
  domain/           pure rules, one folder per system
  content/          Zod schemas + catalog loader
  application/      GameSession + system registry
  presentation/     Phaser scenes, input, HUD, views
tests/              domain + content tests
docs/               this design
```

Keep presentation views (`PlayerView`) separate from domain entities (`Player`). The sprite is not the character.

## World representation

The campaign is one **region** with six **locations**. Each location is a bounded 2D map with:

- collision rects
- spawn point
- named exits to other locations
- NPC markers
- encounter zones (later phases)

Travel is door/path transitions, not a seamless open world. That keeps streaming, save, and quest “explore location” checks simple.

## Save philosophy

The save file is a **snapshot of domain state**, not Phaser sprites.

- Versioned (`version: 1`)
- Migrated with `src/domain/save/migrations.ts`
- Written on inn rest, location change, and explicit save
- Stored locally (web `localStorage`, later Capacitor Preferences)

## Extensibility hooks (without building them now)

These are designed so later phases do not rewrite the kernel:

- Stats are a string-keyed map plus a formula table
- Loot tables can later add affixes without changing `ItemDef`
- Quest objectives are a discriminated union; new types are additive
- AI is a behavior profile id, not a class hierarchy per enemy
- Dialogue actions are a small command list (`giveQuest`, `openShop`, `heal`, `setFlag`)

## What “modular” means here

Modular does **not** mean a plugin marketplace or ECS framework.

It means:

- one folder per system
- one JSON file per content kind
- events instead of hard references
- tests that run without booting Phaser

That is enough for a small indie RPG and cheap enough to maintain with AI assistance.
