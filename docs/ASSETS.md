# Art pipeline

Code-drawn 32×32 blobs were a placeholder. They will never look like a shippable pixel RPG. Art is now a **data swap**, not a renderer rewrite.

## How we do assets

Three stages. Stay on the current stage until the gameplay for that map is done.

| Stage | What you drop in | When |
| --- | --- | --- |
| **1. Prototype (now)** | CC0 packs in `public/assets/kenney/` | Town, combat, quests can move |
| **2. Swap** | Better PNGs + `content/assets/manifest.json` | A pack or commission lands |
| **3. Ship** | Unique walk cycles, wolf, portraits | After the loop is fun |

Do **not** paint new tiles or heroes in TypeScript. Do **not** generate one-off AI images into the repo as production art. Change the manifest (frame index, tint, or file URL). Combat, movement, and quests must not care which PNG is on disk.

## Current prototype pack

Kenney CC0, packed 16×16, nearest-neighbor, camera zoom 4.

| File | Pack | Used for |
| --- | --- | --- |
| `public/assets/kenney/tiny-town.png` | [Tiny Town 1.1](https://kenney.nl/assets/tiny-town) | Grass, path, trees, roofs, walls, doors, well |
| `public/assets/kenney/tiny-dungeon.png` | [Tiny Dungeon 1.0](https://kenney.nl/assets/tiny-dungeon) | 20 race×class combos, NPCs, well-beast |

License: Creative Commons Zero. Credit Kenney / [kenney.nl](https://kenney.nl) (optional; we still do).

The mapping lives in `content/assets/manifest.json`:

- `heroes.<race>_<class>` → dungeon frame + race tint
- `npcs.<id>` → dungeon frame
- `enemies.wolf` → dungeon frame (see stand-in note below)
- `tiles.*` → town frame indices, including stone vs wood houses

`src/content/townTiles.ts` picks roof / wall / door from neighbors. `BootScene` loads both sheets. `WorldScene` only places frames. The create-screen canvas crops the same dungeon sheet.

## How to replace a sprite

**Change which tile to use** (no new file):

```json
"human_mage": { "sheet": "dungeon", "frame": 84, "tint": "#ffffff" }
```

**Drop a custom PNG** (same 16×16 grid, or a single frame sheet):

1. Put the file in `public/assets/` (keep Kenney files; do not overwrite them).
2. Add a sheet entry under `sheets` (`frameWidth` / `frameHeight` / `columns`).
3. Point the hero / NPC / enemy / tile at that sheet + frame.
4. Reload. Do not touch `CombatSystem` or `oakvaleMap` collision.

**Tint** is multiply. Human stays `#ffffff`. Elf / dwarf / orc use a light tint so the class pose stays readable.

## Honest limits of this pack

Tiny Dungeon is a **static** character sheet. There are no 4-direction walk cycles and no wolf.

| Gap | Prototype | Ship art |
| --- | --- | --- |
| Walk | 1px bob + flip-X | 4-dir, 2–4 frames per class |
| Races | Class pose + tint | Distinct elf / dwarf / orc silhouettes |
| Wolf | Frame 120 (brown beast) | Real wolf (itch pack or commission) |
| Houses | Kenney roof + wall autotile | Custom Oakvale buildings |

When you buy or commission a pack, keep the 16×16 grid if you can. Then the camera, collision, and HUD stay the same.

## Buying later (not this PR)

Good itch / Kenney follow-ups that match this camera:

- A 16×16 RPG character pack with walk cycles (one sheet per class, or one per race×class)
- A forest/town expansion with a wolf
- One commissioned 20-pose hero sheet if budget allows

Until then: play on Kenney, iterate rules, swap files when art arrives.
