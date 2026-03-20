export interface Point {
  x: number;
  y: number;
}

export type SelectionPhase = 'selecting' | 'complete';

export type BackgroundMode = 'wall' | 'camera' | 'upload';

export type StudioStep = 'choose-wall' | 'choose-design' | 'preview';

export interface OverlayRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DragState {
  index: number;
  active: boolean;
}

export interface GraffitiDesign {
  index: number;
  label: string;
  color: string;
}

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export interface ExportOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  filename?: string;
}
