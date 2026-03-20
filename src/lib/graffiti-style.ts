/**
 * Applies a spray-paint / stencil graffiti look to an image.
 * Preserves alpha channel so it blends naturally on the wall.
 */
export function applyGraffitiStyle(source: CanvasImageSource): HTMLCanvasElement {
  // Get dimensions
  let sw: number, sh: number;
  if (source instanceof HTMLImageElement) {
    sw = source.naturalWidth;
    sh = source.naturalHeight;
  } else if (source instanceof HTMLCanvasElement) {
    sw = source.width;
    sh = source.height;
  } else {
    sw = 400;
    sh = 300;
  }

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;

  // Draw source
  ctx.drawImage(source, 0, 0, sw, sh);
  const imageData = ctx.getImageData(0, 0, sw, sh);
  const data = imageData.data;

  // 1. Posterize (reduce to ~6 levels per channel) + boost contrast
  const levels = 6;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue; // skip transparent

    for (let c = 0; c < 3; c++) {
      let val = data[i + c];
      // Boost contrast
      val = ((val / 255 - 0.5) * 1.4 + 0.5) * 255;
      val = Math.max(0, Math.min(255, val));
      // Posterize
      val = Math.round(val / step) * step;
      // Boost saturation slightly
      data[i + c] = Math.max(0, Math.min(255, val));
    }
  }

  // 2. Edge darkening (simple Sobel-like detection)
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = sw;
  edgeCanvas.height = sh;
  const edgeCtx = edgeCanvas.getContext('2d')!;
  edgeCtx.putImageData(imageData, 0, 0);
  const edgeData = edgeCtx.getImageData(0, 0, sw, sh);
  const ed = edgeData.data;

  // Compute luminance-based edge strength
  const lum = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    const idx = i * 4;
    lum[i] = (ed[idx] * 0.299 + ed[idx + 1] * 0.587 + ed[idx + 2] * 0.114) * (ed[idx + 3] / 255);
  }

  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const idx = (y * sw + x) * 4;
      if (data[idx + 3] < 10) continue;

      const gx =
        -lum[(y - 1) * sw + (x - 1)] + lum[(y - 1) * sw + (x + 1)] +
        -2 * lum[y * sw + (x - 1)] + 2 * lum[y * sw + (x + 1)] +
        -lum[(y + 1) * sw + (x - 1)] + lum[(y + 1) * sw + (x + 1)];
      const gy =
        -lum[(y - 1) * sw + (x - 1)] - 2 * lum[(y - 1) * sw + x] - lum[(y - 1) * sw + (x + 1)] +
        lum[(y + 1) * sw + (x - 1)] + 2 * lum[(y + 1) * sw + x] + lum[(y + 1) * sw + (x + 1)];

      const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 100);

      // Darken edges
      data[idx] = Math.max(0, data[idx] - edge * 60);
      data[idx + 1] = Math.max(0, data[idx + 1] - edge * 60);
      data[idx + 2] = Math.max(0, data[idx + 2] - edge * 60);
    }
  }

  // 3. Spray overspray effect — random semi-transparent dots near alpha edges
  // Find alpha boundary pixels
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const idx = (y * sw + x) * 4;
      const a = data[idx + 3];

      // Check if this is near an alpha edge
      const neighbors = [
        data[((y - 1) * sw + x) * 4 + 3],
        data[((y + 1) * sw + x) * 4 + 3],
        data[(y * sw + (x - 1)) * 4 + 3],
        data[(y * sw + (x + 1)) * 4 + 3],
      ];

      const isEdge = a > 20 && neighbors.some((n) => n < 20);

      if (isEdge) {
        // Scatter spray dots in a radius
        for (let s = 0; s < 3; s++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 2 + Math.random() * 8;
          const sx = Math.round(x + Math.cos(angle) * dist);
          const sy = Math.round(y + Math.sin(angle) * dist);
          if (sx < 0 || sx >= sw || sy < 0 || sy >= sh) continue;

          const si = (sy * sw + sx) * 4;
          if (data[si + 3] > 0) continue; // don't overwrite existing pixels

          data[si] = data[idx];
          data[si + 1] = data[idx + 1];
          data[si + 2] = data[idx + 2];
          data[si + 3] = Math.round(30 + Math.random() * 60);
        }
      }
    }
  }

  // 4. Add subtle noise to non-transparent areas (spray paint texture)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue;
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
