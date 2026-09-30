import { brand } from '../../config/brand';

export type CardVariant = 'kare' | 'hikaye' | 'serit';

export const cardVariants: { id: CardVariant; label: string; width: number; height: number }[] = [
  { id: 'serit', label: 'Şerit', width: 1080, height: 1350 },
  { id: 'kare', label: 'Kare', width: 1080, height: 1080 },
  { id: 'hikaye', label: 'Hikaye', width: 1080, height: 1920 },
];

export type NightCardInput = {
  variant: CardVariant;
  photoUri: string | null;
  title: string;
  venue: string;
  score: number;
  duration: string;
  jumps: string;
  distance: string;
  calories: string;
};

const ink = '#FFFFFF';
const mute = '#A0A0A0';
const red = '#E50914';
const bg = '#050505';
const strip = '#0D0D0D';

function sizeOf(variant: CardVariant) {
  return cardVariants.find((item) => item.id === variant) ?? cardVariants[0]!;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

function stats(ctx: CanvasRenderingContext2D, input: NightCardInput, x: number, y: number, width: number) {
  const cells = [
    [input.duration, 'Süre'],
    [input.jumps, 'Zıplama'],
    [input.distance, 'Mesafe'],
    [input.calories, 'Kalori'],
  ];
  const col = width / cells.length;
  cells.forEach(([value, label], index) => {
    const cx = x + col * index;
    ctx.fillStyle = ink;
    ctx.font = '700 42px sans-serif';
    ctx.fillText(value, cx, y);
    ctx.fillStyle = mute;
    ctx.font = '28px sans-serif';
    ctx.fillText(label, cx, y + 40);
  });
}

export async function renderNightCard(input: NightCardInput): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const { width, height } = sizeOf(input.variant);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const photo = input.photoUri ? await loadImage(input.photoUri) : null;
  const bar = input.variant === 'serit' ? 280 : 0;
  const photoHeight = height - bar;
  if (photo) cover(ctx, photo, width, photoHeight);
  if (input.variant === 'serit') {
    ctx.fillStyle = strip;
    ctx.fillRect(0, photoHeight, width, bar);
    ctx.fillStyle = red;
    ctx.font = '700 92px sans-serif';
    ctx.fillText(String(input.score), 64, photoHeight + 110);
    ctx.fillStyle = mute;
    ctx.font = '28px sans-serif';
    ctx.fillText('Party Score', 64, photoHeight + 150);
    ctx.fillStyle = ink;
    ctx.font = '700 36px sans-serif';
    ctx.fillText(input.title.slice(0, 32), 360, photoHeight + 100);
    ctx.fillStyle = mute;
    ctx.font = '28px sans-serif';
    ctx.fillText(input.venue.slice(0, 32), 360, photoHeight + 142);
    stats(ctx, input, 64, photoHeight + 210, width - 128);
  } else {
    const gradient = ctx.createLinearGradient(0, photoHeight * 0.45, 0, photoHeight);
    gradient.addColorStop(0, 'rgba(5,5,5,0)');
    gradient.addColorStop(1, 'rgba(5,5,5,0.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, photoHeight);
    ctx.fillStyle = ink;
    ctx.font = '700 28px sans-serif';
    ctx.fillText(brand.name, 64, 88);
    ctx.fillStyle = red;
    ctx.font = '700 140px sans-serif';
    ctx.fillText(String(input.score), 64, photoHeight - 220);
    ctx.fillStyle = mute;
    ctx.font = '32px sans-serif';
    ctx.fillText('Party Score', 64, photoHeight - 176);
    ctx.fillStyle = ink;
    ctx.font = '700 48px sans-serif';
    ctx.fillText(input.title.slice(0, 28), 64, photoHeight - 120);
    ctx.fillStyle = mute;
    ctx.font = '32px sans-serif';
    ctx.fillText(input.venue.slice(0, 32), 64, photoHeight - 72);
    stats(ctx, input, 64, photoHeight - 16, width - 128);
  }
  return canvas.toDataURL('image/png');
}

export function downloadCard(dataUrl: string, score: number) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `gece-${score}.png`;
  link.click();
}

export async function shareCard(dataUrl: string, title: string, score: number): Promise<'shared' | 'downloaded'> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], `gece-${score}.png`, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title });
    return 'shared';
  }
  downloadCard(dataUrl, score);
  return 'downloaded';
}
