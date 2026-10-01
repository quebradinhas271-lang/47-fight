import Phaser from "phaser";
import { COMBAT } from "./config/combat";
import { ArenaScene, type ArenaSceneData } from "./scenes/ArenaScene";

export function createGame(parent: HTMLElement, data: ArenaSceneData) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: COMBAT.ARENA_WIDTH,
    height: COMBAT.ARENA_HEIGHT,
    backgroundColor: "#07080c",
    disableContextMenu: true,
    input: { keyboard: false, touch: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  });
  game.scene.add("arena", ArenaScene, true, data);
  return game;
}

export function getArenaScene(game: Phaser.Game): ArenaScene | null {
  const scene = game.scene.getScene("arena");
  return scene instanceof ArenaScene ? scene : null;
}
