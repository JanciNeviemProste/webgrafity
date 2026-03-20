'use client';

interface OpacitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function OpacitySlider({ value, onChange }: OpacitySliderProps) {
  return (
    <>
      <span className="shrink-0 text-[11px] text-gray-600">
        Priehladnost
      </span>
      <input
        type="range"
        min="0.1"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 flex-1"
        style={{ accentColor: '#ff006e' }}
      />
      <span className="w-8 text-right text-[11px] text-gray-600">
        {Math.round(value * 100)}%
      </span>
    </>
  );
}
