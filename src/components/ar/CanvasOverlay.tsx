'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { generateGraffiti, generateWall, DESIGN_LABELS, DESIGN_COLORS } from '@/lib/graffiti-gen';
import { useCamera } from '@/hooks/useCamera';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { DesignGallery } from '@/components/ui/DesignGallery';
import { OpacitySlider } from '@/components/ui/OpacitySlider';
import { SaveDialog } from '@/components/ui/SaveDialog';
import { WallPrompt } from '@/components/ui/WallPrompt';
import { DesignUploader } from '@/components/ui/DesignUploader';
import type { BackgroundMode, StudioStep, Point, OverlayRect } from '@/types';

const CANVAS_W = 900;
const CANVAS_H = 600;
const HANDLE_SIZE = 24;

function getImageNaturalSize(img: CanvasImageSource): { w: number; h: number } {
  if (img instanceof HTMLImageElement) return { w: img.naturalWidth, h: img.naturalHeight };
  if (img instanceof HTMLCanvasElement) return { w: img.width, h: img.height };
  return { w: 400, h: 300 };
}

function centerOverlay(img: CanvasImageSource): OverlayRect {
  const { w: iw, h: ih } = getImageNaturalSize(img);
  const maxW = CANVAS_W * 0.5;
  const maxH = CANVAS_H * 0.5;
  const scale = Math.min(maxW / iw, maxH / ih, 1);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (CANVAS_W - w) / 2, y: (CANVAS_H - h) / 2, w, h };
}

