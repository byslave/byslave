import type { GameContext, GameSystem } from "@/core/GameContext";
import { abilityMod, proficiencyBonus, resolveAttack } from "@/domain/combat/dice";
import type { AttackResult } from "@/domain/combat/dice";
import { addXp } from "@/domain/stats/xp";
import type { PrimaryStat } from "@/core/types";
import { OAKVALE_MARKERS } from "@/content/oakvaleMap";

function pushLog(ctx: GameContext, line: string): void {
  const combat = ctx.world.combat;
  if (!combat) return;
  combat.log = [...combat.log.slice(-5), line];
}

export class CombatSystem implements GameSystem {
  readonly id = "combat";

  bind(): void {}

  update(dt: number, ctx: GameContext): void {
    const player = ctx.world.player;
    if (!ctx.world.combat) {
      for (const encounter of ctx.world.encounters) {
        if (!encounter.alive) continue;
        const dist = Math.hypot(player.x - encounter.x, player.y - encounter.y);
        if (dist < 28) this.begin(ctx, encounter.id);
      }
      return;
    }
    if (ctx.world.combat.turn !== "enemy") return;
    ctx.world.enemyTurnIn -= dt;
    if (ctx.world.enemyTurnIn <= 0) this.enemyAttack(ctx);
  }

  begin(ctx: GameContext, encounterId: string): void {
    const encounter = ctx.world.encounters.find((item) => item.id === encounterId);
    if (!encounter || !encounter.alive || ctx.world.combat) return;
    const enemy = ctx.catalog.enemy(encounter.enemyId);
    ctx.world.combat = {
      encounterId,
      enemyId: enemy.id,
      enemyName: enemy.name,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.hp,
      turn: "player",
      log: [`A ${enemy.name} snarls. Roll the dice.`],
    };
    ctx.world.moveIntent = { x: 0, y: 0 };
  }

  playerAttack(ctx: GameContext): AttackResult | null {
    const combat = ctx.world.combat;
    if (!combat || combat.turn !== "player") return null;
    const classDef = ctx.catalog.class(ctx.world.player.classId);
    const ability = classDef.dice.attackAbility as PrimaryStat;
    const attackBonus = proficiencyBonus(ctx.world.player.level) + abilityMod(ctx.world.player.attributes[ability]);
    const damageBonus = abilityMod(ctx.world.player.attributes[ability]);
    const enemy = ctx.catalog.enemy(combat.enemyId);
    const result = resolveAttack(
      {
        attackBonus,
        armorClass: enemy.ac ?? 12,
        damageDice: classDef.dice.damage,
        damageBonus,
      },
      ctx.rng,
    );
    pushLog(ctx, `You: ${result.text}`);
    if (result.hit) combat.enemyHp = Math.max(0, combat.enemyHp - result.damage);
    ctx.events.emit("combat.hit", {
      attackerId: "player",
      targetId: combat.encounterId,
      damage: result.damage,
      crit: result.crit,
    });
    if (combat.enemyHp <= 0) {
      this.win(ctx);
      return result;
    }
    combat.turn = "enemy";
    ctx.world.enemyTurnIn = 0.65;
    return result;
  }

  private enemyAttack(ctx: GameContext): void {
    const combat = ctx.world.combat;
    if (!combat) return;
    const enemy = ctx.catalog.enemy(combat.enemyId);
    const player = ctx.world.player;
    const classDef = ctx.catalog.class(player.classId);
    const ac =
      10 +
      abilityMod(player.attributes.dexterity) +
      classDef.dice.acBonus;
    const result = resolveAttack(
      {
        attackBonus: enemy.attackBonus ?? 3,
        armorClass: ac,
        damageDice: enemy.damageDice ?? "1d4+1",
        damageBonus: 0,
      },
      ctx.rng,
    );
    pushLog(ctx, `${combat.enemyName}: ${result.text}`);
    if (result.hit) {
      player.hp = Math.max(0, player.hp - result.damage);
    }
    if (player.hp <= 0) {
      pushLog(ctx, "You fall. The inn keeps a bed.");
      player.hp = player.derived.hpMax;
      player.x = OAKVALE_MARKERS.spawn.x;
      player.y = OAKVALE_MARKERS.spawn.y;
      ctx.world.combat = null;
      ctx.events.emit("player.died", { locationId: player.locationId });
      return;
    }
    combat.turn = "player";
  }

  private win(ctx: GameContext): void {
    const combat = ctx.world.combat;
    if (!combat) return;
    const encounter = ctx.world.encounters.find((item) => item.id === combat.encounterId);
    if (encounter) encounter.alive = false;
    const enemy = ctx.catalog.enemy(combat.enemyId);
    const { base, growth } = ctx.catalog.formulas.xpPerLevel;
    const gained = addXp(
      ctx.world.player.level,
      ctx.world.player.xp,
      enemy.xp,
      ctx.world.player.derived.xpGain ?? 1,
      ctx.catalog.formulas.levelCap,
      base,
      growth,
    );
    ctx.world.player.level = gained.level;
    ctx.world.player.xp = gained.xp;
    pushLog(ctx, `${combat.enemyName} dies. +${enemy.xp} XP.`);
    ctx.world.banner = `${combat.enemyName} falls. +${enemy.xp} XP.`;
    ctx.events.emit("combat.killed", {
      killerId: "player",
      targetId: combat.encounterId,
      enemyId: combat.enemyId,
    });
    ctx.world.combat = null;
  }
}
