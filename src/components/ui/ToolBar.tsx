'use client';

import type { BackgroundMode } from '@/types';

interface ToolBarProps {
  bgMode: BackgroundMode;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onUpload: (file: File) => void;
  cameraError: string | null;
}

export function ToolBar({
  bgMode,
  onStartCamera,
  onStopCamera,
  onUpload,
  cameraError,
}: ToolBarProps) {
  return (
    <div className="shrink-0" style={{ zIndex: 10 }}>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 100%)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg text-base"
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #ff006e, #8338ec)',
            }}
          >
            <span role="img" aria-label="paint">&#x1f3a8;</span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">AR GRAFFITI</div>
            <div className="text-[10px] tracking-widest text-gray-500">
              WALL ART VISUALIZER
            </div>
          </div>
        </div>

        <div className="flex gap-1.5">
          <label
            className="flex cursor-pointer items-center gap-1 rounded-md border border-white/15 px-3 py-1.5 text-[11px]"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            &#x1f4c1; Fotka
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>

          <button
            onClick={bgMode === 'camera' ? onStopCamera : onStartCamera}
            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-[11px] text-white"
            style={{
              background:
                bgMode === 'camera'
                  ? 'rgba(255,0,110,0.3)'
                  : 'rgba(255,255,255,0.1)',
              borderColor:
                bgMode === 'camera'
                  ? 'rgba(255,0,110,0.5)'
                  : 'rgba(255,255,255,0.15)',
            }}
          >
            &#x1f4f7; {bgMode === 'camera' ? 'Stop' : 'Kamera'}
          </button>
        </div>
      </div>

      {cameraError && (
        <div
          className="shrink-0 px-4 py-2 text-center text-xs"
          style={{
            background: 'rgba(255,0,110,0.15)',
            color: '#ff006e',
          }}
        >
          {cameraError}
        </div>
      )}
    </div>
  );
}
