import { COLORS, WIDTH, FONT } from './constants.js';
import { text } from './font.js';
import { makePortrait, makeTexture } from './pixel.js';
import { sfx } from './audio.js';
import { prefs } from './device.js';

/** Bevelled panel in the style of early-90s adventure UIs. */
export function panel(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  const fill = opts.fill ?? COLORS.panel;
  const edge = opts.edge ?? COLORS.panelEdge;
  g.fillStyle(fill, opts.alpha ?? 0.94).fillRect(x, y, w, h);
  g.fillStyle(edge, 1);
  g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h);
  g.fillStyle(opts.light ?? COLORS.panelLight, 1);
  g.fillRect(x + 2, y + 2, w - 4, 1); g.fillRect(x + 2, y + 2, 1, h - 4);
  // corner notches
  g.fillStyle(opts.accent ?? COLORS.lcars1, 1);
  g.fillRect(x, y, 10, 4); g.fillRect(x + w - 10, y + h - 4, 10, 4);
  return g;
}

/** Text button with hover state. Returns a container with .setEnabled(). */
export function button(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, opts.fill ?? 0x1c2a44).setOrigin(0);
  bg.setStrokeStyle(2, opts.edge ?? COLORS.panelEdge);
  const t = text(scene, w / 2, h / 2, label, opts.color ?? COLORS.text).setOrigin(0.5);
  if (opts.size) t.setFontSize(opts.size);
  c.add([bg, t]);
  c.label = t; c.bg = bg;
  c.enabled = true;
  c.setSize(w, h);
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => { if (c.enabled) { bg.setFillStyle(opts.hover ?? 0x2e4a7a); t.setTint(COLORS.highlight); } });
  bg.on('pointerout', () => { bg.setFillStyle(c.selected ? (opts.selFill ?? 0x3a5a2a) : (opts.fill ?? 0x1c2a44)); t.setTint(c.enabled ? (opts.color ?? COLORS.text) : COLORS.dim); });
  bg.on('pointerdown', (p, lx, ly, ev) => {
    ev?.stopPropagation?.();
    if (!c.enabled) { sfx('deny'); return; }
    sfx('blip');
    onClick?.(p);
  });
  c.setEnabled = (e) => { c.enabled = e; t.setTint(e ? (opts.color ?? COLORS.text) : COLORS.dim); return c; };
  c.setSelected = (s) => { c.selected = s; bg.setFillStyle(s ? (opts.selFill ?? 0x3a5a2a) : (opts.fill ?? 0x1c2a44)); return c; };
  c.setLabel = (s) => { t.setText(s); return c; };
  return c;
}

export function portraitKey(scene, id, def) {
  if (!def || def.portrait === false) return null;
  const key = `portrait:${id}`;
  return makePortrait(scene, key, { ...def.look, ...(def.portraitLook || {}) });
}

function computerPortrait(scene) {
  const key = 'portrait:__computer';
  if (scene.textures.exists(key)) return key;
  makeTexture(scene, key, 40, 40, (ctx) => {
    ctx.fillStyle = '#101828'; ctx.fillRect(0, 0, 40, 40);
    const cols = ['#f0a040', '#9a8ad0', '#d06060', '#60a0d0'];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i % 4]; ctx.fillRect(4, 4 + i * 6, 10 + (i * 7) % 20, 4); }
    ctx.fillStyle = '#60c0ff'; ctx.fillRect(28, 8, 8, 24);
    ctx.strokeStyle = '#6a8aba'; ctx.strokeRect(0.5, 0.5, 39, 39);
  });
  return key;
}

/**
 * Speech / narration / choice box. One per scene. `say` and `choose` return
 * promises so scripts can await them.
 */
export class DialogBox {
  constructor(scene, characters, opts = {}) {
    this.scene = scene;
    this.characters = characters; // merged crew + mission NPCs
    this.y = opts.y ?? 6;
    this.depth = opts.depth ?? 1000;
    this.container = null;
    // Calls are serialised: if two scripts ever speak at once, the second
    // waits its turn instead of tearing down the first one's box.
    this.queue = Promise.resolve();
  }

  _enqueue(fn) {
    const p = this.queue.then(fn);
    this.queue = p.catch(() => {});
    return p;
  }

  clear() { if (this.container) { this.container.destroy(); this.container = null; } }

  _frame(h) {
    this.clear();
    const s = this.scene;
    // keep the box on-screen even when large text makes it tall
    const y = Math.max(4, Math.min(this.y, s.scale.height - h - 4));
    this.top = y;
    const c = s.add.container(0, 0).setDepth(this.depth);
    // full-screen click catcher so clicks don't fall through to the room
    const blocker = s.add.rectangle(0, 0, WIDTH, s.scale.height, 0x000000, 0.001).setOrigin(0).setInteractive();
    c.add(blocker);
    c.add(panel(s, 8, y, WIDTH - 16, h));
    this.container = c;
    return { c, blocker, y };
  }

  say(speakerId, str) {
    return this._enqueue(async () => {
      for (const page of paginate(str, prefs.largeText ? 150 : 330)) await this._sayPage(speakerId, page);
      this.clear();
    });
  }

