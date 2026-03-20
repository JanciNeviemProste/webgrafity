import { drawPerspectiveWarp } from './perspective';
import type { Point, BackgroundMode, ExportOptions } from '@/types';

export function exportCanvas(
  bgMode: BackgroundMode,
  video: HTMLVideoElement | null,
  bgImage: HTMLImageElement | null,
  wallCanvas: HTMLCanvasElement | null,
  canvasWidth: number,
  canvasHeight: number,
  corners: Point[],
  graffitiCanvas: CanvasImageSource | null,
  opacity: number,
  options: ExportOptions = {}
): void {
  const { format = 'png', quality = 1.0, filename = 'ar-graffiti' } = options;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;
  const tCtx = tempCanvas.getContext('2d')!;

  // Draw background
  if (bgMode === 'camera' && video && video.readyState >= 2) {
    const vAspect = video.videoWidth / video.videoHeight;
    const cAspect = canvasWidth / canvasHeight;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (vAspect > cAspect) {
      sw = video.videoHeight * cAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / cAspect;
      sy = (video.videoHeight - sh) / 2;
    }
    tCtx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);
  } else if (bgMode === 'upload' && bgImage) {
    const iA = bgImage.width / bgImage.height;
    const cA = canvasWidth / canvasHeight;
    let dx = 0, dy = 0, dw = canvasWidth, dh = canvasHeight;
    if (iA > cA) {
      dh = canvasWidth / iA;
      dy = (canvasHeight - dh) / 2;
    } else {
      dw = canvasHeight * iA;
      dx = (canvasWidth - dw) / 2;
    }
    tCtx.drawImage(bgImage, dx, dy, dw, dh);
  } else if (wallCanvas) {
    tCtx.drawImage(wallCanvas, 0, 0, canvasWidth, canvasHeight);
  }

  // Draw graffiti (no markers)
  if (corners.length === 4 && graffitiCanvas) {
    drawPerspectiveWarp(tCtx, graffitiCanvas, corners, opacity);
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  const link = document.createElement('a');
  link.download = `${filename}.${ext}`;
  link.href = tempCanvas.toDataURL(mimeType, quality);
  link.click();
}
