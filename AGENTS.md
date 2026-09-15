# Agent rules for The Blackthorn Curse

This repository is a **data-driven, modular, single-player mobile RPG**.
Future coding sessions must follow these rules.

## Scope

- Single-player only. No multiplayer, accounts, or online services.
- Predefined interconnected maps only. No procedural open-world generation.
- Keep the first version small and playable. Do not add hundreds of quests.

## Architecture

- Domain code (`src/domain`) must never import Phaser or DOM APIs.
- Gameplay rules live in domain systems. Phaser is presentation only.
- Systems talk through `EventBus` + typed `GameEvents`. Do not reach across systems.
- Content lives in `content/**/*.json`. Prefer editing JSON over rewriting logic.
- New stats, items, enemies, quests, and dialogue should be content changes first.
- Pixel art is a file + `content/assets/manifest.json` swap. Do not paint new tiles or heroes in TypeScript (`docs/ASSETS.md`).

## Development loop

- Implement one roadmap phase at a time (`docs/ROADMAP.md`).
- After each phase the game must still boot and remain playable.
- Do not rewrite working systems unless a phase cannot proceed otherwise.
- Add or update tests next to any domain rule you change.

## Mobile

- Touch-first controls. Keep HUD readable on a phone-sized screen.
- Do not design desktop-only UI as the primary layout.
