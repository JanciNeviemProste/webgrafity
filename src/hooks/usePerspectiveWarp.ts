'use client';

import { useCallback } from 'react';
import { drawPerspectiveWarp } from '@/lib/perspective';
import type { Point } from '@/types';

const CORNER_COLORS = ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec'];

export function usePerspectiveWarp() {
  const renderWarp = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      corners: Point[],
      graffitiCanvas: CanvasImageSource | null,
      opacity: number,
      phase: string,
      dragging: number
    ) => {
      if (corners.length === 4 && graffitiCanvas) {
        drawPerspectiveWarp(ctx, graffitiCanvas, corners, opacity);

        // Draw edge lines
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        corners.forEach((c, i) => {
          i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw partial connecting lines while selecting
      if (corners.length > 0 && corners.length < 4) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        corners.forEach((c, i) => {
          i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw corner markers
      corners.forEach((c, i) => {
        const isActive = phase === 'selecting' || dragging === i;
        ctx.beginPath();
        ctx.arc(c.x, c.y, isActive ? 14 : 10, 0, Math.PI * 2);
        ctx.fillStyle = CORNER_COLORS[i] || '#fff';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), c.x, c.y);
      });
    },
    []
  );

  return { renderWarp };
}
