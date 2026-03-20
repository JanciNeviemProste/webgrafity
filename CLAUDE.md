# AR GRAFFITI — Wall Art Visualizer

## Popis projektu
Web-based AR aplikácia na vizualizáciu graffiti/street artu na reálnych stenách. Používateľ otvorí kameru, označí 4 rohy steny, vyberie/nahrá dizajn a vidí real-time preview graffiti na stene s perspektívnou transformáciou.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Jazyk**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4+
- **Deployment**: Vercel / PWA-ready
- **AI Integration**: Anthropic Claude API (pre generovanie graffiti návrhov na mieru)
- **Image Generation**: Replicate API (Flux model) — voliteľné

## Architektúra

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, PWA manifest
│   ├── page.tsx            # Landing / hero page
│   ├── studio/
│   │   └── page.tsx        # Hlavná AR studio stránka
│   └── api/
│       ├── generate/
│       │   └── route.ts    # AI graffiti generovanie endpoint
│       └── share/
│           └── route.ts    # Zdieľanie výsledkov
├── components/
│   ├── ar/
│   │   ├── CameraView.tsx       # Kamera feed cez getUserMedia
│   │   ├── CanvasOverlay.tsx     # Hlavný canvas s rendering pipeline
│   │   ├── CornerSelector.tsx    # 4-bodový výber rohov
│   │   ├── PerspectiveWarp.tsx   # Homography + mesh warp engine
│   │   └── GraffitiLayer.tsx     # Overlay graffiti s blend modes
│   ├── ui/
│   │   ├── DesignGallery.tsx     # Výber dizajnov (carousel)
│   │   ├── OpacitySlider.tsx     # Kontrola priehľadnosti
│   │   ├── ToolBar.tsx           # Hlavný toolbar
│   │   └── SaveDialog.tsx        # Export / share dialog
│   └── landing/
│       ├── Hero.tsx
│       └── Features.tsx
├── lib/
│   ├── perspective.ts      # Core math: homography, bilinear interpolation, mesh warp
│   ├── camera.ts           # Camera abstraction (getUserMedia wrapper)
│   ├── graffiti-gen.ts     # Canvas-based procedurálne graffiti generátory
│   ├── tracking.ts         # Jednoduchý feature tracking (optical flow lite)
│   └── export.ts           # Canvas → PNG/JPG export, share API
├── hooks/
│   ├── useCamera.ts        # React hook pre kameru
│   ├── useCornerSelection.ts  # Hook pre výber 4 rohov
│   ├── usePerspectiveWarp.ts  # Hook pre warp rendering
│   └── useAnimationFrame.ts   # requestAnimationFrame hook
├── types/
│   └── index.ts            # TypeScript types
└── public/
    ├── manifest.json       # PWA manifest
    ├── sw.js              # Service worker
    └── designs/           # Predvolené graffiti PNG dizajny
```

## Core Feature: Perspektívna transformácia

### Algoritmus
1. Používateľ definuje 4 body (rohy) na canvas/kamera feed
2. Bilineárna interpolácia mapuje source graffiti na destination quad
3. Grid subdivision (16×16) rozdelí quad na malé triangles
4. Každý triangle sa renderuje cez canvas affine transform (setTransform + clip)
5. Výsledok: real-time perspective warp na ~30-60fps

### Kľúčové funkcie v `lib/perspective.ts`:
```typescript
// Bilineárna interpolácia na quad
function bilerp(corners: Point[], u: number, v: number): Point

// Renderovanie jedného triangle s affine transformáciou
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  src: [Point, Point, Point],
  dst: [Point, Point, Point]
): void

// Hlavná warp funkcia — volá sa každý frame
function drawPerspectiveWarp(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  corners: Point[],  // [topLeft, topRight, bottomRight, bottomLeft]
  opacity: number,
  gridSize?: number   // default 16
): void
```

### Typ Point:
```typescript
interface Point {
  x: number;
  y: number;
}
```

## Rendering Pipeline (každý frame)

```
1. Clear canvas
2. Draw camera frame (video → canvas) ALEBO uploaded image ALEBO demo wall
3. IF 4 corners defined:
   a. Compute perspective mesh (grid subdivision)
   b. For each grid cell → 2 triangles
   c. For each triangle → clip + affine transform + drawImage
   d. Draw corner markers (draggable)
   e. Draw edge lines (dashed)
4. requestAnimationFrame → repeat
```

## Camera Hook (`hooks/useCamera.ts`)

```typescript
interface UseCameraReturn {
  videoRef: RefObject<HTMLVideoElement>;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>; // front/back toggle
}

