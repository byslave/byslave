import type { GameContext, GameSystem } from "@/core/GameContext";
import { blocked } from "@/domain/world/WorldState";

export class MovementSystem implements GameSystem {
  readonly id = "movement";

  bind(): void {}

  update(dt: number, ctx: GameContext): void {
    const { player } = ctx.world;
    const intent = ctx.world.moveIntent;
    const len = Math.hypot(intent.x, intent.y);
    if (len <= 0.01) return;

    const nx = intent.x / len;
    const ny = intent.y / len;
    player.facing = { x: nx, y: ny };

    const speed = player.derived.movementSpeed ?? 170;
    const dx = nx * speed * dt;
    const dy = ny * speed * dt;
    const location = ctx.world.location(ctx.catalog);

    const tryX = player.x + dx;
    if (!blocked(tryX, player.y, player.radius, location)) player.x = tryX;
    const tryY = player.y + dy;
    if (!blocked(player.x, tryY, player.radius, location)) player.y = tryY;

    ctx.world.exitHint = null;
    for (const exit of location.exits) {
      const { rect } = exit;
      if (
        player.x >= rect.x &&
        player.x <= rect.x + rect.w &&
        player.y >= rect.y &&
        player.y <= rect.y + rect.h
      ) {
        const dest = ctx.catalog.location(exit.toLocationId);
        ctx.world.exitHint = `${dest.name} — the road opens in a later phase.`;
      }
    }

    ctx.events.emit("player.moved", {
      x: player.x,
      y: player.y,
      locationId: player.locationId,
    });
  }
}
