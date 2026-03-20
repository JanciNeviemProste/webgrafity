'use client';

interface DesignUploaderProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
  hasResult: boolean;
  error: string | null;
  onUsePresets: () => void;
}

export function DesignUploader({
  onUpload,
  isProcessing,
  hasResult,
  error,
  onUsePresets,
}: DesignUploaderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
        style={{ background: 'linear-gradient(135deg, #fb5607, #ffbe0b)' }}
      >
        &#x1f3a8;
      </div>

      <div>
        <h2 className="mb-2 text-2xl font-bold">Krok 2: Nahraj dizajn</h2>
        <p className="text-sm text-gray-400">
          Nahraj obr&#xe1;zok graffiti, loga alebo &#x10d;oho&#x13e;vek. Pozadie sa automaticky odstr&#xe1;ni.
        </p>
      </div>

      {isProcessing ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: '#ff006e', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-400">Odstra&#x148;ujem pozadie...</p>
        </div>
      ) : (
        <label
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #ff006e, #8338ec)' }}
        >
          &#x1f4c1; {hasResult ? 'Zmeni\u0165 obr\u00e1zok' : 'Nahra\u0165 obr\u00e1zok'}
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
      )}

      {error && (
        <p className="text-xs" style={{ color: '#ff006e' }}>
          {error}
        </p>
      )}

      <button
        onClick={onUsePresets}
        className="text-xs text-gray-600 underline transition-colors hover:text-gray-400"
      >
        Pou&#x17e;i&#x165; predpripraven&#xe9; dizajny
      </button>
    </div>
  );
}
