import Phaser from "phaser";

export function createPhaserGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#1a1410",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    render: { antialias: true, roundPixels: true },
    scene: [],
    audio: { noAudio: true },
  });
}
