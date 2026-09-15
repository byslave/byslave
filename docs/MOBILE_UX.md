# Mobile UI

Designed for a phone in portrait first. Landscape is a later stretch goal, not a requirement for the prototype.

## Control layout (thumbs)

```
┌─────────────────────────────┐
│  HP ████  MP/SP ████   Mini │
│  Quest tracker (2 lines)    │
│                             │
│           WORLD             │
│                             │
│  (joystick)        [A1][A2] │
│                    [A3][A4] │
│                    [ATK]    │
│                 [DGE] [POT] │
└─────────────────────────────┘
```

- Left lower: virtual stick, ~120px, never under the quest tracker
- Right lower: attack (largest), dodge, potion, 2×2 ability grid
- Top: bars + location mini-map
- Safe-area padding for notches (`env(safe-area-inset-*)`)

Hit targets ≥ 48×48 CSS pixels. Ability icons use color + shape, not tiny text.

## Screens

| Screen | Purpose |
| --- | --- |
| Title | New / Continue |
| Character create | Race then class, short bonuses |
| World HUD | Combat + tracker |
| Inventory | 5×6 grid, rarity border, compare tooltip |
| Character | Attributes, abilities, XP bar |
| Dialogue | Speaker name, body, up to 3 choices |
| Pause | Save hint, options (later) |

Only one modal at a time. Combat pauses when inventory or dialogue is open in v1 (simpler, fewer bugs). Revisit if it feels too soft.

## Inventory (phone)

- Tap to select, tap Equip / Unequip / Drop / Compare
- Sort: rarity, type, name
- Selected item vs equipped slot shown as green/red stat deltas
- Sell only while a shop is open (flag on the inventory view)

## Readability

- Dark parchment HUD, light text
- Rarity: grey / green / blue / purple / gold
- Body text ≥ 16px, dialogue ≥ 18px
- Do not put damage numbers smaller than 14px

## Input mapping (desktop test only)

WASD move, Space dodge, J attack, 1–4 abilities, Q potion, I inventory, C character, Esc pause.

Desktop bindings must not be required for any acceptance test on device.
