'use client';

import { useState, useCallback } from 'react';
import type { Point, SelectionPhase } from '@/types';

const HIT_RADIUS = 25;

export interface UseCornerSelectionReturn {
  corners: Point[];
  phase: SelectionPhase;
  dragging: number;
  handlePointerDown: (point: Point) => void;
  handlePointerMove: (point: Point) => void;
  handlePointerUp: () => void;
  reset: () => void;
}

export function useCornerSelection(): UseCornerSelectionReturn {
  const [corners, setCorners] = useState<Point[]>([]);
  const [phase, setPhase] = useState<SelectionPhase>('selecting');
  const [dragging, setDragging] = useState(-1);

  const handlePointerDown = useCallback(
    (pt: Point) => {
      if (phase === 'complete' && corners.length === 4) {
        const idx = corners.findIndex(
          (c) => Math.hypot(c.x - pt.x, c.y - pt.y) < HIT_RADIUS
        );
        if (idx >= 0) {
          setDragging(idx);
          return;
        }
      }

      if (phase === 'selecting' && corners.length < 4) {
        const next = [...corners, pt];
        setCorners(next);
        if (next.length === 4) {
          setPhase('complete');
        }
      }
    },
    [corners, phase]
  );

  const handlePointerMove = useCallback(
    (pt: Point) => {
      if (dragging < 0) return;
      setCorners((prev) => prev.map((c, i) => (i === dragging ? pt : c)));
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(-1);
  }, []);

  const reset = useCallback(() => {
    setCorners([]);
    setPhase('selecting');
    setDragging(-1);
  }, []);

  return {
    corners,
    phase,
    dragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    reset,
  };
}
