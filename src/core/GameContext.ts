import type { Catalog } from "@/content/Catalog";
import type { EventBus } from "./EventBus";
import type { Rng } from "./Rng";
import type { WorldState } from "@/domain/world/WorldState";

export interface GameSystem {
  readonly id: string;
  bind(ctx: GameContext): void;
  update?(dt: number, ctx: GameContext): void;
  unbind?(): void;
}

export interface GameContext {
  catalog: Catalog;
  events: EventBus;
  rng: Rng;
  world: WorldState;
}
