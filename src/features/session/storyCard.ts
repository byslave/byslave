export interface StoryCardInput {
  title: string;
  venue: string;
  duration: string;
  jumps: string;
  sample: string;
  brand: string;
}

export async function downloadNightStory(input: StoryCardInput): Promise<'saved' | 'unavailable'> {
  if (typeof document === 'undefined') return 'unavailable';
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  if (!context) return 'unavailable';
  context.fillStyle = '#07060C';
  context.fillRect(0, 0, 1080, 1920);
  context.fillStyle = '#D9CCFF';
  context.fillRect(80, 220, 160, 8);
  context.fillStyle = '#C4BDD2';
  context.font = '600 36px sans-serif';
  context.fillText(input.brand, 80, 300);
  context.fillStyle = '#F6F3FB';
  context.font = '700 92px sans-serif';
  wrap(context, input.title, 80, 460, 920, 110);
  context.fillStyle = '#A79FB4';
  context.font = '500 40px sans-serif';
  context.fillText(input.venue, 80, 860);
  context.fillStyle = '#F6F3FB';
  context.font = '700 72px sans-serif';
  context.fillText(input.duration, 80, 1040);
  context.fillText(input.jumps, 80, 1160);
  context.fillStyle = '#D9CCFF';
  context.font = '600 32px sans-serif';
  context.fillText(input.sample, 80, 1680);
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pulse-gece.png';
  link.click();
  return 'saved';
}

function wrap(context: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line: number) {
  const words = text.split(' ');
  let row = '';
  let top = y;
  words.forEach((word) => {
    const next = row ? `${row} ${word}` : word;
    if (context.measureText(next).width > max) {
      context.fillText(row, x, top);
      row = word;
      top += line;
    } else row = next;
  });
  if (row) context.fillText(row, x, top);
}
