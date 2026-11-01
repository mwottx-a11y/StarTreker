import { makeTexture, shade, hex } from './pixel.js';

// 16x16 inventory icons. Missions pick a built-in `icon` by name and a
// `color`, or supply their own `pixels: { rows, palette }`.
const ICONS = {
  phaser: (p, c) => { p(2, 6, 9, 4, '#9098a8'); p(2, 6, 9, 1, '#c0c8d8'); p(4, 10, 3, 4, '#606878'); p(11, 7, 3, 2, c); p(5, 7, 2, 1, c); },
  card: (p, c) => { p(2, 4, 12, 9, c); p(2, 4, 12, 2, shade(c, -0.4)); p(4, 8, 4, 3, '#f0e080'); p(9, 8, 4, 1, '#ffffff'); p(9, 10, 3, 1, '#ffffff'); },
  cell: (p, c) => { p(5, 2, 6, 12, '#505868'); p(6, 4, 4, 8, c); p(7, 1, 2, 1, '#c0c8d8'); p(6, 4, 1, 8, shade(c, 0.4)); },
  shard: (p, c) => { p(7, 1, 2, 2, shade(c, 0.5)); p(6, 3, 4, 4, c); p(5, 7, 6, 4, c); p(6, 11, 4, 3, shade(c, -0.3)); p(7, 4, 1, 7, shade(c, 0.6)); },
  tool: (p, c) => { p(3, 3, 3, 3, c); p(5, 5, 2, 2, '#808890'); p(6, 6, 6, 2, '#9098a8'); p(11, 6, 3, 6, c); p(6, 6, 1, 6, '#9098a8'); },
  datapad: (p, c) => { p(3, 2, 10, 12, '#404858'); p(4, 3, 8, 8, c); p(5, 4, 5, 1, '#ffffff'); p(5, 6, 6, 1, '#ffffff'); p(5, 8, 4, 1, '#ffffff'); p(7, 12, 2, 1, '#a0a8b8'); },
  medkit: (p, c) => { p(2, 4, 12, 9, '#e0e0e8'); p(2, 4, 12, 1, '#ffffff'); p(7, 5, 2, 7, c); p(4, 7, 8, 2, c); p(6, 2, 4, 2, '#808890'); },
  crystal: (p, c) => { p(6, 2, 4, 12, c); p(4, 5, 2, 8, shade(c, -0.2)); p(10, 5, 2, 8, shade(c, -0.3)); p(7, 3, 1, 9, shade(c, 0.6)); },
  key: (p, c) => { p(2, 5, 5, 5, c); p(3, 6, 3, 3, '#000000'); p(7, 7, 7, 2, c); p(11, 9, 1, 2, c); p(13, 9, 1, 2, c); },
  disc: (p, c) => { p(3, 3, 10, 10, c); p(2, 5, 12, 6, c); p(5, 2, 6, 12, c); p(7, 7, 2, 2, '#000000'); p(4, 4, 3, 2, shade(c, 0.5)); },
  fuse: (p, c) => { p(3, 6, 10, 4, '#d8d8e0'); p(5, 5, 6, 6, c); p(1, 7, 2, 2, '#b08040'); p(13, 7, 2, 2, '#b08040'); },
  generic: (p, c) => { p(3, 3, 10, 10, c); p(3, 3, 10, 2, shade(c, 0.4)); p(3, 11, 10, 2, shade(c, -0.4)); },
};

export function itemIcon(scene, id, def = {}) {
  const key = `icon:${id}`;
  if (scene.textures.exists(key)) return key;
  makeTexture(scene, key, 16, 16, (ctx) => {
    const p = (x, y, w, h, c) => { ctx.fillStyle = hex(c); ctx.fillRect(x, y, w, h); };
    if (def.pixels) {
      def.pixels.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (def.pixels.palette[ch]) p(x, y, 1, 1, def.pixels.palette[ch]); }));
    } else {
      (ICONS[def.icon] || ICONS.generic)(p, def.color || '#80a0c0');
    }
  });
  return key;
}
