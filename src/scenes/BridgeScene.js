import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { DialogBox, button, panel, toast } from '../engine/ui.js';
import { Starfield } from '../engine/starfield.js';
import { paintTexture } from '../engine/painter.js';
import { makeHumanoid, makePlanet, makeShip } from '../engine/pixel.js';
import { WIDTH, HEIGHT, COLORS, COMPACT } from '../engine/constants.js';

// The bridge view is drawn in a 640x320 frame. In the compact layout it is
// scaled to the full screen height and the command buttons become a sidebar.
const BW = 640, BH = 320;
const VIEW_SCALE = COMPACT ? HEIGHT / BH : 1;
import { Director } from '../engine/director.js';
import { check } from '../engine/script.js';
import { CREW } from '../cast/crew.js';
import { sfx, startDrone } from '../engine/audio.js';

// Viewscreen rectangle in screen pixels
const VS = { x: 160, y: 16, w: 320, h: 120 };

const BRIDGE_ART = [
  { type: 'rect', x: 0, y: 0, w: 320, h: 160, c: '#1c202a' },
  { type: 'gradient', x: 0, y: 0, w: 320, h: 96, from: '#2a3040', to: '#1e2230' },
  // wall panels
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ type: 'rect', x: 4 + i * 40, y: 74, w: 36, h: 20, c: '#262c3a' })),
  { type: 'rect', x: 0, y: 72, w: 320, h: 2, c: '#3a4458' },
  // viewscreen frame
  { type: 'rect', x: 74, y: 3, w: 172, h: 72, c: '#0c0e14' },
  { type: 'rect', x: 76, y: 5, w: 168, h: 68, c: '#4a5470' },
  { type: 'rect', x: 78, y: 6, w: 164, h: 66, c: '#000000' },
  // LCARS-style trim strips
  { type: 'rect', x: 4, y: 8, w: 60, h: 6, c: '#f0a040' }, { type: 'rect', x: 4, y: 16, w: 40, h: 4, c: '#9a8ad0' },
  { type: 'rect', x: 256, y: 8, w: 60, h: 6, c: '#f0a040' }, { type: 'rect', x: 276, y: 16, w: 40, h: 4, c: '#d06060' },
  { type: 'rect', x: 4, y: 22, w: 6, h: 44, c: '#f0a040' }, { type: 'rect', x: 310, y: 22, w: 6, h: 44, c: '#f0a040' },
  // floor
  { type: 'gradient', x: 0, y: 96, w: 320, h: 64, from: '#2c303c', to: '#3c4252' },
  { type: 'ellipse', x: 160, y: 132, rx: 120, ry: 24, c: '#343a48' },
  { type: 'ellipse', x: 160, y: 132, rx: 112, ry: 20, c: '#2a2f3c' },
  // upper deck railing
  { type: 'rect', x: 0, y: 94, w: 320, h: 3, c: '#b08840' },
  { type: 'rect', x: 0, y: 97, w: 320, h: 1, c: '#5a4420' },
  // rear stations (consoles)
  { type: 'console', x: 8, y: 52, w: 54, h: 18, c: '#323848', seed: 1 },   // comms
  { type: 'console', x: 258, y: 52, w: 54, h: 18, c: '#323848', seed: 2 }, // science
  { type: 'console', x: 8, y: 112, w: 40, h: 20, c: '#3a3038', seed: 3 },  // engineering
  { type: 'console', x: 272, y: 112, w: 40, h: 20, c: '#303a38', seed: 4 }, // transporter control
];

const STATIONS = [
  { id: 'comms', label: 'COMMS', crew: 'arun', rect: [16, 60, 110, 90] },
  { id: 'science', label: 'SCIENCE', crew: 'venn', rect: [514, 60, 110, 90] },
  { id: 'engineering', label: 'ENGINEERING', crew: 'brandt', rect: [12, 190, 90, 90] },
  { id: 'helm', label: 'HELM', crew: 'sato', rect: [236, 190, 80, 90] },
  { id: 'tactical', label: 'TACTICAL', crew: 'daska', rect: [326, 190, 80, 90] },
  { id: 'transporter', label: 'TRANSPORTER', crew: null, rect: [540, 190, 90, 90] },
];

export default class BridgeScene extends Phaser.Scene {
  constructor() { super('Bridge'); }