  _sayPage(speakerId, str) {
    const s = this.scene;
    const def = speakerId ? this.characters[speakerId] : null;
    const size = prefs.largeText ? 16 : 8;
    const key = def ? (def.portrait === false ? computerPortrait(s) : portraitKey(s, speakerId, def)) : null;
    const tx = key ? 108 : 20;
    const bodyY = def ? 30 : 16;
    // measure the full text first so the box fits it
    const probe = text(s, 0, -2000, str, COLORS.text, WIDTH - tx - 28).setFontSize(size);
    const textH = probe.getTextBounds().local.height;
    probe.destroy();
    const H = Math.max(100, bodyY + textH + 26);
    const { c, blocker, y } = this._frame(H);
    if (def) {
      if (key) c.add(s.add.image(18, y + 10, key).setOrigin(0).setScale(2));
      c.add(text(s, tx, y + 12, (def.name || speakerId).toUpperCase(), def.color ?? COLORS.highlight));
    }
    const body = text(s, tx, y + bodyY, '', def ? COLORS.text : 0xb8c8e8, WIDTH - tx - 28).setFontSize(size);
    c.add(body);
    const more = text(s, WIDTH - 30, y + H - 16, '>', COLORS.highlight).setFontSize(size === 16 ? 16 : 8);
    if (size === 16) more.setY(y + H - 22);
    more.setVisible(false); c.add(more);
    if (!def) sfx('blip');

    return new Promise((resolve) => {
      let shown = 0;
      let done = false;
      const timer = s.time.addEvent({
        delay: 14, loop: true, callback: () => {
          shown = Math.min(str.length, shown + 2);
          body.setText(str.slice(0, shown));
          if (shown >= str.length) { timer.remove(); done = true; more.setVisible(true); s.tweens.add({ targets: more, alpha: 0.2, yoyo: true, repeat: -1, duration: 300 }); }
        },
      });
      const advance = () => {
        if (!done) { timer.remove(); body.setText(str); done = true; more.setVisible(true); return; }
        cleanup(); resolve();
      };
      const onKey = (e) => { if (['Space', 'Enter', 'Escape'].includes(e.code)) advance(); };
      s.input.keyboard?.on('keydown', onKey);
      blocker.on('pointerdown', advance);
      const cleanup = () => { s.input.keyboard?.off('keydown', onKey); blocker.off('pointerdown', advance); };
    });
  }

  choose(options, speakerId = 'captain') {
    return this._enqueue(() => this._choose(options, speakerId));
  }

  _choose(options, speakerId) {
    const s = this.scene;
    const maxW = WIDTH - 72;
    const layout = (size) => {
      const minH = size === 16 ? 28 : 16; // finger-sized rows when large
      const heights = options.map((o, i) => {
        const t = text(s, 0, -2000, `${i + 1}. ${o}`, COLORS.text, maxW).setFontSize(size);
        const h = t.getTextBounds().local.height;
        t.destroy();
        return Math.max(minH, h + 6);
      });
      return { size, heights, H: 30 + heights.reduce((a, b) => a + b + 4, 0) };
    };
    // large text if it fits on screen, otherwise fall back to the small font
    let L = layout(prefs.largeText ? 16 : 8);
    if (L.H > s.scale.height - 8 && L.size === 16) L = layout(8);
    const { c, y: top } = this._frame(L.H);
    const def = this.characters[speakerId];
    c.add(text(s, 22, top + 10, (def?.short || 'You').toUpperCase() + ':', def?.color ?? COLORS.highlight));
    return new Promise((resolve) => {
      let y = top + 26;
      const pick = (i) => { sfx('select'); s.input.keyboard?.off('keydown', onKey); this.clear(); resolve(i); };
      options.forEach((o, i) => {
        const t = text(s, 36, y + 2, `${i + 1}. ${o}`, COLORS.text, maxW).setFontSize(L.size);
        const hit = s.add.rectangle(16, y - 1, WIDTH - 32, L.heights[i] + 3, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
        const sep = s.add.rectangle(30, y + L.heights[i] + 1, WIDTH - 60, 1, 0x2a3a5a).setOrigin(0);
        hit.on('pointerover', () => t.setTint(COLORS.highlight));
        hit.on('pointerout', () => t.setTint(COLORS.text));
        hit.on('pointerdown', () => pick(i));
        c.add([sep, t, hit]);
        y += L.heights[i] + 4;
      });
      const onKey = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= options.length) pick(n - 1); };
      s.input.keyboard?.on('keydown', onKey);
    });
  }
}

function paginate(str, max) {
  if (str.length <= max) return [str];
  const sentences = str.match(/[^.!?]+[.!?]+["')\]]*\s*|.+$/g) || [str];
  const pages = [];
  let cur = '';
  for (const sn of sentences) {
    if ((cur + sn).length > max && cur) { pages.push(cur.trim()); cur = ''; }
    cur += sn;
  }
  if (cur.trim()) pages.push(cur.trim());
  return pages;
}

/** Floating toast (score changes, objectives). Concurrent toasts stack upward. */
export function toast(scene, msg, color = COLORS.good, y = 280) {
  scene._toasts = (scene._toasts || 0) + 1;
  const yy = y - (scene._toasts - 1) * 18;
  const t = text(scene, WIDTH / 2, yy, msg, color).setOrigin(0.5).setDepth(2000);
  const bg = scene.add.rectangle(WIDTH / 2, yy, t.width + 16, 16, 0x000000, 0.75).setDepth(1999);
  scene.tweens.add({
    targets: [t, bg], y: yy - 20, alpha: 0, delay: 2200, duration: 700,
    onComplete: () => { t.destroy(); bg.destroy(); scene._toasts = Math.max(0, scene._toasts - 1); },
  });
}

export { FONT };
