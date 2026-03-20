'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { generateGraffiti, generateWall, DESIGN_LABELS, DESIGN_COLORS } from '@/lib/graffiti-gen';
import { exportCanvas } from '@/lib/export';
import { useCamera } from '@/hooks/useCamera';
import { useCornerSelection } from '@/hooks/useCornerSelection';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { usePerspectiveWarp } from '@/hooks/usePerspectiveWarp';
import { CornerSelector } from '@/components/ar/CornerSelector';
import { ToolBar } from '@/components/ui/ToolBar';
import { DesignGallery } from '@/components/ui/DesignGallery';
import { OpacitySlider } from '@/components/ui/OpacitySlider';
import { SaveDialog } from '@/components/ui/SaveDialog';
import type { BackgroundMode, Point } from '@/types';

const CANVAS_W = 900;
const CANVAS_H = 600;

export function CanvasOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graffitiRef = useRef<HTMLCanvasElement[]>([]);
  const wallRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [bgMode, setBgMode] = useState<BackgroundMode>('wall');
  const [selectedDesign, setSelectedDesign] = useState(0);
  const [opacity, setOpacity] = useState(0.85);

  const camera = useCamera();
  const {
    corners,
    phase,
    dragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    reset,
  } = useCornerSelection();
  const { renderWarp } = usePerspectiveWarp();

  // Generate graffiti designs and wall on mount
  useEffect(() => {
    graffitiRef.current = Array.from({ length: 5 }, (_, i) => generateGraffiti(i));
    wallRef.current = generateWall();
  }, []);

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw background
    const video = camera.videoRef.current;
    if (bgMode === 'camera' && video && video.readyState >= 2) {
      const vAspect = video.videoWidth / video.videoHeight;
      const cAspect = CANVAS_W / CANVAS_H;
      let sx = 0,
        sy = 0,
        sw = video.videoWidth,
        sh = video.videoHeight;
      if (vAspect > cAspect) {
        sw = video.videoHeight * cAspect;
        sx = (video.videoWidth - sw) / 2;
      } else {
        sh = video.videoWidth / cAspect;
        sy = (video.videoHeight - sh) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
    } else if (bgMode === 'upload' && bgImageRef.current) {
      const img = bgImageRef.current;
      const iAspect = img.width / img.height;
      const cAspect = CANVAS_W / CANVAS_H;
      let dx = 0,
        dy = 0,
        dw = CANVAS_W,
        dh = CANVAS_H;
      if (iAspect > cAspect) {
        dh = CANVAS_W / iAspect;
        dy = (CANVAS_H - dh) / 2;
      } else {
        dw = CANVAS_H * iAspect;
        dx = (CANVAS_W - dw) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else if (wallRef.current) {
      ctx.drawImage(wallRef.current, 0, 0, CANVAS_W, CANVAS_H);
    }

    // Draw perspective warp + corners
    renderWarp(
      ctx,
      corners,
      graffitiRef.current[selectedDesign] || null,
      opacity,
      phase,
      dragging
    );
  };

  // Continuous animation for camera mode
  useAnimationFrame(renderFrame, bgMode === 'camera');

  // Re-render on state changes (non-camera mode)
  useEffect(() => {
    if (bgMode !== 'camera') {
      renderFrame();
    }
  }, [bgMode, corners, selectedDesign, opacity, renderFrame]);

  const handleStartCamera = async () => {
    await camera.start();
    setBgMode('camera');
    reset();
  };

  const handleStopCamera = () => {
    camera.stop();
    setBgMode('wall');
  };

  const handleUpload = (file: File) => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgMode('upload');
      reset();
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSave = () => {
    exportCanvas(
      bgMode,
      camera.videoRef.current,
      bgImageRef.current,
      wallRef.current,
      CANVAS_W,
      CANVAS_H,
      corners,
      graffitiRef.current[selectedDesign] || null,
      opacity
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handlePointerDown(getCanvasPoint(e));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handlePointerMove(getCanvasPoint(e));
  };

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden"
      style={{
        background: '#0a0a0f',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#fff',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <ToolBar
        bgMode={bgMode}
        onStartCamera={handleStartCamera}
        onStopCamera={handleStopCamera}
        onUpload={handleUpload}
        cameraError={camera.error}
      />

      <CornerSelector phase={phase} cornerCount={corners.length} />

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block h-full w-full"
          style={{
            objectFit: 'contain',
            cursor:
              phase === 'selecting'
                ? 'crosshair'
                : dragging >= 0
                  ? 'grabbing'
                  : 'default',
          }}
        />

        {corners.length === 0 && phase === 'selecting' && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div
              className="mx-auto mb-3 flex items-center justify-center rounded-full text-3xl"
              style={{
                width: 80,
                height: 80,
                border: '2px dashed rgba(255,255,255,0.3)',
              }}
            >
              &#x1f446;
            </div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Oznac 4 rohy steny
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div
        className="shrink-0 border-t border-white/[0.08]"
        style={{
          background:
            'linear-gradient(0deg, rgba(10,10,15,1) 0%, rgba(10,10,15,0.95) 100%)',
        }}
      >
        <DesignGallery
          labels={DESIGN_LABELS}
          colors={DESIGN_COLORS}
          selectedIndex={selectedDesign}
          onSelect={setSelectedDesign}
        />

        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <OpacitySlider value={opacity} onChange={setOpacity} />
          <SaveDialog
            canSave={corners.length === 4}
            onSave={handleSave}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
