import Phaser from "phaser";
import { GameSession } from "./application/GameSession";
import { createPhaserGame } from "./presentation/gameConfig";
import { BootScene } from "./presentation/scenes/BootScene";
import { WorldScene } from "./presentation/scenes/WorldScene";
import { mountShell } from "./presentation/ui/shell";

const shell = mountShell();
let game: Phaser.Game | null = null;
let session: GameSession | null = null;

shell.onNewGame((raceId, classId) => {
  session = new GameSession({ raceId, classId, name: "Adventurer", seed: 17 });
  shell.showHud();
  if (game) {
    game.destroy(true);
    game = null;
  }
  game = createPhaserGame();
  game.scene.add("world", WorldScene, false);
  game.scene.add("boot", BootScene, true, { session, shell });
});

shell.onAttack(() => {
  session?.attack();
});
