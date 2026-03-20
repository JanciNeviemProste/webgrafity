import { Point } from '@/types';

export const DEFAULT_GRID_SIZE = 16;

function getImageSize(img: CanvasImageSource): { width: number; height: number } {
  if (img instanceof HTMLImageElement) return { width: img.naturalWidth, height: img.naturalHeight };
  if (img instanceof HTMLVideoElement) return { width: img.videoWidth, height: img.videoHeight };
  return { width: (img as HTMLCanvasElement).width, height: (img as HTMLCanvasElement).height };
}

export function bilerp(corners: Point[], u: number, v: number): Point {
  return {
    x:
      (1 - u) * (1 - v) * corners[0].x +
      u * (1 - v) * corners[1].x +
      u * v * corners[2].x +
      (1 - u) * v * corners[3].x,
    y:
      (1 - u) * (1 - v) * corners[0].y +
      u * (1 - v) * corners[1].y +
      u * v * corners[2].y +
      (1 - u) * v * corners[3].y,
  };
}

export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  src: [Point, Point, Point],
  dst: [Point, Point, Point]
): void {
  const [s0, s1, s2] = src;
  const [d0, d1, d2] = dst;

  const det =
    (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y);
  if (Math.abs(det) < 0.5) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();

  const a =
    ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) / det;
  const b =
    ((d1.x - d2.x) * (s0.x - s2.x) - (d0.x - d2.x) * (s1.x - s2.x)) / det;
  const tx = d0.x - a * s0.x - b * s0.y;
  const c2 =
    ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) / det;
  const d2v =
    ((d1.y - d2.y) * (s0.x - s2.x) - (d0.y - d2.y) * (s1.x - s2.x)) / det;
  const ty = d0.y - c2 * s0.x - d2v * s0.y;

  ctx.setTransform(a, c2, b, d2v, tx, ty);
  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.restore();
}

export function drawPerspectiveWarp(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  corners: Point[],
  opacity: number,
  gridSize: number = DEFAULT_GRID_SIZE
): void {
  if (!img || corners.length !== 4) return;

  ctx.globalAlpha = opacity;
  const { width: w, height: h } = getImageSize(img);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const u0 = i / gridSize;
      const u1 = (i + 1) / gridSize;
      const v0 = j / gridSize;
      const v1 = (j + 1) / gridSize;

      const s00: Point = { x: u0 * w, y: v0 * h };
      const s10: Point = { x: u1 * w, y: v0 * h };
      const s01: Point = { x: u0 * w, y: v1 * h };
      const s11: Point = { x: u1 * w, y: v1 * h };

      const d00 = bilerp(corners, u0, v0);
      const d10 = bilerp(corners, u1, v0);
      const d01 = bilerp(corners, u0, v1);
      const d11 = bilerp(corners, u1, v1);

      drawTriangle(ctx, img, [s00, s10, s01], [d00, d10, d01]);
      drawTriangle(ctx, img, [s10, s11, s01], [d10, d11, d01]);
    }
  }

  ctx.globalAlpha = 1;
}
