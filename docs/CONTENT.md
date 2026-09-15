# Content bible — The Blackthorn Curse

Small, finished first version. Five chapters, a handful of quests, six locations.

## Premise

Strange creatures raid villages on the kingdom’s northern border. Abandoned **Blackthorn Castle** has lights in its towers again. The adventurer traces the blight to a necromancer using an ancient artifact — the **Blackthorn Heart** — to wake the dead and poison the woods.

## Region: Northmarch

```
                    Blackthorn Castle
                           ▲
                           │  (flag: castle_road_open)
                 Forgotten Graveyard
                           ▲
                           │
                    Ancient Ruins
                           ▲
                           │
Oakvale Village ◄──── Darkwood Forest ────► Goblin Cave
```

### Oakvale Village

Starting town. Kenney Tiny Town tiles, dirt path through the square, tree-line border. Heroes and NPCs come from Tiny Dungeon frames (see `docs/ASSETS.md`).

| Place | Who |
| --- | --- |
| Village square spawn | Player |
| Blacksmith | Brann Ironkettle |
| General store | Lila Reed |
| Elder’s hall | Elder Mira (main quest) |
| Shrine | Sister Anwen (healer) |
| The Hearthed Stag inn | Tomas Vale (rest, rumors) |
| Palisade | Captain Durn (info, later escort) |

### Darkwood Forest

Twisted oaks, wolves, goblin scouts, corrupted groves. Hub to cave and ruins.

### Goblin Cave

Linear-ish cavern, goblins + goblin warrior, villager captive.

### Ancient Ruins

Broken stone circles, first skeletons, lore on the Heart.

### Forgotten Graveyard

Archer skeletons, necromantic fog, locked castle gate.

### Blackthorn Castle

Courtyard, hall, sanctum. Dungeon boss then necromancer.

## NPCs (v1)

| Id | Name | Role |
| --- | --- | --- |
| `mira` | Elder Mira | Main quest giver |
| `brann` | Brann Ironkettle | Blacksmith shop |
| `lila` | Lila Reed | General store |
| `anwen` | Sister Anwen | Healer |
| `tomas` | Tomas Vale | Inn / rumors |
| `durn` | Captain Durn | Info, escort quest |
| `sela` | Sela the Trapper | Darkwood, explore/collect |
| `ewan` | Ewan | Captive villager (escort) |
| `malrik` | Malrik the Hollow | Antagonist, boss dialogue |

## Chapters and quests

Do not explode this list. Each quest must work.

### Chapter 1 — Embers in Oakvale

1. **Wolves at the Gate** (`quest_wolves`) — Talk to Mira, kill 5 wolves near the palisade, return.
2. **Iron and Ash** (`quest_iron`) — Deliver Mira’s report to Brann (deliver item).

### Chapter 2 — The Darkwood Sickens

3. **Into the Trees** (`quest_darkwood`) — Explore Darkwood Forest.
4. **Blight Samples** (`quest_samples`) — Collect 4 blighted hearts (wolf/goblin drop) and bring them to Sela.

### Chapter 3 — Caves Below

5. **Goblin Nest** (`quest_cave`) — Kill 8 goblins in the cave (any goblin type).
6. **The Missing Miller** (`quest_escort`) — Find Ewan, escort him to Oakvale.

### Chapter 4 — Quiet of the Grave

7. **Stone Memory** (`quest_ruins`) — Explore Ancient Ruins, talk to the inscribed shade (NPC `shade`).
8. **Bones of the Garrison** (`quest_graveyard`) — Kill 6 skeletons in the Forgotten Graveyard.

### Chapter 5 — The Blackthorn Curse

9. **Open the Gate** (`quest_gate`) — Defeat the Dungeon Boss (Blackthorn Warden) who holds the castle key.
10. **Heart of Night** (`quest_heart`) — Defeat Malrik the Hollow, the necromancer.

Side activity (optional, one only): **Bandits on the Road** (`quest_bandits`) — kill 4 bandits in Darkwood, gold from Durn.

## Enemies (prototype roster)

Wolf, Goblin, Goblin Warrior, Bandit, Skeleton, Skeleton Archer, Necromancer, Dungeon Boss (Blackthorn Warden). Malrik uses the necromancer kit with a unique id `malrik_boss` so the final fight can tune independently.

## Tone

Classic D&D-adjacent: earnest, a little grim, not parody. Dialogue short enough to tap through on a bus. No romance tracks in v1.
