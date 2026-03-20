'use client';

import { useState, useCallback } from 'react';
import { removeImageBackground } from '@/lib/background-removal';

export interface UseBackgroundRemovalReturn {
  processImage: (file: File) => Promise<HTMLImageElement | null>;
  isProcessing: boolean;
  error: string | null;
  reset: () => void;
}

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File): Promise<HTMLImageElement | null> => {
    setIsProcessing(true);
    setError(null);
    try {
      const img = await removeImageBackground(file);
      return img;
    } catch {
      setError('Nepodarilo sa odstranit pozadie. Skus iny obrazok.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsProcessing(false);
  }, []);

  return { processImage, isProcessing, error, reset };
}
