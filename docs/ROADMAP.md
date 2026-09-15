# Development roadmap

Implement **one phase at a time**. After each phase the game must boot, accept touch/mouse input, and remain playable. Do not rewrite working systems to make the next phase easier.

Playable means: from `npm run dev`, a player can enter the world and perform the phase’s verbs without a black screen or crash.

## PHASE 1 — Character + movement + camera  ✅ current

**Verbs:** move, camera follow.
**Map:** Oakvale Village collision + labeled places.
**Acceptance:**

- Adventurer spawns at the village spawn point
- Virtual joystick moves the body; keyboard WASD works for desktop testing
- Camera follows with light lerp
- Buildings block movement
- HUD chrome exists (bars/buttons may be inert)

## PHASE 2 — Basic combat

**Verbs:** basic attack, dodge, spend stamina.
**Acceptance:**

- Dummy or wolf can take damage and die
- Attack button fires a melee/ranged strike based on class style
- Dodge grants brief i-frames and costs stamina
- Player death restarts at spawn (temporary; inn come later)

Do not build a full ability kit yet. One strike + dodge is enough.

## PHASE 3 — Enemy AI

**Verbs:** enemies aggro, attack, use their behavior profile.
**Acceptance:**

- Wolf, Goblin, and Skeleton behave differently in Darkwood or a test paddock
- Enemies leash back if the player runs far
- No enemy should stand still and teleport-hit

## PHASE 4 — Stats, XP, leveling

**Verbs:** gain XP, level up, see attributes.
**Acceptance:**

- Character screen shows primary + derived stats
- Kills grant XP from enemy defs
- Level-up increases derived stats via formulas.json
- Race/class bonuses apply once at creation and persist

## PHASE 5 — Inventory + equipment

**Verbs:** pick up, equip, unequip, drop, compare, sort.
**Acceptance:**

- 7 equipment slots
- Grid inventory readable on a phone
- Equipping a weapon changes attack damage
- Level requirements block equip

## PHASE 6 — Loot

**Verbs:** corpses and chests roll loot tables.
**Acceptance:**

- Luck slightly biases rarity
- Gold drops
- Same enemy can drop different items across kills (seeded RNG)

## PHASE 7 — Quest system

**Verbs:** accept, track, complete, reward.
**Acceptance:**

- At least one kill quest and one talk quest work end-to-end
- Tracker updates without opening a menu
- Rewards grant XP, gold, items through existing systems

## PHASE 8 — NPC + dialogue

**Verbs:** talk, shop, heal, rest.
**Acceptance:**

- Oakvale NPCs use JSON trees
- Blacksmith/general store buy/sell
- Healer restores HP/Mana
- Inn rest + later save hook

## PHASE 9 — World map + locations

**Verbs:** walk to exits, load the destination, spawn at the linked point.
**Acceptance:**

- All six locations exist as maps (simple geometry is fine)
- Mini-map shows current location name
- Castle exit can be flag-gated

## PHASE 10 — Dungeons + bosses

**Verbs:** cave/ruins/graveyard/castle encounters, boss phases.
**Acceptance:**

- Goblin Cave and Blackthorn Castle have encounter zones
- Dungeon Boss uses `boss_phased`
- Death in a dungeon returns to location spawn, not the whole campaign

## PHASE 11 — Save / load

**Verbs:** continue after closing the tab/app.
**Acceptance:**

- Snapshot includes player, gear, inventory, gold, quests, flags, position
- Reload restores the same location and HP
- Version field present for future migrations

## PHASE 12 — Mobile UI + optimization

**Verbs:** same game, readable and stable on a real phone.
**Acceptance:**

- Ability buttons, potion, bars, tracker all usable with thumbs
- Object pooling for enemies/projectiles
- Capacitor Android wrap
- 30+ FPS on a mid-range phone in Oakvale + forest

## PHASE 13 — Main story and content

**Verbs:** play The Blackthorn Curse chapters 1–5.
**Acceptance:**

- JSON quests/dialogue cover the five chapters in [CONTENT.md](CONTENT.md)
- Each class can finish the short campaign
- No missing turn-ins or broken flags

## PHASE 14 — Polish and bug fixing

**Verbs:** juice, balance, copy, audio.
**Acceptance:**

- Class viability pass (see [BALANCE.md](BALANCE.md))
- Readable rarity colors
- No blockers on the critical path
- Known issues listed instead of silent failures

## Definition of done for the prototype

A player can create a character, fight through the six locations, finish the necromancer chapter, and resume from a save — on a phone — without multiplayer or procedural maps.

Until then, keep the architecture boring and the content files authoritative.
