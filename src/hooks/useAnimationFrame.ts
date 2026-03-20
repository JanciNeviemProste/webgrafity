'use client';

import { useEffect, useRef } from 'react';

export function useAnimationFrame(
  callback: () => void,
  isActive: boolean
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!isActive) return;

    let running = true;
    let frameId: number;

    const loop = () => {
      if (!running) return;
      callbackRef.current();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [isActive]);
}