export function CanvasOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetsRef = useRef<HTMLCanvasElement[]>([]);
  const wallRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [step, setStep] = useState<StudioStep>('choose-wall');
  const [bgMode, setBgMode] = useState<BackgroundMode>('wall');
  const [overlayImage, setOverlayImage] = useState<CanvasImageSource | null>(null);
  const [overlayRect, setOverlayRect] = useState<OverlayRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [usePresets, setUsePresets] = useState(false);
  const [opacity, setOpacity] = useState(0.85);

  // Drag state
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize'>('none');
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const dragRectStartRef = useRef<OverlayRect>({ x: 0, y: 0, w: 0, h: 0 });
  const aspectRef = useRef(1);

  const camera = useCamera();
  const bgRemoval = useBackgroundRemoval();

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
      let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
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
      let dx = 0, dy = 0, dw = CANVAS_W, dh = CANVAS_H;
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

    // Draw overlay image
    if (overlayImage && overlayRect.w > 0) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(overlayImage, overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
      ctx.globalAlpha = 1;

      // Dashed border
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
      ctx.setLineDash([]);

      // Resize handle (bottom-right corner)
      const hx = overlayRect.x + overlayRect.w - HANDLE_SIZE;
      const hy = overlayRect.y + overlayRect.h - HANDLE_SIZE;
      ctx.fillStyle = 'rgba(255,0,110,0.8)';
      ctx.fillRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE);

      // Small arrows in handle
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2922', hx + HANDLE_SIZE / 2, hy + HANDLE_SIZE / 2);
    }
  };

  // Continuous animation for camera mode
  useAnimationFrame(renderFrame, bgMode === 'camera' && step === 'preview');

  // Re-render on state changes (non-camera mode)
  useEffect(() => {
    if (step === 'preview' && bgMode !== 'camera') {
      renderFrame();
    }
  }, [bgMode, overlayImage, overlayRect, opacity, step, renderFrame]);

  // --- Pointer handlers ---

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getCanvasPoint(e);

    if (!overlayImage || overlayRect.w === 0) return;

    // Check resize handle first
    const hx = overlayRect.x + overlayRect.w - HANDLE_SIZE;
    const hy = overlayRect.y + overlayRect.h - HANDLE_SIZE;
    if (pt.x >= hx && pt.x <= hx + HANDLE_SIZE && pt.y >= hy && pt.y <= hy + HANDLE_SIZE) {
      setDragMode('resize');
      dragStartRef.current = pt;
      dragRectStartRef.current = { ...overlayRect };
      aspectRef.current = overlayRect.w / overlayRect.h;
      return;
    }

    // Check if inside overlay rect
    if (
      pt.x >= overlayRect.x && pt.x <= overlayRect.x + overlayRect.w &&
      pt.y >= overlayRect.y && pt.y <= overlayRect.y + overlayRect.h
    ) {
      setDragMode('move');
      dragStartRef.current = pt;
      dragRectStartRef.current = { ...overlayRect };
      return;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (dragMode === 'none') return;

    const pt = getCanvasPoint(e);
    const dx = pt.x - dragStartRef.current.x;
    const dy = pt.y - dragStartRef.current.y;
    const start = dragRectStartRef.current;

    if (dragMode === 'move') {
      setOverlayRect({ ...start, x: start.x + dx, y: start.y + dy });
    } else if (dragMode === 'resize') {
      // Preserve aspect ratio
      const newW = Math.max(40, start.w + dx);
      const newH = newW / aspectRef.current;
      setOverlayRect({ ...start, w: newW, h: newH });
    }
  };

  const onPointerUp = () => {
    setDragMode('none');
  };

  // --- Step handlers ---

  const handleStartCamera = async () => {
    await camera.start();
    setBgMode('camera');
    if (step === 'choose-wall') setStep('choose-design');
  };

  const handleUploadWall = (file: File) => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgMode('upload');
      if (step === 'choose-wall') setStep('choose-design');
    };
    img.src = URL.createObjectURL(file);
  };

  const handleUseDemoWall = () => {
    setBgMode('wall');
    setStep('choose-design');
  };

  const handleDesignUpload = async (file: File) => {
    const result = await bgRemoval.processImage(file);
    if (result) {
      setOverlayImage(result);
      setOverlayRect(centerOverlay(result));
      setUsePresets(false);
      setStep('preview');
    }
  };

  const handleUsePresets = () => {
    setUsePresets(true);
    const preset = presetsRef.current[selectedPreset];
    if (preset) {
      setOverlayImage(preset);
      setOverlayRect(centerOverlay(preset));
    }
    setStep('preview');
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    const preset = presetsRef.current[index];
    if (usePresets && preset) {
      setOverlayImage(preset);
      setOverlayRect(centerOverlay(preset));
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_W;
    tempCanvas.height = CANVAS_H;
    const tCtx = tempCanvas.getContext('2d')!;

    // Draw background
    if (bgMode === 'camera' && camera.videoRef.current && camera.videoRef.current.readyState >= 2) {
      const v = camera.videoRef.current;
      const vA = v.videoWidth / v.videoHeight;
      const cA = CANVAS_W / CANVAS_H;
      let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
      if (vA > cA) { sw = v.videoHeight * cA; sx = (v.videoWidth - sw) / 2; }
      else { sh = v.videoWidth / cA; sy = (v.videoHeight - sh) / 2; }
      tCtx.drawImage(v, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
    } else if (bgMode === 'upload' && bgImageRef.current) {
      const img = bgImageRef.current;
      const iA = img.naturalWidth / img.naturalHeight;
      const cA = CANVAS_W / CANVAS_H;
      let dx = 0, dy = 0, dw = CANVAS_W, dh = CANVAS_H;
      if (iA > cA) { dh = CANVAS_W / iA; dy = (CANVAS_H - dh) / 2; }
      else { dw = CANVAS_H * iA; dx = (CANVAS_W - dw) / 2; }
      tCtx.drawImage(img, dx, dy, dw, dh);
    } else if (wallRef.current) {
      tCtx.drawImage(wallRef.current, 0, 0, CANVAS_W, CANVAS_H);
    }

    // Draw overlay (no handles/borders)
    if (overlayImage && overlayRect.w > 0) {
      tCtx.globalAlpha = opacity;
      tCtx.drawImage(overlayImage, overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
      tCtx.globalAlpha = 1;
    }

    const link = document.createElement('a');
    link.download = 'ar-graffiti.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const handleReset = () => {
    setOverlayRect(overlayImage ? centerOverlay(overlayImage) : { x: 0, y: 0, w: 0, h: 0 });
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
      {/* Header */}
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
            {step === 'preview' && (
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

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <>
          <div
            className="shrink-0 border-b border-white/5 px-4 py-2 text-center text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}
          >
            Tahaj obrazok pre presun. Tahaj ruzovy roh pre zmenu velkosti.
          </div>

          <div className="relative flex-1 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="block h-full w-full"
              style={{
                objectFit: 'contain',
                cursor: dragMode === 'move' ? 'grabbing' : dragMode === 'resize' ? 'nwse-resize' : 'default',
              }}
            />
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
                canSave={overlayImage !== null}
                onSave={handleSave}
                onReset={handleReset}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
