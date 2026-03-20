'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { generateGraffiti, generateWall, DESIGN_LABELS, DESIGN_COLORS } from '@/lib/graffiti-gen';
import { exportCanvas } from '@/lib/export';
import { useCamera } from '@/hooks/useCamera';
import { useCornerSelection } from '@/hooks/useCornerSelection';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { usePerspectiveWarp } from '@/hooks/usePerspectiveWarp';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { CornerSelector } from '@/components/ar/CornerSelector';
import { DesignGallery } from '@/components/ui/DesignGallery';
import { OpacitySlider } from '@/components/ui/OpacitySlider';
import { SaveDialog } from '@/components/ui/SaveDialog';
import { WallPrompt } from '@/components/ui/WallPrompt';
import { DesignUploader } from '@/components/ui/DesignUploader';
import type { BackgroundMode, StudioStep, Point } from '@/types';

const CANVAS_W = 900;
const CANVAS_H = 600;

export function CanvasOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetsRef = useRef<HTMLCanvasElement[]>([]);
  const wallRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [step, setStep] = useState<StudioStep>('choose-wall');
  const [bgMode, setBgMode] = useState<BackgroundMode>('wall');
  const [overlayImage, setOverlayImage] = useState<CanvasImageSource | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [usePresets, setUsePresets] = useState(false);
  const [opacity, setOpacity] = useState(0.85);

  const camera = useCamera();
  const bgRemoval = useBackgroundRemoval();
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

  // Generate presets and wall on mount
  useEffect(() => {
    presetsRef.current = Array.from({ length: 5 }, (_, i) => generateGraffiti(i));
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
      const iAspect = img.naturalWidth / img.naturalHeight;
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
    renderWarp(ctx, corners, overlayImage, opacity, phase, dragging);
  };

  // Continuous animation for camera mode
  useAnimationFrame(renderFrame, bgMode === 'camera' && step === 'place-graffiti');

  // Re-render on state changes (non-camera mode)
  useEffect(() => {
    if (step === 'place-graffiti' && bgMode !== 'camera') {
      renderFrame();
    }
  }, [bgMode, corners, overlayImage, opacity, step, renderFrame]);

  // --- Step handlers ---

  const handleStartCamera = async () => {
    await camera.start();
    setBgMode('camera');
    reset();
    if (step === 'choose-wall') {
      setStep('choose-design');
    }
  };

  const handleUploadWall = (file: File) => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgMode('upload');
      reset();
      if (step === 'choose-wall') {
        setStep('choose-design');
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const handleUseDemoWall = () => {
    setBgMode('wall');
    reset();
    setStep('choose-design');
  };

  const handleDesignUpload = async (file: File) => {
    const result = await bgRemoval.processImage(file);
    if (result) {
      setOverlayImage(result);
      setUsePresets(false);
      setStep('place-graffiti');
    }
  };

  const handleUsePresets = () => {
    setUsePresets(true);
    if (presetsRef.current[selectedPreset]) {
      setOverlayImage(presetsRef.current[selectedPreset]);
    }
    setStep('place-graffiti');
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    if (usePresets && presetsRef.current[index]) {
      setOverlayImage(presetsRef.current[index]);
    }
  };

  const handleChangeDesign = () => {
    setStep('choose-design');
  };

  const handleChangeWall = () => {
    camera.stop();
    setStep('choose-wall');
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
      overlayImage,
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
      {/* Header - always visible */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2.5"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 100%)',
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg text-base"
            style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #ff006e, #8338ec)' }}
          >
            &#x1f3a8;
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">AR GRAFFITI</div>
            <div className="text-[10px] tracking-widest text-gray-500">WALL ART VISUALIZER</div>
          </div>
        </div>

        {step !== 'choose-wall' && (
          <div className="flex gap-1.5">
            {step === 'place-graffiti' && (
              <button
                onClick={handleChangeDesign}
                className="rounded-md border border-white/15 px-3 py-1.5 text-[11px]"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                &#x1f3a8; Zmenit dizajn
              </button>
            )}
            <button
              onClick={handleChangeWall}
              className="rounded-md border border-white/15 px-3 py-1.5 text-[11px]"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              &#x1f4f7; Zmenit stenu
            </button>
          </div>
        )}
      </div>

      {/* Step 1: Choose wall */}
      {step === 'choose-wall' && (
        <WallPrompt
          onStartCamera={handleStartCamera}
          onUploadWall={handleUploadWall}
          onUseDemoWall={handleUseDemoWall}
          cameraError={camera.error}
        />
      )}

      {/* Step 2: Choose design */}
      {step === 'choose-design' && (
        <DesignUploader
          onUpload={handleDesignUpload}
          isProcessing={bgRemoval.isProcessing}
          hasResult={overlayImage !== null && !usePresets}
          error={bgRemoval.error}
          onUsePresets={handleUsePresets}
        />
      )}

      {/* Step 3: Place graffiti */}
      {step === 'place-graffiti' && (
        <>
          <CornerSelector phase={phase} cornerCount={corners.length} />

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
                  style={{ width: 80, height: 80, border: '2px dashed rgba(255,255,255,0.3)' }}
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
              background: 'linear-gradient(0deg, rgba(10,10,15,1) 0%, rgba(10,10,15,0.95) 100%)',
            }}
          >
            {usePresets && (
              <DesignGallery
                labels={DESIGN_LABELS}
                colors={DESIGN_COLORS}
                selectedIndex={selectedPreset}
                onSelect={handlePresetSelect}
              />
            )}

            <div className="flex items-center gap-3 px-4 pb-3 pt-2">
              <OpacitySlider value={opacity} onChange={setOpacity} />
              <SaveDialog
                canSave={corners.length === 4}
                onSave={handleSave}
                onReset={reset}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
