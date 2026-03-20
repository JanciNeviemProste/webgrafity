'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { startCameraStream, stopCameraStream, createVideoElement } from '@/lib/camera';
import type { CameraOptions } from '@/types';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useCamera(options?: CameraOptions): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
    videoRef.current = null;
    setIsActive(false);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await startCameraStream(options);
      streamRef.current = stream;
      videoRef.current = createVideoElement(stream);
      setIsActive(true);
      setError(null);
    } catch {
      setError('Kamera nie je dostupna. Pouzi fotku alebo demo stenu.');
    }
  }, [options]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
      }
    };
  }, []);

  return { videoRef, isActive, error, start, stop };
}
