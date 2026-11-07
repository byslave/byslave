export function isCanvasJpeg(value: string): boolean {
  return value.startsWith('data:image/jpeg;base64,');
}

/** Redraws the file so camera location metadata is not part of the bytes we keep. */
export async function stripPhotoFile(file: Blob): Promise<string> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    throw new Error('photo-strip-unavailable');
  }
  const bitmap = await createImageBitmap(file);
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('photo-strip-unavailable');
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  const url = canvas.toDataURL('image/jpeg', 0.82);
  if (!isCanvasJpeg(url)) throw new Error('photo-strip-unavailable');
  return url;
}
