import { rng } from './pixel.js';

/** Drifting 2D starfield drawn with a Graphics object. */
export class Starfield {
  constructor(scene, x, y, w, h, opts = {}) {
    this.scene = scene;
    this.bounds = { x, y, w, h };
    this.g = scene.add.graphics().setDepth(opts.depth ?? 0);
    const R = rng(opts.seed || 42);
    this.stars = Array.from({ length: opts.count || 120 }, () => ({ x: R() * w, y: R() * h, z: 0.2 + R() * 0.8 }));
    this.vx = opts.vx ?? -20; this.vy = opts.vy ?? 0;
    this.warp = 0;
    this.mask = opts.mask;
  }
  update(dt) {
    const { x, y, w, h } = this.bounds;
    const g = this.g; g.clear();
    const cx = w / 2, cy = h / 2;
    for (const s of this.stars) {
      if (this.warp > 0) {
        // radial streaks outward from centre
        const dx = s.x - cx, dy = s.y - cy;
        const k = 1 + this.warp * s.z * dt * 3;
        const ox = s.x, oy = s.y;
        s.x = cx + dx * k; s.y = cy + dy * k;
        if (s.x < 0 || s.x > w || s.y < 0 || s.y > h) { s.x = cx + (Math.random() - 0.5) * 40; s.y = cy + (Math.random() - 0.5) * 30; continue; }
        g.lineStyle(2, 0xffffff, Math.min(1, s.z + 0.2));
        g.lineBetween(x + ox, y + oy, x + s.x, y + s.y);
      } else {
        s.x += this.vx * s.z * dt; s.y += this.vy * s.z * dt;
        if (s.x < 0) s.x += w; if (s.x > w) s.x -= w; if (s.y < 0) s.y += h; if (s.y > h) s.y -= h;
        const c = s.z > 0.8 ? 0xffffff : s.z > 0.5 ? 0xa0a8c0 : 0x586078;
        g.fillStyle(c, 1).fillRect(Math.floor((x + s.x) / 2) * 2, Math.floor((y + s.y) / 2) * 2, 2, 2);
      }
    }
  }
}
