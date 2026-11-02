// Screen layout. The game renders at 640x400; all pixel art is authored at
// half resolution (320x200 "art pixels") and displayed at 2x, mirroring the
// 320x200 VGA look of early-90s adventure games while keeping text legible.
//
// Two layouts:
//  - Standard (desktop, tablets, tall screens): 640x400, controls under the scene.
//  - Compact (phones in landscape, where the frame is wide and short): 300 tall
//    and as wide as the frame, with controls in a right-hand sidebar. Fitting
//    16:10 into a ~2.5:1 frame left black bars and shrank text to ~6px; the
//    compact layout fills the frame and scales everything up by about a third.
// Add #compact to the URL to force the compact layout on a desktop.
const win = typeof window !== 'undefined' ? window : null;
const longSide = win ? Math.max(win.innerWidth, win.innerHeight) : 640;
const shortSide = win ? Math.max(1, Math.min(win.innerWidth, win.innerHeight)) : 400;
const coarse = !!win?.matchMedia?.('(pointer: coarse)').matches;
const forced = !!win && /compact/.test(win.location.hash + win.location.search);

export const COMPACT = forced || (coarse && longSide / shortSide >= 1.7 && shortSide <= 600);
export const HEIGHT = COMPACT ? 300 : 400;
export const WIDTH = COMPACT ? Math.max(760, Math.min(1000, Math.round((300 * longSide) / shortSide))) : 640;
export const ART = 2; // art pixel -> screen pixel scale

// Away-mission room viewport (in art pixels) and UI bar below it.
export const ROOM_W = 320;
export const ROOM_H = 150;
export const UI_Y = ROOM_H * ART; // 300 (standard layout: the control bar starts here)
export const SIDEBAR_X = ROOM_W * ART + 4; // compact layout: the control sidebar starts here

export const COLORS = {
  text: 0xe8e8d0,
  dim: 0x8890a0,
  highlight: 0xffd860,
  panel: 0x101828,
  panelEdge: 0x4a6a9a,
  panelLight: 0x7aa0d0,
  alert: 0xff5040,
  good: 0x60e070,
  lcars1: 0xf0a040,
  lcars2: 0x9a8ad0,
  lcars3: 0xd06060,
};

export const FONT = 'pixel';
export const FONT_SIZE = 8;
