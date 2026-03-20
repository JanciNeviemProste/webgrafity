'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { generateGraffiti, generateWall, DESIGN_LABELS, DESIGN_COLORS } from '@/lib/graffiti-gen';
import { applyGraffitiStyle } from '@/lib/graffiti-style';
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
const HANDLE_SIZE = 20;
const HANDLE_HIT = 30; // hit area bigger than visual

type DragMode = 'none' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

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

function drawHandle(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const half = HANDLE_SIZE / 2;
  ctx.fillStyle = 'rgba(255,0,110,0.85)';
  ctx.fillRect(cx - half, cy - half, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - half, cy - half, HANDLE_SIZE, HANDLE_SIZE);
}

function hitHandle(pt: Point, hx: number, hy: number): boolean {
  const half = HANDLE_HIT / 2;
  return pt.x >= hx - half && pt.x <= hx + half && pt.y >= hy - half && pt.y <= hy + half;
}

// Helper to draw the background to a context
function drawBackground(
  ctx: CanvasRenderingContext2D,
  bgMode: BackgroundMode,
  video: HTMLVideoElement | null,
  bgImage: HTMLImageElement | null,
  wall: HTMLCanvasElement | null
) {
  if (bgMode === 'camera' && video && video.readyState >= 2) {
    const vAspect = video.videoWidth / video.videoHeight;
    const cAspect = CANVAS_W / CANVAS_H;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (vAspect > cAspect) { sw = video.videoHeight * cAspect; sx = (video.videoWidth - sw) / 2; }
    else { sh = video.videoWidth / cAspect; sy = (video.videoHeight - sh) / 2; }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
  } else if (bgMode === 'upload' && bgImage) {
    const iA = bgImage.naturalWidth / bgImage.naturalHeight;
    const cA = CANVAS_W / CANVAS_H;
    let dx = 0, dy = 0, dw = CANVAS_W, dh = CANVAS_H;
    if (iA > cA) { dh = CANVAS_W / iA; dy = (CANVAS_H - dh) / 2; }
    else { dw = CANVAS_H * iA; dx = (CANVAS_W - dw) / 2; }
    ctx.drawImage(bgImage, dx, dy, dw, dh);
  } else if (wall) {
    ctx.drawImage(wall, 0, 0, CANVAS_W, CANVAS_H);
  }
}

