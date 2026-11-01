import { makeTexture, rng, shade, dither, hex, makePlanet } from './pixel.js';

/**
 * Background painter: turns a list of drawing commands (plain data, so it can
 * live in JSON mission files) into a canvas texture.
 *
 * Every command is an object with a `type`. Coordinates are art pixels.
 *   sky       {from,to,y0,y1}             dithered vertical gradient (full width)
 *   gradient  {x,y,w,h,from,to,dir}       dithered gradient in a box ('v' or 'h')
 *   stars     {count,seed,y0,y1,color}
 *   rect      {x,y,w,h,c}
 *   poly      {pts:[[x,y]...],c}
 *   circle    {x,y,r,c}       ellipse {x,y,rx,ry,c}
 *   line      {x1,y1,x2,y2,c,w}
 *   ridge     {y,amp,c,seed,rough,x0,x1}  noisy horizon filled downward
 *   noise     {x,y,w,h,c,density,seed}    speckle texture
 *   bricks    {x,y,w,h,c,bw,bh}           tiled wall
 *   crystal   {x,y,w,h,c}                 faceted crystal spire (x,y = base centre)
 *   glow      {x,y,r,c,strength}          dithered radial glow
 *   planet    {x,y,size,base,accent,bands,seed}
 *   console   {x,y,w,h,c,seed}            computer panel with lights
 *   pixels    {x,y,rows,palette}          inline pixel map
 */
export function paintTexture(scene, key, w, h, commands = []) {
  return makeTexture(scene, key, w, h, (ctx) => {
    for (const cmd of commands) {
      const fn = PAINT[cmd.type];
      if (!fn) { console.warn('Unknown paint command', cmd); continue; }
      fn(ctx, cmd, w, h, scene);
    }
  });
}

const set = (ctx, c) => { ctx.fillStyle = hex(c); };

