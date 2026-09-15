import type { LocationDef } from "@/content/schema";
import type { Rect } from "@/core/types";

export const TILE_SIZE = 16;
export const WALK_SPEED = 64;
export const PLAYER_RADIUS = 6;

export const OAKVALE_ROWS: string[] = [
  "############################",
  "#TT.......^^^^.........TT..#",
  "#.........^^^^.............#",
  "#..HHHH..............HHHH..#",
  "#..H..H..............H..H..#",
  "#..HDDH..............HDDH..#",
  "#..........................#",
  "#HHHH............HHHHHHHH..#",
  "#HDDH............HDD....H..#",
  "#H..H.....====...H......H..#",
  "#.........====.............#",
  "#.........====.............#",
  "#....ow...====.............#",
  "#.........====.............#",
  "#HHHHHH...====.............#",
  "#HDD..H...====.............#",
  "#H....H....................#",
  "#..........................#",
  "#TT......................TT#",
  "############################",
];

const SOLID = new Set(["#", "H", "T", "o"]);

export function tileCenter(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
}

export function charAt(tx: number, ty: number): string {
  return OAKVALE_ROWS[ty]?.[tx] ?? "#";
}

export function findTiles(ch: string): { tx: number; ty: number }[] {
  const found: { tx: number; ty: number }[] = [];
  OAKVALE_ROWS.forEach((row, ty) => {
    [...row].forEach((cell, tx) => {
      if (cell === ch) found.push({ tx, ty });
    });
  });
  return found;
}

export const OAKVALE_MARKERS = {
  spawn: tileCenter(11, 11),
  mira: tileCenter(4, 6),
  brann: tileCenter(2, 10),
  lila: tileCenter(19, 10),
  anwen: tileCenter(22, 6),
  tomas: tileCenter(3, 17),
  durn: tileCenter(12, 3),
  wolf: tileCenter(findTiles("w")[0]?.tx ?? 23, findTiles("w")[0]?.ty ?? 12),
};

export function buildOakvaleLocation(): LocationDef {
  const height = OAKVALE_ROWS.length;
  const width = OAKVALE_ROWS[0].length;
  const collision: Rect[] = [];
  for (let ty = 0; ty < height; ty += 1) {
    for (let tx = 0; tx < width; tx += 1) {
      if (SOLID.has(OAKVALE_ROWS[ty][tx])) {
        collision.push({ x: tx * TILE_SIZE, y: ty * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE });
      }
    }
  }
  const gates = findTiles("^");
  const minX = Math.min(...gates.map((g) => g.tx));
  const maxX = Math.max(...gates.map((g) => g.tx));
  const minY = Math.min(...gates.map((g) => g.ty));
  const maxY = Math.max(...gates.map((g) => g.ty));

  return {
    id: "oakvale",
    name: "Oakvale Village",
    kind: "village",
    width: width * TILE_SIZE,
    height: height * TILE_SIZE,
    tint: 4473924,
    ground: "#3d7a3a",
    path: "#c2a36b",
    spawnPoints: {
      default: OAKVALE_MARKERS.spawn,
      from_darkwood: tileCenter(12, 3),
      inn: OAKVALE_MARKERS.tomas,
    },
    places: [
      { id: "square", name: "Square", x: tileCenter(11, 11).x, y: tileCenter(11, 11).y },
      { id: "blacksmith", name: "Smith", x: tileCenter(2, 8).x, y: tileCenter(2, 8).y },
      { id: "store", name: "Store", x: tileCenter(20, 8).x, y: tileCenter(20, 8).y },
      { id: "elder", name: "Hall", x: tileCenter(4, 4).x, y: tileCenter(4, 4).y },
      { id: "healer", name: "Shrine", x: tileCenter(22, 4).x, y: tileCenter(22, 4).y },
      { id: "inn", name: "Inn", x: tileCenter(3, 15).x, y: tileCenter(3, 15).y },
      { id: "gate", name: "North Gate", x: tileCenter(12, 1).x, y: tileCenter(1, 1).y },
    ],
    collision,
    exits: [
      {
        id: "to_darkwood",
        toLocationId: "darkwood",
        toSpawnId: "from_oakvale",
        rect: {
          x: minX * TILE_SIZE,
          y: minY * TILE_SIZE,
          w: (maxX - minX + 1) * TILE_SIZE,
          h: (maxY - minY + 1) * TILE_SIZE,
        },
      },
    ],
  };
}
