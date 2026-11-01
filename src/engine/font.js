import Phaser from 'phaser';
import { FONT } from './constants.js';

const CHARS = Phaser.GameObjects.RetroFont.TEXT_SET1; // ASCII 32..126
const CELL = 8;
const PER_ROW = 16;

/**
 * Rasterises the "Press Start 2P" web font into a hard-edged bitmap font.
 * Alpha is thresholded so every glyph pixel is either fully on or off, which
 * keeps text perfectly crisp at any integer scale.
 */
export function buildPixelFont(scene) {
  if (scene.cache.bitmapFont.exists(FONT)) return;
  const rows = Math.ceil(CHARS.length / PER_ROW);
  const canvas = document.createElement('canvas');
  canvas.width = PER_ROW * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext('2d');
  ctx.font = '8px "Press Start 2P"';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  for (let i = 0; i < CHARS.length; i++) {
    ctx.fillText(CHARS[i], (i % PER_ROW) * CELL, Math.floor(i / PER_ROW) * CELL);
  }
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const on = d[p + 3] > 110;
    d[p] = d[p + 1] = d[p + 2] = 255;
    d[p + 3] = on ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  scene.textures.addCanvas(FONT, canvas);
  const data = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: FONT,
    width: CELL,
    height: CELL,
    chars: CHARS,
    charsPerRow: PER_ROW,
    spacing: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    lineSpacing: 0,
  });
  scene.cache.bitmapFont.add(FONT, data);
}

/** Convenience: crisp text object. */
export function text(scene, x, y, str, color = 0xe8e8d0, maxWidth = 0) {
  const t = scene.add.bitmapText(x, y, FONT, str, 8);
  t.setTint(color);
  t.setLineSpacing(4);
  if (maxWidth) t.setMaxWidth(maxWidth);
  return t;
}
