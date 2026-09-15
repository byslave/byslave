import type { GameContext, GameSystem } from "@/core/GameContext";
import { blocked, circleHitsRect } from "@/domain/world/WorldState";

export class MovementSystem implements GameSystem {
  readonly id = "movement";

  bind(): void {}

  update(dt: number, ctx: GameContext): void {
    const { player } = ctx.world;
    const intent = ctx.world.moveIntent;
    const len = Math.hypot(intent.x, intent.y);
    const location = ctx.world.location(ctx.catalog);

    if (len > 0.01) {
      const nx = intent.x / len;
      const ny = intent.y / len;
      player.facing = { x: nx, y: ny };
      const speed = player.derived.movementSpeed ?? 170;
      const tryX = player.x + nx * speed * dt;
      if (!blocked(tryX, player.y, player.radius, location)) player.x = tryX;
      const tryY = player.y + ny * speed * dt;
      if (!blocked(player.x, tryY, player.radius, location)) player.y = tryY;
    }

    ctx.world.exitHint = null;
    for (const exit of location.exits) {
      if (circleHitsRect(player.x, player.y, player.radius + 12, exit.rect)) {
        const dest = ctx.catalog.location(exit.toLocationId);
        ctx.world.exitHint = `${dest.name} — the road opens in a later phase.`;
      }
    }

    if (len > 0.01) {
      ctx.events.emit("player.moved", {
        x: player.x,
        y: player.y,
        locationId: player.locationId,
      });
    }
  }
}
