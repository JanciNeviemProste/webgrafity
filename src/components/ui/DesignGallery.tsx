'use client';

interface DesignGalleryProps {
  labels: string[];
  colors: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function DesignGallery({
  labels,
  colors,
  selectedIndex,
  onSelect,
}: DesignGalleryProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 pb-1.5 pt-2.5"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {labels.map((label, i) => {
        const isSelected = selectedIndex === i;
        const color = colors[i];
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="shrink-0 rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition-all"
            style={{
              border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
              background: isSelected
                ? `${color}22`
                : 'rgba(255,255,255,0.05)',
              color: isSelected ? color : '#888',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
