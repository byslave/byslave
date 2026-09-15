import Phaser from "phaser";
import { assetManifest } from "@/content/assetManifest";
import type { GameSession } from "@/application/GameSession";
import type { Shell } from "../ui/shell";

export class BootScene extends Phaser.Scene {
  session!: GameSession;
  shell!: Shell;

  constructor() {
    super("boot");
  }

  init(data: { session: GameSession; shell: Shell }): void {
    this.session = data.session;
    this.shell = data.shell;
  }

  preload(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Loading Oakvale…", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#d4b483",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const { town, dungeon } = assetManifest.sheets;
    this.load.spritesheet(town.key, town.url, {
      frameWidth: town.frameWidth,
      frameHeight: town.frameHeight,
    });
    this.load.spritesheet(dungeon.key, dungeon.url, {
      frameWidth: dungeon.frameWidth,
      frameHeight: dungeon.frameHeight,
    });
  }

  create(): void {
    this.scene.start("world", { session: this.session, shell: this.shell });
  }
}