  create(data) {
    Director.host = this;
    this.busy = 0; this.halted = false;
    const m = Director.mission, s = Director.state;
    this.cameras.main.fadeIn(350);

    paintTexture(this, 'bridge-bg', 320, 160, BRIDGE_ART);
    this.add.image(0, 0, 'bridge-bg').setOrigin(0).setScale(2);

    // viewscreen contents
    this.vsLayer = this.add.container(0, 0);
    const maskG = this.make.graphics({}, false).fillStyle(0xffffff).fillRect(VS.x, VS.y, VS.w, VS.h);
    maskG.setScale(VIEW_SCALE); // masks use their own transform, not the container's
    this.vsLayer.setMask(maskG.createGeometryMask());
    this.stars = new Starfield(this, VS.x, VS.y, VS.w, VS.h, { count: 70, vx: -8, depth: 1 });
    this.vsLayer.add(this.stars.g);
    this.refreshViewscreen();

    // crew at stations (sprites drawn at 2x)
    const crew = (id, x, y, frame, flip = false) => {
      makeHumanoid(this, `hum:${id}`, CREW[id].look);
      return this.add.image(x, y, `hum:${id}`, frame).setOrigin(0.5, 1).setScale(2).setFlipX(flip);
    };
    crew('arun', 70, 146, 'side0', true);
    crew('venn', 570, 146, 'side0', false);
    crew('brandt', 60, 268, 'side0', true);
    crew('sato', 270, 270, 'back0');
    crew('daska', 370, 270, 'back0');
    // consoles in front of helm (drawn after crew so they occlude legs)
    const g = this.add.graphics();
    g.fillStyle(0x2a3040).fillRect(236, 236, 168, 30);
    g.fillStyle(0x4a5470).fillRect(236, 236, 168, 4);
    for (let i = 0; i < 18; i++) g.fillStyle([0xff5040, 0x40e060, 0xf0c040, 0x40a0ff][i % 4]).fillRect(244 + i * 8, 248 + (i % 3) * 4, 4, 2);
    // captain's chair: back, then captain, then arm rests
    g.fillStyle(0x7a5038).fillRect(298, 268, 44, 40);
    g.fillStyle(0x5a3a2a).fillRect(298, 300, 44, 20);
    crew('captain', 320, 336, 'back0');
    const arms = this.add.graphics();
    arms.fillStyle(0x3a2418).fillRect(290, 296, 10, 24).fillRect(340, 296, 10, 24);
    arms.fillStyle(0xf0c040).fillRect(292, 298, 6, 2).fillStyle(0x40e060).fillRect(342, 298, 6, 2);

    // station hit areas
    for (const st of STATIONS) {
      const [x, y, w, h] = st.rect;
      const z = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerover', () => this.hover(st));
      z.on('pointerout', () => this.hover(null));
      z.on('pointerdown', () => this.station(st.id));
    }
    this.hoverText = text(this, BW / 2, 176, '', COLORS.highlight).setOrigin(0.5).setDepth(50);
    this.statusText = text(this, BW / 2, 156, '', COLORS.dim).setOrigin(0.5, 0).setDepth(5);
    this.alertBox = this.add.rectangle(0, 0, BW, BH, 0xff0000, 0).setOrigin(0).setDepth(40);

    // Everything so far is the bridge view; group it so the compact layout can scale it.
    if (COMPACT) {
      const view = this.children.list.slice().sort((a, b) => a.depth - b.depth);
      this.add.container(0, 0, view).setScale(VIEW_SCALE);
    }

    const btns = [
      ['HELM', 'helm', 'HELM'], ['SCIENCE', 'science', 'SCIENCE'], ['COMMS', 'comms', 'COMMS'], ['TACTICAL', 'tactical', 'TACTICAL'],
      ['ENGINEERING', 'engineering', 'ENGINEER'], ['TRANSPORTER', 'transporter', 'BEAM DOWN'], ['MISSION LOG', 'log', 'LOG'], ['MENU', 'menu', 'MENU'],
    ];
    if (COMPACT) {
      // sidebar: one column of large buttons
      const x = BW * VIEW_SCALE, w = WIDTH - x;
      panel(this, x, 0, w, HEIGHT);
      btns.forEach(([, id, short], i) => button(this, x + 6, 6 + i * 36, w - 12, 33, short, () => this.station(id), { size: 16 }));
    } else {
      panel(this, 0, 320, WIDTH, 80);
      btns.forEach(([label, id], i) => {
        button(this, 12 + (i % 4) * 156, 326 + Math.floor(i / 4) * 36, 148, 32, label, () => this.station(id));
      });
    }
    this.refreshStatus();
    this.refreshAlert();

    this.dialog = new DialogBox(this, Director.characters, { y: COMPACT ? HEIGHT : 152 });
    startDrone(['A1', 'E2'], 0.025);

    // entry scripts
    const after = async () => {
      this.busy++; // hold input for the whole arrival sequence
      try {
        if (data?.beamedUp) { sfx('transporter'); await this.wait(800); }
        if (data?.start) await Director.run(this, m.bridge?.onStart);
        if (this.halted) return;
        if (data?.then) await Director.run(this, data.then);
      } finally { this.busy--; }
    };
    after();
  }

