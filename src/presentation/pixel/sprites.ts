/** Fallback painter if a Kenney sheet fails to load. Do not add new art here — edit content/assets/manifest.json. */
export type Facing = "down" | "up" | "left" | "right";

const SIZE = 32;

type Px = (x: number, y: number, color: string) => void;

function makeCanvas(): { canvas: HTMLCanvasElement; p: Px } {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const p: Px = (x, y, color) => {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  return { canvas, p };
}

function rect(p: Px, x: number, y: number, w: number, h: number, color: string): void {
  for (let iy = 0; iy < h; iy += 1) {
    for (let ix = 0; ix < w; ix += 1) p(x + ix, y + iy, color);
  }
}

const RACE = {
  human: { skin: "#e2b48a", skinD: "#c48c62", hair: "#6b3b1f", eye: "#2b1d14" },
  elf: { skin: "#f3d7b8", skinD: "#d4b08a", hair: "#d8d0e8", eye: "#3a6b4a" },
  dwarf: { skin: "#c9926a", skinD: "#a56c48", hair: "#4a2a18", eye: "#2b1d14" },
  orc: { skin: "#6d9a52", skinD: "#4f7638", hair: "#1e1a16", eye: "#d4c43a" },
} as const;

const CLASS = {
  warrior: { cloth: "#6d7580", clothD: "#3e454c", accent: "#8b2e2e", metal: "#c5cdd4" },
  rogue: { cloth: "#2f4a32", clothD: "#1b2c1e", accent: "#6aa84f", metal: "#9aa0a6" },
  mage: { cloth: "#3a4580", clothD: "#242b54", accent: "#7d8cff", metal: "#d4b483" },
  ranger: { cloth: "#4a5a32", clothD: "#2c361c", accent: "#c4a35a", metal: "#8a7358" },
  paladin: { cloth: "#d8d0b8", clothD: "#8a8060", accent: "#d4b483", metal: "#f0e6c8" },
} as const;

function drawHead(p: Px, race: keyof typeof RACE, classId: keyof typeof CLASS, facing: Facing): void {
  const r = RACE[race];
  const c = CLASS[classId];
  const y0 = race === "dwarf" ? 8 : race === "elf" ? 4 : 5;
  const headW = race === "dwarf" || race === "orc" ? 10 : 8;
  const headX = Math.floor((SIZE - headW) / 2);
  const headH = race === "elf" ? 8 : 7;

  if (facing === "up") {
    rect(p, headX, y0, headW, headH, r.hair);
    rect(p, headX + 1, y0 + 2, headW - 2, headH - 2, r.skinD);
  } else {
    rect(p, headX, y0, headW, headH, r.skin);
    rect(p, headX, y0, headW, 2, r.hair);
    if (race === "dwarf") rect(p, headX + 1, y0 + headH - 1, headW - 2, 2, r.hair);
    if (race === "elf") {
      p(headX - 1, y0 + 3, r.skin);
      p(headX + headW, y0 + 3, r.skin);
    }
    if (race === "orc") {
      p(headX, y0 + headH - 1, r.skinD);
      p(headX + headW - 1, y0 + headH - 1, r.skinD);
    }
    if (facing === "down") {
      p(headX + 2, y0 + 4, r.eye);
      p(headX + headW - 3, y0 + 4, r.eye);
      p(headX + Math.floor(headW / 2) - 1, y0 + 6, r.skinD);
    } else {
      const ex = facing === "right" ? headX + headW - 3 : headX + 2;
      p(ex, y0 + 4, r.eye);
    }
  }

  if (classId === "mage") {
    rect(p, headX - 1, y0 - 3, headW + 2, 3, c.cloth);
    p(headX + Math.floor(headW / 2), y0 - 4, c.accent);
  }
  if (classId === "rogue" || classId === "ranger") {
    rect(p, headX, y0, headW, 3, c.clothD);
  }
  if (classId === "warrior" || classId === "paladin") {
    rect(p, headX, y0, headW, 2, c.metal);
  }
}

function drawBody(
  p: Px,
  race: keyof typeof RACE,
  classId: keyof typeof CLASS,
  facing: Facing,
  frame: 0 | 1,
): void {
  const r = RACE[race];
  const c = CLASS[classId];
  const y0 = race === "dwarf" ? 16 : 14;
  const bodyW = race === "dwarf" || race === "orc" ? 10 : 8;
  const bodyX = Math.floor((SIZE - bodyW) / 2);
  const bodyH = race === "dwarf" ? 7 : 8;
  rect(p, bodyX, y0, bodyW, bodyH, c.cloth);
  rect(p, bodyX, y0, bodyW, 1, c.clothD);

  if (classId === "paladin") p(bodyX + Math.floor(bodyW / 2), y0 + 3, c.accent);
  if (classId === "warrior") rect(p, bodyX + bodyW, y0 + 1, 3, 5, c.metal);

  const legY = y0 + bodyH;
  const step = frame === 0 ? 0 : 1;
  p(bodyX + 1, legY, c.clothD);
  p(bodyX + 1, legY + 1 + step, r.skinD);
  p(bodyX + bodyW - 2, legY, c.clothD);
  p(bodyX + bodyW - 2, legY + 1 - step, r.skinD);
  p(bodyX + 1, legY + 2, "#3a2a20");
  p(bodyX + bodyW - 2, legY + 2, "#3a2a20");

  if (facing === "left" || facing === "right") {
    const wx = facing === "right" ? bodyX + bodyW : bodyX - 2;
    if (classId === "mage") {
      rect(p, wx, y0 - 6, 2, 14, "#8a6a40");
      p(wx, y0 - 7, c.accent);
    } else if (classId === "ranger") {
      rect(p, wx, y0, 1, 8, "#6b4a28");
      p(wx + (facing === "right" ? 1 : -1), y0 + 2, c.accent);
    } else if (classId === "rogue") {
      rect(p, wx, y0 + 2, 2, 5, c.metal);
    } else {
      rect(p, wx, y0, 2, 8, c.metal);
      p(wx, y0 - 1, c.accent);
    }
  } else if (facing === "down") {
    if (classId === "mage") rect(p, bodyX + bodyW, y0 - 2, 2, 10, "#8a6a40");
    if (classId === "ranger") rect(p, bodyX - 1, y0 + 1, 1, 7, "#6b4a28");
    if (classId === "warrior" || classId === "paladin") rect(p, bodyX + bodyW, y0, 2, 7, c.metal);
    if (classId === "rogue") {
      p(bodyX - 1, y0 + 3, c.metal);
      p(bodyX + bodyW, y0 + 3, c.metal);
    }
  }
}

export function paintHero(raceId: string, classId: string, facing: Facing, frame: 0 | 1 = 0): HTMLCanvasElement {
  const { canvas, p } = makeCanvas();
  const race = (raceId in RACE ? raceId : "human") as keyof typeof RACE;
  const klass = (classId in CLASS ? classId : "warrior") as keyof typeof CLASS;
  rect(p, 10, 28, 12, 2, "rgba(0,0,0,0.25)");
  drawHead(p, race, klass, facing);
  drawBody(p, race, klass, facing, frame);
  return canvas;
}

export function paintNpc(role: string, frame: 0 | 1 = 0): HTMLCanvasElement {
  const { canvas, p } = makeCanvas();
  const palette: Record<string, string> = {
    quest: "#c4a35a",
    shop: "#8b5a2b",
    healer: "#d8d0e8",
    inn: "#a35a3a",
    info: "#6d8cff",
  };
  const cloth = palette[role] ?? "#8a7358";
  rect(p, 11, 28, 10, 2, "rgba(0,0,0,0.25)");
  rect(p, 12, 6, 8, 7, "#e2b48a");
  rect(p, 12, 6, 8, 2, "#4a2a18");
  p(14, 10, "#2b1d14");
  p(17, 10, "#2b1d14");
  rect(p, 12, 14, 8, 8, cloth);
  p(13, 23 + frame, "#3a2a20");
  p(18, 23 + (1 - frame), "#3a2a20");
  return canvas;
}

export function paintWolf(frame: 0 | 1 = 0): HTMLCanvasElement {
  const { canvas, p } = makeCanvas();
  const fur = "#7a6a5a";
  const dark = "#3a322c";
  rect(p, 8, 26, 16, 2, "rgba(0,0,0,0.25)");
  rect(p, 8, 16, 16, 8, fur);
  rect(p, 20, 12, 8, 7, fur);
  p(26, 14, "#1a1410");
  p(24, 16, "#d4c43a");
  p(22, 18, dark);
  p(8, 15, fur);
  p(6, 16, fur);
  p(8, 24, dark);
  p(18, 24 + frame, dark);
  p(12, 24 + (1 - frame), dark);
  p(22, 23, dark);
  return canvas;
}

export function paintTile(kind: string, seed: number, opts: { roof?: boolean } = {}): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const p = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  const fill = (color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);
  };
  const n = (x: number, y: number) => ((x * 13 + y * 7 + seed * 3) % 5) === 0;

  if (kind === "#" || kind === "H") {
    fill(kind === "#" ? "#4a382c" : "#6b4a36");
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 1) p(x, y, "#3a2a22");
    }
    if (opts.roof) {
      for (let y = 0; y < 16; y += 1) {
        for (let x = 0; x < 16; x += 1) p(x, y, y < 4 ? "#9a4030" : "#7a3024");
      }
    }
  } else if (kind === "=" || kind === "^") {
    fill("#c2a36b");
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) if (n(x, y)) p(x, y, "#a88850");
    }
    if (kind === "^") {
      ctx.fillStyle = "#d4b483";
      ctx.fillRect(1, 1, 14, 2);
    }
  } else if (kind === "T") {
    fill("#3d7a3a");
    for (let y = 10; y < 16; y += 1) for (let x = 6; x < 10; x += 1) p(x, y, "#5a4030");
    for (let y = 1; y < 11; y += 1) {
      for (let x = 2; x < 14; x += 1) {
        if (Math.abs(x - 8) + Math.abs(y - 6) < 6) p(x, y, y < 4 ? "#2f6a32" : "#245a28");
      }
    }
  } else if (kind === "o") {
    fill("#3d7a3a");
    for (let y = 4; y < 14; y += 1) for (let x = 3; x < 13; x += 1) p(x, y, "#7a7a80");
    for (let y = 6; y < 12; y += 1) for (let x = 5; x < 11; x += 1) p(x, y, "#3a5c8a");
  } else if (kind === "D") {
    fill("#6b4a36");
    for (let y = 2; y < 16; y += 1) for (let x = 4; x < 12; x += 1) p(x, y, "#8a5a32");
    p(10, 9, "#d4b483");
  } else {
    fill("#3d7a3a");
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        if ((x * 3 + y * 5 + seed) % 11 === 0) p(x, y, "#2f6a32");
        if ((x * 5 + y * 2 + seed) % 17 === 0) p(x, y, "#4a8a44");
      }
    }
  }
  return canvas;
}

export function heroTextureKey(raceId: string, classId: string, facing: Facing, frame: 0 | 1): string {
  return `hero_${raceId}_${classId}_${facing}_${frame}`;
}
