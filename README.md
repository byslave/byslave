# The Blackthorn Curse

Single-player medieval fantasy RPG for mobile, built so a small indie team (or one developer with AI assistance) can ship a polished prototype without rewriting the game every phase.

**Current milestone:** architecture, data models, content catalog, domain kernel, and Phase 1 playable movement.

## Why this stack

| Choice | Reason |
| --- | --- |
| TypeScript | Best fit for AI-assisted development and strict data models |
| Phaser 3 | 2D top-down action RPG, touch input, mobile export path |
| Vite | Fast browser iteration on a phone or desktop |
| JSON content | Designers (and future you) can add items/quests without touching combat code |
| Capacitor later | Native Android/iOS wrap in Phase 12 — same pattern already used in this org |

This is **not** Unity/Godot. Those engines are valid, but they are heavier for AI-assisted iteration in a browser. The domain layer is engine-agnostic: if the project later moves, combat/quests/saves can move with it.

## Play now

```bash
npm install
npm test
npm run dev
```

Open the local URL on a phone or in a desktop browser. Drag the left stick to move. The camera follows the adventurer through Oakvale Village.

## Project map

```
docs/          Architecture, systems, models, roadmap
content/       Authorable JSON (races, classes, items, quests, world)
src/domain/    Pure game rules (no renderer)
src/application/  Wires systems together
src/presentation/ Phaser scenes, input, HUD
src/content/   Catalog loader + Zod schemas
tests/         Domain and content validation
```

Start here:

1. [Architecture](docs/ARCHITECTURE.md)
2. [Core systems](docs/SYSTEMS.md)
3. [Data models](docs/DATA_MODELS.md)
4. [Dependencies](docs/DEPENDENCIES.md)
5. [Roadmap](docs/ROADMAP.md)
6. [Content bible](docs/CONTENT.md)
7. [Balance](docs/BALANCE.md)
8. [Mobile UI](docs/MOBILE_UX.md)

## What this first version is

A **foundation**, not the finished RPG.

- The world, story, classes, enemies, and quests are specified as data.
- Combat, inventory, quests, and saves have domain APIs and tests.
- Phase 1 is playable: character, movement, camera, Oakvale layout.
- Phases 2–14 are intentionally unimplemented in the renderer.

## Hard constraints

- No multiplayer
- No procedural open world
- No always-online services
- Stay playable after every phase