const PAINT = {
  sky(ctx, c, w, h) {
    const y0 = c.y0 ?? 0, y1 = c.y1 ?? h;
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / Math.max(1, y1 - y0 - 1);
      for (let x = 0; x < w; x++) { set(ctx, dither(x, y, t) ? c.to : c.from); ctx.fillRect(x, y, 1, 1); }
    }
  },
  gradient(ctx, c) {
    for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
      const t = c.dir === 'h' ? x / Math.max(1, c.w - 1) : y / Math.max(1, c.h - 1);
      set(ctx, dither(c.x + x, c.y + y, t) ? c.to : c.from); ctx.fillRect(c.x + x, c.y + y, 1, 1);
    }
  },
  stars(ctx, c, w, h) {
    const R = rng(c.seed || 7);
    const y0 = c.y0 ?? 0, y1 = c.y1 ?? h;
    for (let i = 0; i < (c.count || 60); i++) {
      const x = Math.floor(R() * w), y = Math.floor(y0 + R() * (y1 - y0));
      const b = R();
      set(ctx, b > 0.9 ? '#ffffff' : b > 0.6 ? (c.color || '#a0a8c0') : '#5a6078');
      ctx.fillRect(x, y, 1, 1);
      if (b > 0.97) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
    }
  },
  rect(ctx, c) { set(ctx, c.c); ctx.fillRect(c.x, c.y, c.w, c.h); },
  poly(ctx, c) {
    set(ctx, c.c); ctx.beginPath();
    c.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath(); ctx.fill();
  },
  circle(ctx, c) { set(ctx, c.c); ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); },
  ellipse(ctx, c) { set(ctx, c.c); ctx.beginPath(); ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2); ctx.fill(); },
  line(ctx, c) {
    // Bresenham so lines stay hard-edged
    let x0 = Math.round(c.x1), y0 = Math.round(c.y1); const x1 = Math.round(c.x2), y1 = Math.round(c.y2);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy; const lw = c.w || 1;
    set(ctx, c.c);
    for (;;) {
      ctx.fillRect(x0, y0, lw, lw);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },
  ridge(ctx, c, w, h) {
    const R = rng(c.seed || 3);
    const x0 = c.x0 ?? 0, x1 = c.x1 ?? w;
    const amp = c.amp ?? 10, rough = c.rough ?? 1;
    const k = [R() * 6, R() * 6, R() * 6];
    set(ctx, c.c);
    for (let x = x0; x < x1; x++) {
      const n = Math.sin(x / 23 + k[0]) * 0.5 + Math.sin(x / 9 + k[1]) * 0.3 * rough + Math.sin(x / 4 + k[2]) * 0.2 * rough;
      const top = Math.round(c.y - n * amp);
      ctx.fillRect(x, top, 1, (c.bottom ?? h) - top);
    }
  },
  noise(ctx, c) {
    const R = rng(c.seed || 11);
    const n = Math.floor(c.w * c.h * (c.density ?? 0.08));
    set(ctx, c.c);
    for (let i = 0; i < n; i++) ctx.fillRect(c.x + Math.floor(R() * c.w), c.y + Math.floor(R() * c.h), 1, 1);
  },
  bricks(ctx, c) {
    const bw = c.bw || 12, bh = c.bh || 6;
    set(ctx, c.c); ctx.fillRect(c.x, c.y, c.w, c.h);
    set(ctx, shade(c.c, -0.3));
    for (let y = 0; y < c.h; y += bh) {
      ctx.fillRect(c.x, c.y + y, c.w, 1);
      const off = (y / bh) % 2 ? bw / 2 : 0;
      for (let x = off; x < c.w; x += bw) ctx.fillRect(c.x + x, c.y + y, 1, Math.min(bh, c.h - y));
    }
  },
  crystal(ctx, c) {
    const w = c.w || 8, hgt = c.h || 30;
    const x = c.x, y = c.y;
    const pts = [[x - w / 2, y], [x - w / 2, y - hgt * 0.75], [x, y - hgt], [x + w / 2, y - hgt * 0.75], [x + w / 2, y]];
    PAINT.poly(ctx, { pts, c: c.c });
    PAINT.poly(ctx, { pts: [[x, y], [x, y - hgt], [x + w / 2, y - hgt * 0.75], [x + w / 2, y]], c: shade(c.c, -0.3) });
    PAINT.line(ctx, { x1: x - w / 4, y1: y - 2, x2: x - w / 4, y2: y - hgt * 0.7, c: shade(c.c, 0.5) });
  },
  glow(ctx, c) {
    const s = c.strength ?? 0.6;
    set(ctx, c.c);
    for (let y = -c.r; y <= c.r; y++) for (let x = -c.r; x <= c.r; x++) {
      const d = Math.sqrt(x * x + y * y) / c.r;
      if (d <= 1 && dither(c.x + x, c.y + y, (1 - d) * s)) ctx.fillRect(c.x + x, c.y + y, 1, 1);
    }
  },
  planet(ctx, c, w, h, scene) {
    const key = `__planet_${c.seed || 'p'}_${c.size}_${c.base}`;
    const tex = scene.textures.get(makePlanet(scene, key, c));
    ctx.drawImage(tex.getSourceImage(), Math.round(c.x - c.size / 2), Math.round(c.y - c.size / 2));
  },
  console(ctx, c) {
    const R = rng(c.seed || 5);
    const base = c.c || '#38404c';
    set(ctx, base); ctx.fillRect(c.x, c.y, c.w, c.h);
    set(ctx, shade(base, 0.3)); ctx.fillRect(c.x, c.y, c.w, 1);
    set(ctx, shade(base, -0.4)); ctx.fillRect(c.x, c.y + c.h - 1, c.w, 1);
    const lights = ['#ff5040', '#40e060', '#f0c040', '#40a0ff', '#e070ff'];
    for (let y = c.y + 2; y < c.y + c.h - 2; y += 3) for (let x = c.x + 2; x < c.x + c.w - 2; x += 3) {
      if (R() < 0.45) { set(ctx, lights[Math.floor(R() * lights.length)]); ctx.fillRect(x, y, 2, 1); }
    }
  },
  pixels(ctx, c) {
    c.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = c.palette[row[x]];
        if (!col) continue;
        set(ctx, col); ctx.fillRect(c.x + x, c.y + y, 1, 1);
      }
    });
  },
};