  // ---- host API for scripts
  say(who, str) { return this.dialog.say(who, str); }
  choose(opts) { return this.dialog.choose(opts); }
  wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
  onScore(pts) { if (pts > 0) toast(this, `COMMENDATION +${pts}`, COLORS.good, 300); }
  onObjective(t) { toast(this, `NEW OBJECTIVE: ${t}`.slice(0, 70), COLORS.highlight, 290); }
  refreshAlert() {
    const red = Director.state.alert === 'red';
    this.tweens.killTweensOf(this.alertBox);
    this.alertBox.setAlpha(0);
    if (red) { this.alertBox.setFillStyle(0xff0000, 1); this.tweens.add({ targets: this.alertBox, alpha: 0.12, yoyo: true, repeat: -1, duration: 600 }); }
    this.refreshViewscreen();
  }

  hover(st) {
    if (!st) { this.hoverText.setText(''); return; }
    const who = st.crew ? ` - ${CREW[st.crew].name}` : '';
    this.hoverText.setText(`${st.label}${who}`);
  }

  get system() {
    const m = Director.mission;
    return m.starmap?.systems?.[Director.state.system] || null;
  }

  refreshStatus() {
    const s = Director.state;
    const sys = this.system;
    this.statusText.setText(`${(sys?.name || 'DEEP SPACE').toUpperCase()}   HULL ${s.ship.hull}%  SHIELDS ${s.ship.shields}%  TORPS ${s.ship.torpedoes}`);
  }

