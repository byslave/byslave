import { assetManifest, type HouseStyle } from "./assetManifest";
import { charAt } from "./oakvaleMap";

function isBuilding(tx: number, ty: number): boolean {
  const ch = charAt(tx, ty);
  return ch === "H" || ch === "D";
}

function houseStyleAt(ty: number): HouseStyle {
  return ty <= 5 ? assetManifest.tiles.stone : assetManifest.tiles.wood;
}

function pick(list: number[], seed: number): number {
  return list[Math.abs(seed) % list.length];
}

export function townFrameAt(tx: number, ty: number): number {
  const ch = charAt(tx, ty);
  const tiles = assetManifest.tiles;
  const seed = tx + ty * 13;

  if (ch === "H" || ch === "D") {
    const style = houseStyleAt(ty);
    const above = isBuilding(tx, ty - 1);
    const left = isBuilding(tx - 1, ty);
    const right = isBuilding(tx + 1, ty);
    // Hollow houses have doors under empty interiors, so D is never a roof.
    if (ch === "D") return style.door;
    if (!above) {
      if (!left) return style.roofL;
      if (!right) return style.roofR;
      return style.roofM;
    }
    if (left && right) return style.window;
    return style.wall;
  }

  if (ch === "#") return pick(tiles.border, seed);
  if (ch === "T") return pick(tiles.tree, seed);
  if (ch === "o") return tiles.well;
  if (ch === "=") return tiles.path;
  if (ch === "^") return tiles.gate;
  return pick(tiles.grass, seed);
}