export function CanvasOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetsRef = useRef<HTMLCanvasElement[]>([]);
  const wallRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [step, setStep] = useState<StudioStep>('choose-wall');
  const [bgMode, setBgMode] = useState<BackgroundMode>('wall');
  const [overlayImage, setOverlayImage] = useState<CanvasImageSource | null>(null);
  const [styledOverlay, setStyledOverlay] = useState<HTMLCanvasElement | null>(null);
  const [graffitiStyle, setGraffitiStyle] = useState(true);
  const [overlayRect, setOverlayRect] = useState<OverlayRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [usePresets, setUsePresets] = useState(false);
  const [opacity, setOpacity] = useState(0.85);

  // Drag state
  const [dragMode, setDragMode] = useState<DragMode>('none');
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

  // Apply graffiti style when overlay or toggle changes
  useEffect(() => {
    if (overlayImage && graffitiStyle) {
      setStyledOverlay(applyGraffitiStyle(overlayImage));
    } else {
      setStyledOverlay(null);
    }
  }, [overlayImage, graffitiStyle]);

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
    drawBackground(ctx, bgMode, camera.videoRef.current, bgImageRef.current, wallRef.current);

    // Draw overlay image
    const img = (graffitiStyle && styledOverlay) ? styledOverlay : overlayImage;
    if (img && overlayRect.w > 0) {
      // Use multiply blend for graffiti style to pick up wall texture
      if (graffitiStyle) {
        ctx.globalCompositeOperation = 'multiply';
      }
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // If graffiti style, draw again with normal blend at lower opacity for color vibrancy
      if (graffitiStyle) {
        ctx.globalAlpha = opacity * 0.3;
        ctx.drawImage(img, overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
        ctx.globalAlpha = 1;
      }

      // Dashed border
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
      ctx.setLineDash([]);

      // 4 corner handles
      const r = overlayRect;
      drawHandle(ctx, r.x, r.y);                  // TL
      drawHandle(ctx, r.x + r.w, r.y);            // TR
      drawHandle(ctx, r.x, r.y + r.h);            // BL
      drawHandle(ctx, r.x + r.w, r.y + r.h);      // BR
    }
  };

  // Continuous animation for camera mode
  useAnimationFrame(renderFrame, bgMode === 'camera' && step === 'preview');

  // Re-render on state changes (non-camera mode)
  useEffect(() => {
    if (step === 'preview' && bgMode !== 'camera') {
      renderFrame();
    }
  }, [bgMode, overlayImage, styledOverlay, graffitiStyle, overlayRect, opacity, step, renderFrame]);

  // --- Pointer handlers ---

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getCanvasPoint(e);
    if (!overlayImage || overlayRect.w === 0) return;

    const r = overlayRect;
    aspectRef.current = r.w / r.h;
    dragStartRef.current = pt;
    dragRectStartRef.current = { ...r };

    // Check 4 corner handles (check corners before move)
    if (hitHandle(pt, r.x, r.y)) { setDragMode('resize-tl'); return; }
    if (hitHandle(pt, r.x + r.w, r.y)) { setDragMode('resize-tr'); return; }
    if (hitHandle(pt, r.x, r.y + r.h)) { setDragMode('resize-bl'); return; }
    if (hitHandle(pt, r.x + r.w, r.y + r.h)) { setDragMode('resize-br'); return; }

    // Check inside overlay for move
    if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
      setDragMode('move');
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (dragMode === 'none') return;

    const pt = getCanvasPoint(e);
    const dx = pt.x - dragStartRef.current.x;
    const dy = pt.y - dragStartRef.current.y;
    const s = dragRectStartRef.current;
    const ar = aspectRef.current;

    if (dragMode === 'move') {
      setOverlayRect({ x: s.x + dx, y: s.y + dy, w: s.w, h: s.h });
    } else if (dragMode === 'resize-br') {
      const newW = Math.max(40, s.w + dx);
      setOverlayRect({ x: s.x, y: s.y, w: newW, h: newW / ar });
    } else if (dragMode === 'resize-bl') {
      const newW = Math.max(40, s.w - dx);
      const newH = newW / ar;
      setOverlayRect({ x: s.x + s.w - newW, y: s.y, w: newW, h: newH });
    } else if (dragMode === 'resize-tr') {
      const newW = Math.max(40, s.w + dx);
      const newH = newW / ar;
      setOverlayRect({ x: s.x, y: s.y + s.h - newH, w: newW, h: newH });
    } else if (dragMode === 'resize-tl') {
      const newW = Math.max(40, s.w - dx);
      const newH = newW / ar;
      setOverlayRect({ x: s.x + s.w - newW, y: s.y + s.h - newH, w: newW, h: newH });
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

  const handleChangeDesign = () => setStep('choose-design');
  const handleChangeWall = () => { camera.stop(); setStep('choose-wall'); };

  const handleSave = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_W;
    tempCanvas.height = CANVAS_H;
    const tCtx = tempCanvas.getContext('2d')!;

    drawBackground(tCtx, bgMode, camera.videoRef.current, bgImageRef.current, wallRef.current);

    const img = (graffitiStyle && styledOverlay) ? styledOverlay : overlayImage;
    if (img && overlayRect.w > 0) {
      if (graffitiStyle) {
        tCtx.globalCompositeOperation = 'multiply';
      }
      tCtx.globalAlpha = opacity;
      tCtx.drawImage(img, overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
      tCtx.globalAlpha = 1;
      tCtx.globalCompositeOperation = 'source-over';

      if (graffitiStyle) {
        tCtx.globalAlpha = opacity * 0.3;
        tCtx.drawImage(img, overlayRect.x, overlayRect.y, overlayRect.w, overlayRect.h);
        tCtx.globalAlpha = 1;
      }
    }

    const link = document.createElement('a');
    link.download = 'ar-graffiti.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const handleReset = () => {
    setOverlayRect(overlayImage ? centerOverlay(overlayImage) : { x: 0, y: 0, w: 0, h: 0 });
  };

  const cursorStyle = () => {
    if (dragMode === 'move') return 'grabbing';
    if (dragMode !== 'none') return 'nwse-resize';
    return 'default';
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

      {/* Step 1 */}
      {step === 'choose-wall' && (
        <WallPrompt
          onStartCamera={handleStartCamera}
          onUploadWall={handleUploadWall}
          onUseDemoWall={handleUseDemoWall}
          cameraError={camera.error}
        />
      )}

      {/* Step 2 */}
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
            Tahaj obrazok pre presun. Tahaj ruzove rohy pre zmenu velkosti.
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
              style={{ objectFit: 'contain', cursor: cursorStyle() }}
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
              {/* Graffiti style toggle */}
              <button
                onClick={() => setGraffitiStyle(!graffitiStyle)}
                className="shrink-0 rounded-md border px-3 py-1.5 text-[11px] font-bold"
                style={{
                  borderColor: graffitiStyle ? '#ff006e' : 'rgba(255,255,255,0.15)',
                  background: graffitiStyle ? 'rgba(255,0,110,0.2)' : 'rgba(255,255,255,0.05)',
                  color: graffitiStyle ? '#ff006e' : '#888',
                }}
              >
                &#x1f3a8; Graffiti
              </button>

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
