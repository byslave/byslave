import Phaser from "phaser";
import type { GameSession } from "@/application/GameSession";
import { OAKVALE_ROWS, TILE_SIZE } from "@/content/oakvaleMap";
import {
  heroTextureKey,
  paintHero,
  paintNpc,
  paintTile,
  paintWolf,
  type Facing,
} from "../pixel/sprites";
import { syncHud, type Shell } from "../ui/shell";

function facingFrom(vec: { x: number; y: number }): Facing {
  if (Math.abs(vec.x) > Math.abs(vec.y)) return vec.x >= 0 ? "right" : "left";
  return vec.y >= 0 ? "down" : "up";
}

export class WorldScene extends Phaser.Scene {
  session!: GameSession;
  shell!: Shell;
  playerSprite!: Phaser.GameObjects.Image;
  wolfSprite!: Phaser.GameObjects.Image;
  keys: Partial<Record<string, Phaser.Input.Keyboard.Key>> = {};
  frame: 0 | 1 = 0;
  animAt = 0;

  constructor() {
    super("world");
  }

  init(data: { session: GameSession; shell: Shell }): void {
    this.session = data.session;
    this.shell = data.shell;
  }

  create(): void {
    this.drawTiles();
    this.cacheHeroFrames();
    for (const npc of this.session.catalog.npcs.filter((n) => n.locationId === "oakvale")) {
      const key = `npc_${npc.id}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, paintNpc(npc.role, 0));
      this.add.image(npc.marker.x, npc.marker.y, key).setDepth(5);
      this.add
        .text(npc.marker.x, npc.marker.y - 14, npc.name, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#f3e6cf",
          stroke: "#1a1410",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(6);
    }

    this.textures.addCanvas("wolf_0", paintWolf(0));
    this.textures.addCanvas("wolf_1", paintWolf(1));
    const wolf = this.session.world.encounters[0];
    this.wolfSprite = this.add.image(wolf.x, wolf.y, "wolf_0").setDepth(8);

    const { player } = this.session;
    const face = facingFrom(player.facing);
    this.playerSprite = this.add
      .image(player.x, player.y, heroTextureKey(player.raceId, player.classId, face, 0))
      .setDepth(10);

    this.cameras.main.setBounds(0, 0, OAKVALE_ROWS[0].length * TILE_SIZE, OAKVALE_ROWS.length * TILE_SIZE);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.playerSprite, true, 0.16, 0.16);
    this.cameras.main.roundPixels = true;

    const keyboard = this.input.keyboard;
    this.keys = keyboard
      ? {
          W: keyboard.addKey("W"),
          A: keyboard.addKey("A"),
          S: keyboard.addKey("S"),
          D: keyboard.addKey("D"),
          J: keyboard.addKey("J"),
        }
      : {};
    this.keys.J?.on("down", () => this.session.attack());
  }

  update(time: number, delta: number): void {
    let x = this.shell.joystick.vector.x;
    let y = this.shell.joystick.vector.y;
    if (this.keys.A?.isDown) x -= 1;
    if (this.keys.D?.isDown) x += 1;
    if (this.keys.W?.isDown) y -= 1;
    if (this.keys.S?.isDown) y += 1;
    this.session.setMoveIntent(x, y);
    this.session.update(delta / 1000);

    const { player } = this.session;
    const moving = Math.hypot(x, y) > 0.01 && !this.session.world.combat;
    if (moving && time > this.animAt) {
      this.frame = this.frame === 0 ? 1 : 0;
      this.animAt = time + 180;
    }
    const face = facingFrom(player.facing);
    const key = heroTextureKey(player.raceId, player.classId, face, moving ? this.frame : 0);
    this.playerSprite.setTexture(key);
    this.playerSprite.setPosition(Math.round(player.x), Math.round(player.y));

    const wolf = this.session.world.encounters[0];
    this.wolfSprite.setVisible(wolf.alive);
    this.wolfSprite.setTexture(time % 400 < 200 ? "wolf_0" : "wolf_1");

    syncHud(this.shell, this.session);
  }

  private cacheHeroFrames(): void {
    const { raceId, classId } = this.session.player;
    const facings: Facing[] = ["down", "up", "left", "right"];
    for (const facing of facings) {
      for (const frame of [0, 1] as const) {
        const key = heroTextureKey(raceId, classId, facing, frame);
        if (!this.textures.exists(key)) {
          this.textures.addCanvas(key, paintHero(raceId, classId, facing, frame));
        }
      }
    }
  }

  private drawTiles(): void {
    OAKVALE_ROWS.forEach((row, ty) => {
      [...row].forEach((cell, tx) => {
        const kind = cell === "w" ? "." : cell;
        const key = `tile_${kind}_${(tx + ty) % 4}`;
        if (!this.textures.exists(key)) {
          this.textures.addCanvas(key, paintTile(kind, tx + ty * 3));
        }
        this.add.image(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, key).setDepth(0);
      });
    });
    for (const place of this.session.catalog.location("oakvale").places) {
      this.add
        .text(place.x, place.y - 6, place.name, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#f3e6cf",
          stroke: "#1a1410",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(4);
    }
  }
}
