// Procedural pixel-art generation. Everything visual in the game is built at
// runtime from small parametric descriptions, so a mission module can ship as
// pure data with no image files (though PNGs are supported too).

export function rng(seed = 1) {
  let a = typeof seed === 'string' ? hashStr(seed) : seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function hex(c) {
  if (typeof c === 'number') return '#' + c.toString(16).padStart(6, '0');
  return c;
}

export function toRGB(c) {
  const h = hex(c).replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function shade(c, f) {
  const [r, g, b] = toRGB(c);
  const k = (v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return '#' + [k(r), k(g), k(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function mix(a, b, t) {
  const A = toRGB(a), B = toRGB(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const dither = (x, y, t) => t * 16 > BAYER4[y & 3][x & 3] + 0.5;

/** Create (or replace) a canvas texture and hand its 2D context to `draw`. */
export function makeTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  tex.refresh();
  return tex;
}

/** Build a texture from string rows + palette (`.` or space = transparent). */
export function pixelMap(scene, key, rows, palette) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return makeTexture(scene, key, w, h, (ctx) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ' || !palette[ch]) continue;
        ctx.fillStyle = hex(palette[ch]);
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Humanoid characters
// ---------------------------------------------------------------------------

export const HUMANOID_W = 16;
export const HUMANOID_H = 40;
const FRAMES = ['front0', 'front1', 'front2', 'back0', 'back1', 'back2', 'side0', 'side1', 'side2', 'side3', 'down'];

/**
 * Generates a strip of walk-cycle frames for a humanoid from a look spec:
 * { skin, hair, hairStyle, uniform, trim, pants, boots, features: [] }
 */
export function makeHumanoid(scene, key, look) {
  if (scene.textures.exists(key)) return key;
  const W = HUMANOID_W, H = HUMANOID_H;
  const L = {
    skin: '#e0b090', hair: '#402818', hairStyle: 'short', uniform: '#c8a038',
    trim: '#202020', pants: '#202430', boots: '#101010', features: [], ...look,
  };
  const tex = makeTexture(scene, key, W * FRAMES.length, H, (ctx) => {
    FRAMES.forEach((f, i) => drawHumanoidFrame(ctx, i * W, f, L));
  });
  FRAMES.forEach((f, i) => tex.add(f, 0, i * W, 0, W, H));
  return key;
}

function drawHumanoidFrame(ctx, ox, frame, L) {
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, y, w, h); };
  const feats = L.features || [];
  const uniDark = shade(L.uniform, -0.35);
  const uniLight = shade(L.uniform, 0.25);
  const skinDark = shade(L.skin, -0.25);
  const view = frame.replace(/\d/g, '');
  const step = parseInt(frame.slice(-1), 10) || 0;

  if (view === 'down') {
    // lying on the ground (stunned / injured)
    px(1, 33, 4, 4, L.skin); px(1, 32, 4, 1, L.hair);
    px(5, 33, 7, 4, L.uniform); px(5, 36, 7, 1, uniDark);
    px(12, 34, 4, 3, L.pants); px(15, 34, 1, 3, L.boots);
    return;
  }

  const side = view === 'side';
  const back = view === 'back';
  const robe = feats.includes('robe');
  const armor = feats.includes('armor');
  // legs
  const legY = 24;
  if (!robe) {
    if (side) {
      const sw = [[0, 0], [-2, 2], [0, 0], [2, -2]][step];
      px(6 + sw[0], legY, 3, 12, L.pants); px(7 + sw[1], legY, 3, 12, shade(L.pants, 0.1));
      px(6 + sw[0], 36, 4, 3, L.boots); px(7 + sw[1], 36, 4, 3, L.boots);
    } else {
      const a = step === 1 ? 1 : 0, b = step === 2 ? 1 : 0;
      px(4, legY, 4, 12 - a, L.pants); px(8, legY, 4, 12 - b, shade(L.pants, -0.1));
      px(4, 36 - a, 4, 3, L.boots); px(8, 36 - b, 4, 3, L.boots);
    }
  }
  // torso
  if (side) {
    px(5, 11, 6, robe ? 26 : 14, L.uniform);
    px(5, 11, 1, robe ? 26 : 14, uniDark);
    px(10, 11, 1, robe ? 26 : 14, uniLight);
    if (robe) px(5, 36, 6, 3, uniDark);
  } else {
    px(3, 11, 10, robe ? 26 : 14, L.uniform);
    px(3, 11, 1, robe ? 26 : 14, uniDark);
    px(12, 11, 1, robe ? 26 : 14, uniDark);
    if (!back) {
      px(6, 11, 4, 1, L.trim); // collar
      if (L.insignia) px(9, 14, 1, 2, L.insignia);
    }
    if (robe) px(3, 36, 10, 3, uniDark);
  }
  if (armor) {
    if (side) px(5, 12, 6, 6, shade(L.uniform, -0.5));
    else { px(3, 12, 10, 5, shade(L.uniform, -0.5)); px(4, 13, 8, 3, shade(L.uniform, -0.2)); }
  }
  if (!robe) px(side ? 5 : 3, 24, side ? 6 : 10, 1, L.trim); // belt
  // arms
  if (side) {
    const sw = [0, 1, 0, -1][step];
    px(7 + sw, 12, 3, 10, shade(L.uniform, -0.15));
    px(7 + sw, 22, 3, 2, L.skin);
  } else {
    const a = step === 1 ? 1 : 0, b = step === 2 ? 1 : 0;
    px(1, 12 + a, 2, 10, L.uniform); px(13, 12 + b, 2, 10, L.uniform);
    px(1, 22 + a, 2, 2, L.skin); px(13, 22 + b, 2, 2, L.skin);
  }
  // neck + head
  px(7, 9, 2, 2, skinDark);
  const hx = side ? 6 : 5, hw = side ? 5 : 6;
  px(hx, 2, hw, 8, L.skin);
  px(hx, 9, hw, 1, skinDark);
  // hair
  const hs = L.hairStyle;
  if (hs !== 'bald') {
    px(hx, 1, hw, 2, L.hair);
    if (back) px(hx, 1, hw, hs === 'long' ? 10 : 6, L.hair);
    else if (side) { px(hx, 1, 3, hs === 'long' ? 9 : 5, L.hair); }
    else {
      px(hx, 2, 1, hs === 'long' ? 8 : 3, L.hair); px(hx + hw - 1, 2, 1, hs === 'long' ? 8 : 3, L.hair);
      if (hs === 'long') { px(hx - 1, 4, 1, 7, L.hair); px(hx + hw, 4, 1, 7, L.hair); }
    }
    if (hs === 'bun' && !side) px(hx + 2, 0, 2, 1, L.hair);
    if (hs === 'crest') px(side ? hx + 1 : hx + 2, 0, 2, 2, L.hair);
  }
  if (!back) {
    // eyes
    if (side) px(hx + hw - 2, 5, 1, 1, '#101018');
    else { px(hx + 1, 5, 1, 1, '#101018'); px(hx + 4, 5, 1, 1, '#101018'); }
    if (feats.includes('beard')) {
      if (side) px(hx + 1, 7, hw - 1, 3, L.beard || L.hair);
      else px(hx, 7, hw, 3, L.beard || L.hair);
    }
    if (feats.includes('markings')) {
      const m = L.markColor || '#e0e8ff';
      if (side) px(hx + hw - 2, 3, 1, 1, m);
      else { px(hx + 1, 3, 1, 1, m); px(hx + 4, 3, 1, 1, m); px(hx + 2, 2, 2, 1, m); }
    }
    if (feats.includes('ridges')) {
      px(hx, 3, hw, 1, skinDark);
      if (!side) { px(hx + 2, 2, 2, 1, skinDark); }
    }
    if (feats.includes('tusks') && !side) { px(hx + 1, 8, 1, 2, '#f0e8c0'); px(hx + 4, 8, 1, 2, '#f0e8c0'); }
    if (feats.includes('visor')) px(side ? hx + 2 : hx, 4, side ? 3 : hw, 2, L.visor || '#40e0ff');
  }
}

export function registerHumanoidAnims(scene, key) {
  const a = (name, frames, rate, repeat = -1) => {
    const id = `${key}:${name}`;
    if (scene.anims.exists(id)) return;
    scene.anims.create({ key: id, frames: frames.map((f) => ({ key, frame: f })), frameRate: rate, repeat });
  };
  a('walkSide', ['side0', 'side1', 'side2', 'side3'], 8);
  a('walkFront', ['front1', 'front0', 'front2', 'front0'], 7);
  a('walkBack', ['back1', 'back0', 'back2', 'back0'], 7);
}

// ---------------------------------------------------------------------------
// Portraits (40x40) for the dialogue box
// ---------------------------------------------------------------------------

export function makePortrait(scene, key, look) {
  if (scene.textures.exists(key)) return key;
  const L = { skin: '#e0b090', hair: '#402818', hairStyle: 'short', uniform: '#c8a038', trim: '#202020', features: [], ...look };
  const feats = L.features || [];
  makeTexture(scene, key, 40, 40, (ctx) => {
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const bg = L.bg || '#18243a';
    px(0, 0, 40, 40, bg);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (dither(x, y, y / 60)) px(x, y, 1, 1, shade(bg, 0.12));
    const sd = shade(L.skin, -0.25), sl = shade(L.skin, 0.15);
    // shoulders / uniform
    px(4, 32, 32, 8, L.uniform); px(4, 32, 32, 1, shade(L.uniform, 0.3));
    px(15, 31, 10, 3, L.trim);
    if (feats.includes('armor')) { px(4, 33, 32, 7, shade(L.uniform, -0.45)); px(6, 34, 6, 3, shade(L.uniform, -0.1)); px(28, 34, 6, 3, shade(L.uniform, -0.1)); }
    if (L.insignia) px(27, 35, 3, 3, L.insignia);
    // neck
    px(16, 27, 8, 6, sd);
    // long hair behind head
    if (L.hairStyle === 'long') px(9, 8, 22, 24, shade(L.hair, -0.15));
    // head
    const old = feats.includes('old');
    px(11, 7, 18, 21, L.skin);
    px(12, 27, 16, 2, L.skin);
    px(11, 7, 2, 21, sd); px(27, 7, 2, 21, sd);
    px(14, 10, 4, 1, sl);
    // ears
    if (feats.includes('pointed')) { px(8, 13, 3, 6, L.skin); px(29, 13, 3, 6, L.skin); px(8, 11, 1, 3, L.skin); px(31, 11, 1, 3, L.skin); }
    else { px(9, 14, 2, 5, sd); px(29, 14, 2, 5, sd); }
    // eyes
    const eye = L.eyes || '#202838';
    px(14, 15, 4, 2, '#f0f0f0'); px(22, 15, 4, 2, '#f0f0f0');
    px(16, 15, 2, 2, eye); px(22, 15, 2, 2, eye);
    px(13, 13, 5, 1, shade(L.hair, -0.1)); px(22, 13, 5, 1, shade(L.hair, -0.1)); // brows
    // nose + mouth
    px(19, 17, 2, 5, sd); px(18, 21, 4, 1, sd);
    px(16, 24, 8, 1, L.lips || shade(L.skin, -0.35));
    if (old) { px(13, 18, 3, 1, sd); px(24, 18, 3, 1, sd); px(14, 26, 2, 1, sd); px(24, 26, 2, 1, sd); }
    // hair
    const hs = L.hairStyle;
    if (hs !== 'bald') {
      px(10, 3, 20, 6, L.hair); px(11, 2, 18, 1, L.hair);
      px(10, 8, 2, 6, L.hair); px(28, 8, 2, 6, L.hair);
      px(13, 4, 10, 1, shade(L.hair, 0.2));
      if (hs === 'bun') px(16, 0, 8, 3, L.hair);
      if (hs === 'crest') px(17, 0, 6, 3, L.hair);
      if (hs === 'long') { px(9, 8, 2, 22, L.hair); px(29, 8, 2, 22, L.hair); }
    } else {
      px(11, 5, 18, 3, L.skin); px(13, 6, 6, 1, sl);
    }
    if (feats.includes('beard')) { const b = L.beard || L.hair; px(12, 22, 16, 7, b); px(14, 28, 12, 2, b); px(16, 24, 8, 1, shade(b, -0.3)); }
    if (feats.includes('markings')) {
      const m = L.markColor || '#e0e8ff';
      px(14, 10, 1, 1, m); px(16, 9, 1, 1, m); px(19, 8, 2, 1, m); px(23, 9, 1, 1, m); px(25, 10, 1, 1, m);
      px(12, 19, 1, 3, m); px(27, 19, 1, 3, m);
    }
    if (feats.includes('ridges')) { for (let i = 0; i < 4; i++) px(13 + i * 4, 9 + (i % 2), 3, 1, sd); px(19, 6, 2, 8, sd); }
    if (feats.includes('tusks')) { px(14, 24, 2, 4, '#f0e8c0'); px(24, 24, 2, 4, '#f0e8c0'); }
    if (feats.includes('glasses')) { px(13, 14, 6, 4, '#a0d0ff'); px(21, 14, 6, 4, '#a0d0ff'); px(19, 15, 2, 1, '#303030'); px(16, 15, 2, 2, eye); px(22, 15, 2, 2, eye); }
    if (feats.includes('visor')) px(11, 14, 18, 4, L.visor || '#40e0ff');
    if (feats.includes('scar')) px(24, 18, 1, 6, shade(L.skin, -0.45));
    // frame
    ctx.strokeStyle = '#6a8aba'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, 39, 39);
  });
  return key;
}

// ---------------------------------------------------------------------------
// Starships and planets
// ---------------------------------------------------------------------------

/** Ship silhouettes. `style`: 'meridian' | 'raider' | 'drone' | 'freighter'. */
export function makeShip(scene, key, style = 'raider', color) {
  if (scene.textures.exists(key)) return key;
  const W = 96, H = 48;
  makeTexture(scene, key, W, H, (ctx) => {
    const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    if (style === 'meridian') {
      const c = color || '#c8ccd8';
      poly([[18, 22], [44, 14], [70, 16], [78, 22], [70, 28], [44, 30]], c); // saucer-ish wedge hull
      poly([[44, 18], [56, 18], [54, 26], [44, 26]], shade(c, -0.2));
      rect(10, 8, 40, 5, shade(c, -0.1)); rect(10, 33, 40, 5, shade(c, -0.1)); // nacelles
      rect(10, 8, 6, 5, '#ff7050'); rect(10, 33, 6, 5, '#ff7050');
      rect(46, 10, 4, 6, shade(c, -0.3)); rect(46, 30, 4, 6, shade(c, -0.3));
      rect(70, 21, 6, 3, '#80d0ff');
    } else if (style === 'raider') {
      const c = color || '#8a3a2a';
      poly([[6, 24], [30, 6], [80, 20], [92, 24], [80, 28], [30, 42]], c);
      poly([[30, 6], [50, 2], [60, 16]], shade(c, -0.3));
      poly([[30, 42], [50, 46], [60, 32]], shade(c, -0.3));
      poly([[40, 18], [74, 22], [74, 26], [40, 30]], shade(c, 0.2));
      rect(80, 22, 8, 4, '#80ff60');
      rect(8, 20, 4, 8, '#ffb040');
    } else if (style === 'drone') {
      const c = color || '#8090a0';
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(48, 24, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(c, -0.35); ctx.beginPath(); ctx.arc(52, 28, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(c, 0.2); ctx.beginPath(); ctx.arc(44, 20, 10, 0, Math.PI * 2); ctx.fill();
      rect(20, 22, 56, 4, shade(c, -0.2)); rect(14, 18, 8, 12, shade(c, -0.1)); rect(74, 18, 8, 12, shade(c, -0.1));
      rect(45, 21, 6, 6, '#ff3030');
    } else {
      const c = color || '#a08a60';
      rect(10, 14, 70, 20, c); rect(10, 14, 70, 3, shade(c, 0.25)); rect(10, 31, 70, 3, shade(c, -0.3));
      for (let i = 0; i < 5; i++) rect(14 + i * 13, 18, 10, 12, shade(c, -0.15));
      poly([[80, 14], [92, 20], [92, 28], [80, 34]], shade(c, 0.1));
      rect(4, 18, 6, 12, '#60a0ff');
    }
    // hard edges only: snap alpha
    const img = ctx.getImageData(0, 0, W, H); const d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 100 ? 255 : 0;
    ctx.putImageData(img, 0, 0);
  });
  return key;
}

/** Dithered, shaded planet. look: { size, base, accent, bands, seed, ring } */
export function makePlanet(scene, key, look = {}) {
  if (scene.textures.exists(key)) return key;
  const S = look.size || 64;
  const r = S / 2 - 1;
  const R = rng(look.seed || key);
  const base = look.base || '#5070a0', accent = look.accent || '#a0c0e0';
  const bands = look.bands ?? 5;
  const phase = R() * 10;
  makeTexture(scene, key, S, S, (ctx) => {
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x - S / 2 + 0.5, dy = y - S / 2 + 0.5;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) continue;
        const n = Math.sin((dy / r) * bands + Math.sin(dx / 7 + phase) * 1.2 + phase) * 0.5 + 0.5;
        let c = dither(x, y, n) ? accent : base;
        // Lambert lighting on a sphere, light from upper-left-front
        const nx = dx / r, ny = dy / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const light = nx * -0.55 + ny * -0.45 + nz * 0.7;
        if (light < 0) c = dither(x, y, Math.min(1, -light * 3)) ? '#05060c' : shade(c, -0.6);
        else if (light < 0.3) c = dither(x, y, light / 0.3) ? shade(c, -0.15) : shade(c, -0.45);
        else if (light > 0.85 && dither(x, y, (light - 0.85) * 5)) c = shade(c, 0.3);
        ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return key;
}
