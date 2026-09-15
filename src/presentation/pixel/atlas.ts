import { hexToTint, sheetByName, type SpriteRef } from "@/content/assetManifest";

export function frameSourceRect(
  frame: number,
  columns: number,
  frameWidth: number,
  frameHeight: number,
): { sx: number; sy: number; sw: number; sh: number } {
  return {
    sx: (frame % columns) * frameWidth,
    sy: Math.floor(frame / columns) * frameHeight,
    sw: frameWidth,
    sh: frameHeight,
  };
}

export function cropFrame(
  sheet: CanvasImageSource,
  frame: number,
  columns: number,
  frameWidth: number,
  frameHeight: number,
): HTMLCanvasElement {
  const { sx, sy, sw, sh } = frameSourceRect(frame, columns, frameWidth, frameHeight);
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

export function tintCanvas(source: HTMLCanvasElement, hex: string | undefined): HTMLCanvasElement {
  const tint = hexToTint(hex);
  if (tint === 0xffffff) return source;
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = hex ?? "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(source, 0, 0);
  return out;
}

export function drawSpritePreview(
  ctx: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  sprite: SpriteRef,
  destSize: number,
): void {
  const def = sheetByName(sprite.sheet);
  const cropped = tintCanvas(
    cropFrame(sheet, sprite.frame, def.columns, def.frameWidth, def.frameHeight),
    sprite.tint,
  );
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, destSize, destSize);
  const pad = Math.floor((destSize - def.frameWidth * 2) / 2);
  ctx.drawImage(cropped, pad, pad, def.frameWidth * 2, def.frameHeight * 2);
}

const sheetCache = new Map<string, Promise<HTMLImageElement>>();

export function loadSheetImage(url: string): Promise<HTMLImageElement> {
  const hit = sheetCache.get(url);
  if (hit) return hit;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load sheet ${url}`));
    image.src = url;
  });
  sheetCache.set(url, pending);
  return pending;
}