  refreshViewscreen() {
    if (!this.vsLayer) return;
    this.vsLayer.list.filter((o) => o !== this.stars?.g).forEach((o) => o.destroy());
    const sys = this.system;
    const view = sys?.view || {};
    if (view.planet) {
      const key = `vs-planet-${Director.state.system}`;
      makePlanet(this, key, { size: 96, seed: Director.state.system, ...view.planet });
      this.vsLayer.add(this.add.image(VS.x + VS.w * 0.68, VS.y + VS.h * 0.62, key).setScale(view.planet.scale || 2));
    }
    if (view.station) {
      const st = this.add.graphics();
      const cx = VS.x + 90, cy = VS.y + 50;
      st.fillStyle(0x8a90a0).fillRect(cx - 30, cy - 4, 60, 8).fillRect(cx - 4, cy - 26, 8, 52);
      st.fillStyle(0xc0c8d8).fillCircle(cx, cy, 12);
      st.fillStyle(0xffd060).fillRect(cx - 28, cy - 1, 4, 2).fillRect(cx + 24, cy - 1, 4, 2);
      this.vsLayer.add(st);
    }
    const ship = view.ship && check(view.ship.if, Director.context(this)) ? view.ship : null;
    if (ship) {
      const key = `ship-${ship.style}-${ship.color || ''}`;
      makeShip(this, key, ship.style, ship.color);
      const img = this.add.image(VS.x + VS.w * 0.3, VS.y + VS.h * 0.45, key).setScale(ship.scale || 1.5).setFlipX(true);
      this.tweens.add({ targets: img, y: img.y + 4, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
      this.vsLayer.add(img);
    }
    this.vsLayer.bringToTop(this.stars.g); this.vsLayer.sendToBack(this.stars.g);
  }

  // ---- stations
  async station(id) {
    if (this.busy || this.halted) return;
    const m = Director.mission, s = Director.state;
    const sys = this.system || {};
    // Mission overrides: bridge.stations[id] = [{ if, do }]. The first entry
    // whose condition holds replaces the default station behaviour.
    const ctx = Director.context(this);
    const override = [].concat(sys.stations?.[id] || [], m.bridge?.stations?.[id] || []).find((o) => check(o.if, ctx));
    if (override) return Director.run(this, override.do);
    switch (id) {
      case 'helm': return this.openStarmap();
      case 'science':
        return Director.run(this, sys.scan || [{ say: 'venn', text: 'Sensors show nothing of note in this system, Captain.' }]);
      case 'comms':
        return Director.run(this, sys.hail || [{ say: 'arun', text: 'No response on any frequency, sir.' }]);
      case 'tactical':
        return Director.run(this, sys.tactical || [{ say: 'daska', text: 'No hostile contacts on sensors, Captain. Weapons are standing by.' }]);
      case 'engineering': return this.engineering();
      case 'transporter': return this.transporter();
      case 'log': return this.missionLog();
      case 'menu': return this.menu();
    }
  }

  async engineering() {
    const s = Director.state;
    const sh = s.ship;
    const lines = [{ say: 'brandt', text: `Hull integrity ${sh.hull}%, shields at ${sh.shields}%. We've ${sh.torpedoes} torpedoes in the racks.` }];
    if (sh.hull < 100 || sh.shields < 100) {
      lines.push({
        choice: [
          { text: 'Effect repairs, Chief.', do: [{ say: 'brandt', text: 'Aye. Give me a few hours and she\'ll be right as rain.' }, { repair: { hull: 40, shields: 100 } }] },
          { text: 'Carry on.', do: [] },
        ],
      });
    } else {
      lines.push({ say: 'brandt', text: 'Everything\'s purring, Captain. Don\'t you go breaking her.' });
    }
    await Director.run(this, lines);
    this.refreshStatus();
  }

  async transporter() {
    const sys = this.system || {};
    const ctx = Director.context(this);
    const orbit = sys.orbit;
    if (!orbit) return Director.run(this, [{ say: 'venn', text: 'There is nowhere in transporter range to beam down to, Captain.' }]);
    if (!check(orbit.if, ctx)) return Director.run(this, orbit.blocked || [{ say: 'venn', text: 'Transport is not advisable at this time.' }]);
    await Director.run(this, [
      ...(orbit.before || []),
      { say: 'captain', text: orbit.line || 'Mr. Daska, Dr. Okafor, Commander Venn - you\'re with me.' },
      { sfx: 'transporter' },
      { beamDown: orbit.beamDown, at: orbit.at },
    ]);
  }

  async missionLog() {
    const s = Director.state;
    const lines = s.objectives.length
      ? s.objectives.map((o) => `${o.done ? '[X]' : '[ ]'} ${o.text}`).join('\n')
      : 'No logged objectives.';
    await this.say(null, `MISSION LOG - ${Director.mission.title.toUpperCase()}\n\n${lines}`);
  }

  async menu() {
    const i = await this.choose(['Resume', 'Save and return to title', 'Abandon mission']);
    if (i === 1) { Director.save(); Director._switch('Title', {}); }
    if (i === 2) {
      const j = await this.choose(['Keep going', 'Yes, abandon this mission (progress lost)']);
      if (j === 1) { Director.abandon(); this.scene.start('MissionSelect'); }
    }
  }

  // ---- star map
  openStarmap() {
    const m = Director.mission, s = Director.state;
    const ctx = Director.context(this);
    if (m.bridge?.navLock && check(m.bridge.navLock.if, ctx)) {
      return Director.run(this, m.bridge.navLock.do || [{ say: 'sato', text: 'We can\'t leave yet, Captain.' }]);
    }
    if (!m.starmap) return Director.run(this, [{ say: 'sato', text: 'No course plotted for this mission, sir.' }]);
    this.busy++;
    const c = this.add.container(0, 0).setDepth(900);
    c.add(this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    // map geometry differs per layout (compact has 300px of height)
    const MAP = COMPACT
      ? { px: 16, py: 6, ph: HEIGHT - 12, top: 44, ky: 1.5, bottom: 206, infoY: 214, engY: HEIGHT - 50 }
      : { px: 40, py: 20, ph: 362, top: 50, ky: 2, bottom: 300, infoY: 300, engY: 330 };
    c.add(panel(this, MAP.px, MAP.py, WIDTH - MAP.px * 2, MAP.ph));
    c.add(text(this, 60, MAP.py + 14, 'STELLAR CARTOGRAPHY - SELECT DESTINATION', COLORS.lcars1));
    const g = this.add.graphics(); c.add(g);
    const systems = Object.entries(m.starmap.systems).filter(([id, sy]) => !sy.hidden || s.unlocked.includes(id));
    const toScreen = (sy) => [60 + sy.x * 2, MAP.top + sy.y * MAP.ky];
    // grid
    g.lineStyle(1, 0x1e2c48);
    for (let x = 60; x < WIDTH - 60; x += 32) g.lineBetween(x, MAP.top, x, MAP.bottom);
    for (let y = MAP.top; y < MAP.bottom; y += 32) g.lineBetween(60, y, WIDTH - 60, y);
    const cur = m.starmap.systems[s.system];
    // Two-step selection: tap a system to read about it, then ENGAGE.
    // (Instant warp-on-tap gave touch players no way to see descriptions.)
    const info = text(this, 60, MAP.infoY, 'Select a system.', COLORS.dim, WIDTH - 280);
    c.add(info);
    const sel = this.add.graphics(); c.add(sel);
    let chosen = null;
    const close = () => { c.destroy(); this.busy--; };
    const engage = button(this, WIDTH - 196, MAP.engY, 136, 36, 'ENGAGE', async () => {
      if (!chosen) return;
      const id = chosen; close(); await this.warpTo(id);
    }, { color: 0x60e070, size: 16 }).setEnabled(false);
    for (const [id, sy] of systems) {
      const [x, y] = toScreen(sy);
      const locked = sy.locked && !s.unlocked.includes(id);
      const here = id === s.system;
      g.fillStyle(locked ? 0x404858 : (sy.color ? parseInt(sy.color.slice(1), 16) : 0xf0d070)).fillCircle(x, y, here ? 6 : 4);
      if (here) g.lineStyle(2, 0x60e070).strokeCircle(x, y, 10);
      c.add(text(this, x + 10, y - 4, sy.name.toUpperCase(), locked ? COLORS.dim : COLORS.text));
      const z = this.add.zone(x - 20, y - 20, 40, 40).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        sel.clear().lineStyle(2, 0xffd860).strokeCircle(x, y, 14);
        if (locked) { sfx('deny'); chosen = null; engage.setEnabled(false); info.setText(`${sy.name}: Uncharted. No reason to go there yet.`); return; }
        if (here) { chosen = null; engage.setEnabled(false); info.setText(`${sy.name}: We are already here. ${sy.desc || ''}`); return; }
        sfx('blip');
        chosen = id; engage.setEnabled(true);
        info.setText(`${sy.name}: ${sy.desc || ''}`);
      });
      c.add(z);
    }
    c.add(engage);
    c.add(button(this, WIDTH - 196, MAP.py + 8, 136, 30, 'CANCEL', close, { size: 16 }));
  }

  async warpTo(id) {
    const m = Director.mission, s = Director.state;
    const sy = m.starmap.systems[id];
    this.busy++; // held for the entire jump, including arrival scripts
    try {
      await this.say('sato', `Course laid in for ${sy.name}.`);
      await this.say('captain', 'Engage.');
      sfx('warp');
      this.stars.warp = 3;
      await this.wait(1800);
      this.stars.warp = 0;
      this.cameras.main.flash(250, 200, 220, 255);
      s.system = id;
      s.alert = null;
      this.refreshAlert();
      this.refreshStatus();
      await this.wait(400);
      const first = !s.visited[`sys:${id}`];
      s.visited[`sys:${id}`] = true;
      if (first && sy.onFirstArrive) await Director.run(this, sy.onFirstArrive);
      if (this.halted) return;
      await Director.run(this, sy.onArrive || [{ say: 'sato', text: `Arriving at ${sy.name}, Captain.` }]);
    } finally { this.busy--; }
    this.refreshViewscreen();
    this.refreshStatus();
  }

  update(t, dt) {
    this.stars.update(dt / 1000);
    // keep viewscreen/status in sync with script-driven state changes
    this._sigT = (this._sigT || 0) + dt;
    if (this._sigT > 250 && Director.state) {
      this._sigT = 0;
      const ship = this.system?.view?.ship;
      const sig = [Director.state.system, ship ? check(ship.if, Director.context(this)) : 0, JSON.stringify(Director.state.ship)].join('|');
      if (sig !== this._sig) { this._sig = sig; this.refreshViewscreen(); this.refreshStatus(); }
    }
  }
}
