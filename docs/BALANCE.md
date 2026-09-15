# Balance

All races and classes must be viable. Nobody should be a joke pick. Numbers favor **clarity over simulation**.

## Race passives (net ~+2 primaries)

| Race | Attributes | Passive |
| --- | --- | --- |
| Human | +2 Luck | +5% XP |
| Elf | +2 Dex, +1 Int, −1 Vit | +8% max mana |
| Dwarf | +2 Vit, +1 Str, −1 Dex | +8% defense |
| Orc | +2 Str, +1 Vit, −1 Int | +6% attack, −10% max mana |

Humans level a bit faster. Elves excel at caster/ranger. Dwarves survive. Orcs hit hard and pay in mana (hurts Mage/Paladin slightly, still playable).

## Class bases (primaries sum to 25)

| Class | STR | DEX | INT | VIT | LUK | Style | Resource |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Warrior | 8 | 4 | 2 | 8 | 3 | Melee | Stamina |
| Rogue | 4 | 8 | 3 | 5 | 5 | Melee | Stamina |
| Mage | 2 | 4 | 9 | 5 | 5 | Caster | Mana |
| Ranger | 4 | 8 | 4 | 5 | 4 | Ranged | Stamina |
| Paladin | 7 | 3 | 5 | 7 | 3 | Hybrid | Hybrid |

## Intended roles

- **Warrior** — safest melee, high HP, simplest buttons. Weak vs kiting archers until gap-close (Charge at 6).
- **Rogue** — highest crit, dodge-centric. Squishy if you facetank.
- **Mage** — best burst and AoE. Lowest HP. Blink is the “dodge.”
- **Ranger** — safest kiting. Weaker in tiny cave corridors.
- **Paladin** — self-heal and steady melee. Lower DPS than Warrior/Mage.

No class should clear Chapter 5 more than ~30% faster if the player is competent. Tune in Phase 14 with a simple kill-time pass on the Warden.

## Derived formulas (see `content/catalog/formulas.json`)

- HP grows mostly from Vitality
- Physical attack from Strength + weapon
- Ranger weapons use Dexterity as the attack stat
- Spells use Intelligence
- Crit from Dexterity and Luck, capped
- Dodge stamina cost is class-shared so mobile muscle memory stays consistent

## Ability unlocks

Levels **1 / 3 / 6 / 10**. Prototype cap **20**.

Do not add a fifth ability in v1. Four buttons plus attack/dodge/potion is already a full right-hand cluster.

## Loot power budget

| Rarity | Typical extra vs common |
| --- | --- |
| Uncommon | +15–25% |
| Rare | +35–50% |
| Epic | +60–80% |
| Legendary | +100% and a unique modifier |

Area level gates loot. Oakvale chests should not drop legendary castle plate.

## Economy

Vendors pay ~40% of `value`. Potions are the gold sink. Repair does not exist in v1 (less UI).
