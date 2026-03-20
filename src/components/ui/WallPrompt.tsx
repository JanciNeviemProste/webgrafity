'use client';

interface WallPromptProps {
  onStartCamera: () => void;
  onUploadWall: (file: File) => void;
  onUseDemoWall: () => void;
  cameraError: string | null;
}

export function WallPrompt({
  onStartCamera,
  onUploadWall,
  onUseDemoWall,
  cameraError,
}: WallPromptProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
        style={{ background: 'linear-gradient(135deg, #ff006e, #8338ec)' }}
      >
        &#x1f4f7;
      </div>

      <div>
        <h2 className="mb-2 text-2xl font-bold">Krok 1: Odfo&#x165; stenu</h2>
        <p className="text-sm text-gray-400">
          Odfo&#x165; re&#xe1;lnu stenu kde chce&#x161; ma&#x13e;ova&#x165;, alebo nahraj fotku.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onStartCamera}
          className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #ff006e, #8338ec)' }}
        >
          &#x1f4f7; Pou&#x17e;i&#x165; kameru
        </button>

        <label
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition-transform hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          &#x1f4c1; Nahra&#x165; fotku
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadWall(file);
            }}
          />
        </label>
      </div>

      {cameraError && (
        <p className="text-xs" style={{ color: '#ff006e' }}>
          {cameraError}
        </p>
      )}

      <button
        onClick={onUseDemoWall}
        className="text-xs text-gray-600 underline transition-colors hover:text-gray-400"
      >
        Pou&#x17e;i&#x165; demo stenu (na testovanie)
      </button>
    </div>
  );
}
