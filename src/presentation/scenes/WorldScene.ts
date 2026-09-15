import Phaser from "phaser";
import type { GameSession } from "@/application/GameSession";
import type { LocationDef, NpcDef } from "@/content/schema";
import { syncHud, type Shell } from "../ui/shell";

const CLASS_COLOR: Record<string, number> = {
  warrior: 0xc45c3e,
  rogue: 0x6aa84f,
  mage: 0x6d8cff,
  ranger: 0xd4a017,
  paladin: 0xe8d48a,
};

const BUILDING_FILL: Record<string, number> = {
  village: 0x6b5344,
  forest: 0x2a4632,
  cave: 0x3a322c,
  ruins: 0x5a584c,
  graveyard: 0x3e443c,
  castle: 0x4a3a42,
};

export class WorldScene extends Phaser.Scene {
  session!: GameSession;
  shell!: Shell;
  playerDot!: Phaser.GameObjects.Arc;
  facing!: Phaser.GameObjects.Triangle;
  keys: Partial<Record<string, Phaser.Input.Keyboard.Key>> = {};

  constructor() {
    super("world");
  }

  init(data: { session: GameSession; shell: Shell }): void {
    this.session = data.session;
    this.shell = data.shell;
  }

  create(): void {
    const location = this.session.world.location(this.session.catalog);
    this.drawLocation(location);
    this.drawNpcs(location.id);
    this.drawPlayer();

    this.cameras.main.setBounds(0, 0, location.width, location.height);
    this.cameras.main.startFollow(this.playerDot, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.05);
    this.cameras.main.centerOn(this.session.player.x, this.session.player.y);

    const keyboard = this.input.keyboard;
    this.keys = keyboard
      ? {
          W: keyboard.addKey("W"),
          A: keyboard.addKey("A"),
          S: keyboard.addKey("S"),
          D: keyboard.addKey("D"),
        }
      : {};
  }

  update(_time: number, delta: number): void {
    let x = this.shell.joystick.vector.x;
    let y = this.shell.joystick.vector.y;
    if (this.keys.A?.isDown) x -= 1;
    if (this.keys.D?.isDown) x += 1;
    if (this.keys.W?.isDown) y -= 1;
    if (this.keys.S?.isDown) y += 1;
    this.session.setMoveIntent(x, y);
    this.session.update(delta / 1000);

    const { player } = this.session;
    this.playerDot.setPosition(player.x, player.y);
    this.facing.setPosition(player.x + player.facing.x * 18, player.y + player.facing.y * 18);
    syncHud(this.shell, this.session);
  }

  private drawLocation(location: LocationDef): void {
    const g = this.add.graphics();
    g.fillStyle(Number.parseInt(location.ground.slice(1), 16), 1);
    g.fillRect(0, 0, location.width, location.height);

    g.fillStyle(Number.parseInt(location.path.slice(1), 16), 1);
    if (location.id === "oakvale") {
      g.fillRect(640, 80, 120, 900);
      g.fillRect(220, 560, 960, 90);
    }

    const fill = BUILDING_FILL[location.kind] ?? 0x4a4038;
    for (const rect of location.collision) {
      const edge =
        rect.w >= location.width - 40 || rect.h >= location.height - 40;
      g.fillStyle(edge ? 0x241c16 : fill, 1);
      g.fillRect(rect.x, rect.y, rect.w, rect.h);
      if (!edge) {
        g.fillStyle(0x000000, 0.18);
        g.fillRect(rect.x, rect.y + rect.h - 10, rect.w, 10);
      }
    }

    for (const place of location.places) {
      this.add
        .text(place.x, place.y, place.name, {
          fontFamily: "Georgia, serif",
          fontSize: "14px",
          color: "#f3e6cf",
          stroke: "#1a1410",
          strokeThickness: 4,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(4);
    }

    g.lineStyle(2, 0xd4b483, 0.5);
    for (const exit of location.exits) {
      g.strokeRect(exit.rect.x, exit.rect.y, exit.rect.w, exit.rect.h);
    }
  }

  private drawNpcs(locationId: string): void {
    const npcs = this.session.catalog.npcs.filter((npc: NpcDef) => npc.locationId === locationId);
    for (const npc of npcs) {
      this.add.circle(npc.marker.x, npc.marker.y, 10, 0xd4b483).setDepth(5);
      this.add
        .text(npc.marker.x, npc.marker.y - 18, npc.name, {
          fontFamily: "Georgia, serif",
          fontSize: "12px",
          color: "#ead9ba",
          stroke: "#1a1410",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(5);
    }
  }

  private drawPlayer(): void {
    const color = CLASS_COLOR[this.session.player.classId] ?? 0xf3e6cf;
    this.playerDot = this.add.circle(this.session.player.x, this.session.player.y, 16, color).setDepth(10);
    this.playerDot.setStrokeStyle(3, 0x1a1410);
    this.facing = this.add
      .triangle(this.session.player.x, this.session.player.y + 18, 0, 0, 8, 12, -8, 12, 0xf3e6cf)
      .setDepth(11);
  }
}
