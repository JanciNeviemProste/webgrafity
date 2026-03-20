'use client';

import type { SelectionPhase } from '@/types';

interface CornerSelectorProps {
  phase: SelectionPhase;
  cornerCount: number;
}

const CORNER_NAMES = ['pravy horny', 'pravy dolny', 'lavy dolny'];

export function CornerSelector({ phase, cornerCount }: CornerSelectorProps) {
  let message = '';

  if (phase === 'selecting' && cornerCount === 0) {
    message = 'Tukni na 4 rohy steny — lavy horny \u2192 pravy horny \u2192 pravy dolny \u2192 lavy dolny';
  } else if (phase === 'selecting' && cornerCount > 0 && cornerCount < 4) {
    message = `Bod ${cornerCount}/4 hotovy — tukni dalsi roh (${CORNER_NAMES[cornerCount - 1]})`;
  } else if (phase === 'complete') {
    message = 'Graffiti umiestnene! Tahaj rohy pre upravu. Vyber dizajn dole.';
  }

  return (
    <div
      className="shrink-0 border-b border-white/5 px-4 py-2 text-center text-sm"
      style={{
        background: 'rgba(255,255,255,0.05)',
        color: phase === 'selecting' ? '#ffbe0b' : '#aaa',
      }}
    >
      {message}
    </div>
  );
}
