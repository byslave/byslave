import type { Catalog } from "@/content/Catalog";
import { loadCatalog } from "@/content/loadCatalog";
import { EventBus } from "@/core/EventBus";
import type { GameContext, GameSystem } from "@/core/GameContext";
import { Rng } from "@/core/Rng";
import { createPlayer, type Player } from "@/domain/character/createCharacter";
import { WorldState } from "@/domain/world/WorldState";
import { MovementSystem } from "./systems/MovementSystem";
import { CombatSystem } from "./systems/CombatSystem";

export class GameSession {
  readonly catalog: Catalog;
  readonly events = new EventBus();
  readonly rng: Rng;
  readonly world: WorldState;
  readonly systems: GameSystem[] = [];
  readonly combatSystem = new CombatSystem();

  constructor(options: { raceId: string; classId: string; name?: string; seed?: number }) {
    this.catalog = loadCatalog();
    this.rng = new Rng(options.seed ?? 1);
    const player = createPlayer(this.catalog, options);
    this.world = new WorldState(player);
    this.register(new MovementSystem());
    this.register(this.combatSystem);
  }

  get player(): Player {
    return this.world.player;
  }

  get context(): GameContext {
    return {
      catalog: this.catalog,
      events: this.events,
      rng: this.rng,
      world: this.world,
    };
  }

  register(system: GameSystem): void {
    this.systems.push(system);
    system.bind(this.context);
  }

  setMoveIntent(x: number, y: number): void {
    this.world.moveIntent = { x, y };
  }

  attack(): void {
    this.combatSystem.playerAttack(this.context);
  }

  update(dt: number): void {
    const ctx = this.context;
    for (const system of this.systems) {
      system.update?.(dt, ctx);
    }
  }
}
