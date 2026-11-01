// Screen layout. The game renders at 640x400; all pixel art is authored at
// half resolution (320x200 "art pixels") and displayed at 2x, mirroring the
// 320x200 VGA look of early-90s adventure games while keeping text legible.
export const WIDTH = 640;
export const HEIGHT = 400;
export const ART = 2; // art pixel -> screen pixel scale

// Away-mission room viewport (in art pixels) and UI bar below it.
export const ROOM_W = 320;
export const ROOM_H = 150;
export const UI_Y = ROOM_H * ART; // 300

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
