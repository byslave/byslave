import Phaser from "phaser";
import type { GameSession } from "@/application/GameSession";
import {
  assetManifest,
  hexToTint,
  lookupEnemy,
  lookupHero,
  lookupNpc,
  sheetByName,
} from "@/content/assetManifest";
import { OAKVALE_ROWS, TILE_SIZE } from "@/content/oakvaleMap";
import { townFrameAt } from "@/content/townTiles";
import type { Facing } from "../pixel/sprites";
import { syncHud, type Shell } from "../ui/shell";

function facingFrom(vec: { x: number; y: number }): Facing {
  if (Math.abs(vec.x) > Math.abs(vec.y)) return vec.x >= 0 ? "right" : "left";
  return vec.y >= 0 ? "down" : "up";
}

function sheetKey(name: string): string {
  return sheetByName(name).key;
}

export class WorldScene extends Phaser.Scene {
  session!: GameSession;
  shell!: Shell;
  playerSprite!: Phaser.GameObjects.Image;
  wolfSprite!: Phaser.GameObjects.Image;
  wolfLabel!: Phaser.GameObjects.Text;
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
    this.placeNpcs();

    const wolfSpec = lookupEnemy("wolf");
    const wolf = this.session.world.encounters[0];
    this.wolfSprite = this.add
      .image(wolf.x, wolf.y, sheetKey(wolfSpec.sheet), wolfSpec.frame)
      .setTint(hexToTint(wolfSpec.tint))
      .setDepth(8);
    this.wolfLabel = this.add
      .text(wolf.x, wolf.y - 10, "Beast", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#f3e6cf",
        stroke: "#1a1410",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(20);

    const { player } = this.session;
    const hero = lookupHero(player.raceId, player.classId);
    this.playerSprite = this.add
      .image(player.x, player.y, sheetKey(hero.sheet), hero.frame)
      .setTint(hexToTint(hero.tint))
      .setDepth(10);

    this.cameras.main.setBounds(0, 0, OAKVALE_ROWS[0].length * TILE_SIZE, OAKVALE_ROWS.length * TILE_SIZE);
    this.cameras.main.setZoom(4);
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
    this.playerSprite.setFlipX(face === "left");
    this.playerSprite.setPosition(Math.round(player.x), Math.round(player.y) + (moving && this.frame === 1 ? -1 : 0));
    this.playerSprite.setDepth(10 + player.y);

    const wolf = this.session.world.encounters[0];
    this.wolfSprite.setVisible(wolf.alive);
    this.wolfLabel.setVisible(wolf.alive);
    this.wolfSprite.setFlipX(time % 800 < 400);
    this.wolfSprite.setDepth(8 + wolf.y);

    syncHud(this.shell, this.session);
  }

  private placeNpcs(): void {
    for (const npc of this.session.catalog.npcs.filter((n) => n.locationId === "oakvale")) {
      const spec = lookupNpc(npc.id);
      this.add
        .image(npc.marker.x, npc.marker.y, sheetKey(spec.sheet), spec.frame)
        .setTint(hexToTint(spec.tint))
        .setDepth(5 + npc.marker.y);
      this.add
        .text(npc.marker.x, npc.marker.y - 10, npc.name, {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#f3e6cf",
          stroke: "#1a1410",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(20);
    }
  }

  private drawTiles(): void {
    OAKVALE_ROWS.forEach((row, ty) => {
      [...row].forEach((_cell, tx) => {
        const frame = townFrameAt(tx, ty);
        this.add
          .image(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, assetManifest.sheets.town.key, frame)
          .setDepth(0);
      });
    });
    for (const place of this.session.catalog.location("oakvale").places) {
      if (place.id === "square") continue;
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
