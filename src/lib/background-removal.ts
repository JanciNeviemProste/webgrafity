import { removeBackground as removeBg } from '@imgly/background-removal';

const MAX_SIZE = 1024;

function resizeIfNeeded(img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (w <= MAX_SIZE && h <= MAX_SIZE) return img;

  const scale = MAX_SIZE / Math.max(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export async function removeImageBackground(file: File): Promise<HTMLImageElement> {
  // Load original image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });

  // Resize for performance
  const resized = resizeIfNeeded(img);
  let input: Blob;
  if (resized instanceof HTMLCanvasElement) {
    input = await canvasToBlob(resized);
  } else {
    input = file;
  }

  // Run background removal
  const resultBlob = await removeBg(input, {
    output: { format: 'image/png' },
  });

  // Convert result blob to HTMLImageElement
  const resultImg = new Image();
  await new Promise<void>((resolve, reject) => {
    resultImg.onload = () => resolve();
    resultImg.onerror = () => reject(new Error('Failed to load processed image'));
    resultImg.src = URL.createObjectURL(resultBlob);
  });

  return resultImg;
}