function useCamera(options?: {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}): UseCameraReturn
```

Požiadavky:
- Default `facingMode: 'environment'` (zadná kamera)
- `playsinline` attribute pre iOS Safari
- Graceful fallback ak kamera nie je dostupná
- Cleanup stream tracks pri unmount

## Corner Selection Hook (`hooks/useCornerSelection.ts`)

```typescript
interface UseCornerSelectionReturn {
  corners: Point[];
  phase: 'selecting' | 'complete';
  addCorner: (point: Point) => void;
  moveCorner: (index: number, point: Point) => void;
  reset: () => void;
  dragState: { index: number; active: boolean };
  startDrag: (index: number) => void;
  endDrag: () => void;
}
```

Požiadavky:
- Poradie: ľavý horný → pravý horný → pravý dolný → ľavý dolný
- Po 4 bodoch → fáza "complete"
- Drag & drop pre úpravu pozícií
- Hit detection s radiusom 25px
- Touch + mouse support

## UX Flow

### Fáza 1: Výber pozadia
- Demo stena (vygenerovaná canvas textúra)
- Live kamera feed
- Upload fotky steny

### Fáza 2: Výber rohov (4 body)
- Vizuálne číslovanie 1-4
- Farebné markery (každý roh iná farba)
- Spojnice medzi bodmi (dashed lines)
- Instrukcie nad canvasom

### Fáza 3: Preview + úpravy
- Graffiti je overlaynuté s perspektívou
- Výber dizajnu z galérie (carousel na spodku)
- Slider priehľadnosti
- Drag & drop rohov pre úpravu
- Uloženie do PNG

### Fáza 4 (voliteľná): AI generovanie
- Textový input: "Čo chceš na stene?"
- API call na Claude → generovanie popisu
- Replicate API → generovanie obrázku
- Preview na stene

## Design System

### Farby
```css
--bg-primary: #0a0a0f;
--bg-surface: rgba(255, 255, 255, 0.05);
--accent-pink: #ff006e;
--accent-orange: #fb5607;
--accent-yellow: #ffbe0b;
--accent-purple: #8338ec;
--accent-teal: #00f5d4;
--text-primary: #ffffff;
--text-secondary: #888888;
--text-muted: #555555;
```

### Estetika
- Dark theme (výlučne)
- Street art / urban vibe
- Gradientové akcenty (pink → purple)
- Minimalistický UI, maximálny canvas priestor
- Mobile-first layout

## PWA Konfigurácia

### manifest.json
```json
{
  "name": "AR Graffiti",
  "short_name": "ARGraffiti",
  "description": "Vizualizuj street art na reálnych stenách",
  "start_url": "/studio",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0f",
  "theme_color": "#ff006e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
- Cache-first pre static assets
- Network-first pre API calls
- Offline fallback stránka

## Performance požiadavky
- Canvas rendering: ≥30fps na mobile
- Grid subdivision: 16×16 (512 trojuholníkov) — možné znížiť na 10×10 pre slabšie zariadenia
- Auto-detect performance a prispôsobiť grid size
- Lazy load graffiti dizajnov
- Video resolution: max 1280×720 (šetrí batériu)

## Testing Checklist (Claude Code MUSÍ overiť)

### Funkčné testy
- [ ] Kamera sa spustí na Chrome Android
- [ ] Kamera sa spustí na Safari iOS (playsinline!)
- [ ] Fallback ak kamera nie je dostupná
- [ ] Upload fotky funguje (jpg, png, webp, heic)
- [ ] 4 body sa dajú vybrať ťuknutím
- [ ] Perspective warp sa renderuje správne
- [ ] Drag & drop rohov funguje na touch zariadeniach
- [ ] Galéria dizajnov funguje
- [ ] Opacity slider funguje
- [ ] Export do PNG funguje
- [ ] PWA Add to Home Screen funguje

### Vizuálne testy
- [ ] Žiadne trhanie/blikanie pri renderovaní
- [ ] Markery rohov sú viditeľné na svetlom aj tmavom pozadí
- [ ] UI je čitateľný na mobiloch (min. šírka 320px)
- [ ] Graffiti nemá viditeľné grid artefakty

### Performance testy
- [ ] FPS ≥ 30 na stredne výkonnom mobile
- [ ] Žiadne memory leaky pri prepínaní dizajnov
- [ ] Camera stream sa korektne uvoľní pri opustení stránky

### Edge cases
- [ ] Používateľ otočí telefón (orientation change)
- [ ] Používateľ prepne tab a vráti sa
- [ ] Veľmi malá alebo veľmi veľká selekcia rohov
- [ ] Prekrížené rohy (non-convex quad) — graceful handling

## Spustenie projektu

```bash
npx create-next-app@latest ar-graffiti --typescript --tailwind --app --src-dir
cd ar-graffiti
npm run dev
```

## Príkazy pre Claude Code

Pri práci na tomto projekte:
1. Vždy píš TypeScript strict mode
2. Používaj `'use client'` len tam kde treba (camera, canvas, hooks)
3. Každý component testuj v browseri pred commitom
4. Ak niečo nefunguje na mobile, oprav to pred pokračovaním
5. Neodovzdávaj polodokončený kód — všetko musí fungovať end-to-end

## Priorita implementácie

1. **Core engine** — `lib/perspective.ts` + `hooks/useAnimationFrame.ts`
2. **Camera** — `hooks/useCamera.ts` + `components/ar/CameraView.tsx`
3. **Corner selection** — `hooks/useCornerSelection.ts`
4. **Canvas rendering** — `components/ar/CanvasOverlay.tsx`
5. **UI** — Gallery, Toolbar, Sliders
6. **Export** — Save to PNG
7. **PWA** — Manifest, Service Worker
8. **AI integration** — Generovanie dizajnov (nice-to-have)
