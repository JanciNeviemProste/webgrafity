'use client';

interface SaveDialogProps {
  canSave: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SaveDialog({ canSave, onSave, onReset }: SaveDialogProps) {
  return (
    <>
      <button
        onClick={onReset}
        className="shrink-0 cursor-pointer rounded-md border border-white/10 px-3.5 py-1.5 text-[11px] text-gray-300"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        Reset
      </button>

      {canSave && (
        <button
          onClick={onSave}
          className="shrink-0 cursor-pointer rounded-md border-none px-3.5 py-1.5 text-[11px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #ff006e, #8338ec)',
          }}
        >
          &#x1f4be; Ulozit
        </button>
      )}
    </>
  );
}
