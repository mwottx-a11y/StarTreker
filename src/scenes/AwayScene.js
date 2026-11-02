import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { DialogBox, button, panel, portraitKey, toast } from '../engine/ui.js';
import { paintTexture } from '../engine/painter.js';
import { makeHumanoid, registerHumanoidAnims, pixelMap, HUMANOID_H } from '../engine/pixel.js';
import { itemIcon } from '../engine/icons.js';
import { WIDTH, HEIGHT, ART, ROOM_W, ROOM_H, UI_Y, COLORS, COMPACT } from '../engine/constants.js';

const ROOM_PX_W = ROOM_W * ART; // room width on screen (640)
import { Director } from '../engine/director.js';
import { check, interp } from '../engine/script.js';
import { AWAY_TEAM, SPECIALTY, FALLBACK, pick } from '../cast/crew.js';
import { sfx, startDrone } from '../engine/audio.js';
import { IS_TOUCH, TOUCH_PAD, prefs } from '../engine/device.js';

const VERBS = ['walk', 'look', 'use', 'talk', 'get'];
const VERB_LABEL = { walk: 'Walk to', look: 'Look at', use: 'Use', talk: 'Talk to', get: 'Get' };
const FORMATION = { venn: [-18, -6], okafor: [18, -6], daska: [0, -12] };
const SPEED = 62; // art px / second at scale 1

/**
 * Away-team scene: a point-and-click room with the four-person landing party.
 * The room, its hotspots and all their behaviour come from mission data.
 */
export default class AwayScene extends Phaser.Scene {
  constructor() { super('Away'); }

  create(data) {
    Director.host = this;
    this.busy = 0; this.halted = false;
    const m = Director.mission, s = Director.state;
    this.roomId = data.room;
    this.room = m.rooms[data.room];
    s.location = { scene: 'away', room: data.room, at: data.at };
    this.mode = { verb: 'walk' };
    this.cameras.main.fadeIn(300);

    // background
    const bgKey = `room:${m.id}:${data.room}`;
    paintTexture(this, bgKey, ROOM_W, ROOM_H, this.room.paint || [{ type: 'rect', x: 0, y: 0, w: ROOM_W, h: ROOM_H, c: '#202028' }]);
    this.add.image(0, 0, bgKey).setOrigin(0).setScale(ART).setDepth(-10);
    if (this.room.image) this.loadImageBackground(this.room.image);

    // walk area
    this.walkPoly = this.room.walk?.poly || [[0, 110], [320, 110], [320, 148], [0, 148]];
    const sc = this.room.scale || [90, 0.75, 148, 1.05];
    this.depthScale = (y) => Phaser.Math.Clamp(sc[1] + ((y - sc[0]) / (sc[2] - sc[0])) * (sc[3] - sc[1]), Math.min(sc[1], sc[3]), Math.max(sc[1], sc[3]));

    // hotspots
    this.hotspotObjs = new Map();
    for (const h of this.room.hotspots || []) this.buildHotspot(h);
    this.refreshHotspots();

    // away team
    this.team = {};
    const at = data.at || this.room.start || [160, 135];
    this.addMember('captain', at[0], at[1]);
    for (const id of AWAY_TEAM) {
      const f = FORMATION[id];
      const p = this.clampToWalk(at[0] + f[0], at[1] + f[1]);
      this.addMember(id, p[0], p[1]);
    }
    if (data.face) this.face(data.face);
    this.refreshCrew();

    // foreground layer (paint commands drawn over characters)
    if (this.room.foreground) {
      const fgKey = `${bgKey}:fg`;
      paintTexture(this, fgKey, ROOM_W, ROOM_H, this.room.foreground);
      this.add.image(0, 0, fgKey).setOrigin(0).setScale(ART).setDepth(5000);
    }

    this.buildUI();
    this.dialog = new DialogBox(this, Director.characters, { y: 6, depth: 9500 }); // above the control sidebar/bar

    // input
    this.input.on('pointermove', (p) => this.onMove(p));
    this.input.on('pointerdown', (p) => this.onClick(p));

    if (this.room.drone) startDrone(this.room.drone, this.room.droneVol ?? 0.035);

    // entry
    const enter = async () => {
      this.busy++; // block input during the arrival sequence
      if (data.beam) await this.beamInEffect();
      this.busy--;
      const first = !s.visited[data.room];
      s.visited[data.room] = true;
      Director.save();
      if (first && this.room.onFirstEnter) await Director.run(this, this.room.onFirstEnter);
      if (this.halted) return;
      if (this.room.onEnter) await Director.run(this, this.room.onEnter);
      if (this.halted) return;
      if (data.then) await Director.run(this, data.then);
    };
    enter();
  }

  loadImageBackground(url) {
    const key = `img:${url}`;
    const place = () => this.add.image(0, 0, key).setOrigin(0).setDisplaySize(ROOM_W * ART, ROOM_H * ART).setDepth(-9);
    if (this.textures.exists(key)) return place();
    this.load.image(key, url);
    this.load.once('complete', place);
    this.load.start();
  }

  // ------------------------------------------------------------ characters

  charKey(id) {
    const def = Director.characters[id];
    const key = `hum:${id}`;
    makeHumanoid(this, key, def.look || {});
    registerHumanoidAnims(this, key);
    return key;
  }

  addMember(id, x, y) {
    const key = this.charKey(id);
    const spr = this.add.sprite(x * ART, y * ART, key, 'front0').setOrigin(0.5, 1);
    const mem = { id, key, spr, x, y, tx: x, ty: y, dir: 'front', moving: false };
    this.team[id] = mem;
    this.placeMember(mem);
    return mem;
  }

  placeMember(mem) {
    mem.spr.setPosition(Math.round(mem.x) * ART, Math.round(mem.y) * ART);
    mem.spr.setScale(ART * this.depthScale(mem.y));
    mem.spr.setDepth(mem.y);
  }

  face(dir) {
    const c = this.team.captain;
    if (!c) return;
    if (dir === 'left' || dir === 'right') { c.spr.setFrame('side0'); c.spr.setFlipX(dir === 'left'); c.dir = 'side'; }
    else if (dir === 'up') { c.spr.setFrame('back0'); c.dir = 'back'; }
    else { c.spr.setFrame('front0'); c.dir = 'front'; }
  }

  /** Captain walks to (x,y); resolves on arrival. Crew follow in formation. */
  walkTo(x, y) {
    const [tx, ty] = this.clampToWalk(x, y);
    const cap = this.team.captain;
    cap.tx = tx; cap.ty = ty;
    for (const id of AWAY_TEAM) {
      const mem = this.team[id];
      if (Director.state.crew[id]?.injured) continue;
      const f = FORMATION[id];
      const [fx, fy] = this.clampToWalk(tx + f[0], ty + f[1]);
      mem.tx = fx; mem.ty = fy;
    }
    return new Promise((resolve) => { cap.onArrive = resolve; });
  }

  stepMember(mem, dt) {
    const dx = mem.tx - mem.x, dy = mem.ty - mem.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.8) {
      if (mem.moving) {
        mem.moving = false;
        mem.spr.anims.stop();
        mem.spr.setFrame(mem.dir === 'side' ? 'side0' : mem.dir === 'back' ? 'back0' : 'front0');
        mem.x = mem.tx; mem.y = mem.ty; this.placeMember(mem);
      }
      if (mem.onArrive) { const f = mem.onArrive; mem.onArrive = null; f(); }
      return;
    }
    const sp = SPEED * this.depthScale(mem.y) * dt;
    const k = Math.min(1, sp / dist);
    mem.x += dx * k; mem.y += dy * k * 1.0;
    const dir = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'side' : dy > 0 ? 'front' : 'back';
    const anim = `${mem.key}:${dir === 'side' ? 'walkSide' : dir === 'front' ? 'walkFront' : 'walkBack'}`;
    if (!mem.moving || mem.dir !== dir) { mem.spr.play(anim); }
    if (dir === 'side') mem.spr.setFlipX(dx < 0);
    mem.dir = dir; mem.moving = true;
    this.placeMember(mem);
  }

  refreshCrew() {
    for (const id of AWAY_TEAM) {
      const mem = this.team[id];
      if (!mem) continue;
      const hurt = Director.state.crew[id]?.injured;
      if (hurt) { mem.spr.anims.stop(); mem.spr.setFrame('down'); mem.tx = mem.x; mem.ty = mem.y; mem.moving = false; }
      else if (mem.spr.frame.name === 'down') mem.spr.setFrame('front0');
      mem.spr.setTint(hurt ? 0xffb0b0 : 0xffffff);
    }
    this.refreshCrewButtons?.();
  }

  // ------------------------------------------------------------ hotspots

  buildHotspot(h) {
    let obj = null;
    if (h.npc) {
      const key = this.charKey(h.npc);
      const [x, y] = h.at || [h.rect[0] + h.rect[2] / 2, h.rect[1] + h.rect[3]];
      obj = this.add.sprite(x * ART, y * ART, key, h.pose || 'front0').setOrigin(0.5, 1);
      obj.setScale(ART * (h.scale ?? this.depthScale(y)));
      obj.setFlipX(!!h.flip);
      obj.setDepth(y);
      if (h.tint) obj.setTint(parseInt(h.tint.replace('#', ''), 16));
    } else if (h.sprite) {
      const key = `hs:${Director.mission.id}:${this.roomId}:${h.id}`;
      const sp = h.sprite;
      if (sp.pixels) pixelMap(this, key, sp.pixels.rows, sp.pixels.palette);
      else paintTexture(this, key, sp.w, sp.h, sp.paint);
      const [x, y] = h.at || [h.rect[0], h.rect[1]];
      obj = this.add.image(x * ART, y * ART, key).setOrigin(0).setScale(ART);
      obj.setDepth(h.depth ?? (y + (sp.h || 0)));
    }
    if (obj && h.anim) this.animate(obj, h.anim);
    // auto-derive rect from npc sprite if missing
    let rect = h.rect;
    if (!rect && h.npc) {
      const s = obj.scaleX / ART;
      rect = [obj.x / ART - 8 * s, obj.y / ART - HUMANOID_H * s, 16 * s, HUMANOID_H * s];
    } else if (!rect && obj) {
      rect = [obj.x / ART, obj.y / ART, obj.width, obj.height];
    }
    this.hotspotObjs.set(h.id, { def: h, obj, rect });
  }

  animate(obj, anim) {
    if (anim === 'pulse') this.tweens.add({ targets: obj, alpha: 0.55, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    if (anim === 'bob') this.tweens.add({ targets: obj, y: obj.y - 4, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' });
    if (anim === 'flicker') this.time.addEvent({ delay: 120, loop: true, callback: () => obj.setAlpha(Math.random() < 0.15 ? 0.3 : 1) });
    if (anim === 'sway') this.tweens.add({ targets: obj, angle: 2, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });
  }

  hotspotVisible(h) {
    const s = Director.state;
    if (Director.state.isHidden(this.roomId, h.id, !!h.hidden)) return false;
    if (h.if && !check(h.if, Director.context(this))) return false;
    return true;
  }

  refreshHotspots() {
    if (!this.hotspotObjs) return;
    for (const [id, ho] of this.hotspotObjs) {
      const vis = this.hotspotVisible(ho.def);
      ho.visible = vis;
      if (ho.obj) {
        ho.obj.setVisible(vis);
        const pose = Director.state.poses[`${this.roomId}:${id}`];
        if (pose && ho.obj.setFrame && ho.def.npc) ho.obj.setFrame(pose);
      }
    }
  }

  moveNpc(id, to, speed = 40) {
    const ho = this.hotspotObjs.get(id);
    if (!ho?.obj) return;
    const [x, y] = to;
    const dist = Math.hypot(x * ART - ho.obj.x, y * ART - ho.obj.y);
    if (ho.def.npc) { ho.obj.play(`${this.charKey(ho.def.npc)}:walkSide`); ho.obj.setFlipX(x * ART < ho.obj.x); }
    return new Promise((resolve) => {
      this.tweens.add({
        targets: ho.obj, x: x * ART, y: y * ART, duration: (dist / ART / speed) * 1000,
        onComplete: () => {
          if (ho.def.npc) { ho.obj.anims.stop(); ho.obj.setFrame('front0'); }
          ho.obj.setDepth(y);
          const r = ho.rect; ho.rect = [x - r[2] / 2, y - r[3], r[2], r[3]];
          resolve();
        },
      });
    });
  }

  hotspotAt(ax, ay) {
    const list = [...this.hotspotObjs.values()].filter((h) => h.visible);
    // smallest containing rect wins - lets small objects sit on top of large ones
    let best = null, bestArea = Infinity;
    const P = TOUCH_PAD; // fingertip margin on touch screens
    for (const h of list) {
      const [x, y, w, hh] = h.rect;
      if (ax >= x - P && ax <= x + w + P && ay >= y - P && ay <= y + hh + P) {
        const area = w * hh;
        if (area < bestArea) { best = h; bestArea = area; }
      }
    }
    return best;
  }

  crewAt(ax, ay) {
    for (const id of AWAY_TEAM) {
      const mem = this.team[id];
      const s = this.depthScale(mem.y);
      const down = mem.spr.frame.name === 'down';
      const w = 14 * s + TOUCH_PAD, h = (down ? 10 : 38) * s;
      if (ax >= mem.x - w / 2 && ax <= mem.x + w / 2 && ay >= mem.y - h && ay <= mem.y) return id;
    }
    return null;
  }

  // ------------------------------------------------------------ walk area

  inPoly(x, y, poly = this.walkPoly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  clampToWalk(x, y) {
    if (this.inPoly(x, y)) return [x, y];
    let best = [x, y], bd = Infinity;
    const P = this.walkPoly;
    for (let i = 0; i < P.length; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
      const dx = bx - ax, dy = by - ay;
      const t = Phaser.Math.Clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const px = ax + dx * t, py = ay + dy * t;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < bd) { bd = d; best = [px, py]; }
    }
    // nudge slightly inside
    const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
    const nx = best[0] + Math.sign(cx - best[0]) * 0.5, ny = best[1] + Math.sign(cy - best[1]) * 0.5;
    return [nx, ny];
  }

  // ------------------------------------------------------------ UI

  buildUI() {
    const D = 8001;
    const big = prefs.largeText || COMPACT;
    this.hoverLabel = text(this, 12, UI_Y - (big ? 21 : 14), '', COLORS.highlight).setDepth(9000);
    if (big) this.hoverLabel.setFontSize(16);
    this.hoverBg = this.add.rectangle(6, UI_Y - (big ? 25 : 18), 10, big ? 22 : 14, 0x000000, 0.6).setOrigin(0).setDepth(8999);
    this.roomLabel = text(this, ROOM_PX_W - 8, UI_Y - (big ? 26 : 14), (this.room.name || '').toUpperCase(), COLORS.dim).setOrigin(1, 0).setDepth(9000);

    this.invSlots = [];
    if (COMPACT) this.buildSidebar(D);
    else this.buildBottomBar(D);
    this.refreshInventory();
    this.setMode({ verb: 'walk' });

    this.input.keyboard?.on('keydown', (e) => {
      if (this.busy || this.halted) return;
      const map = { w: 'walk', l: 'look', u: 'use', t: 'talk', g: 'get' };
      if (map[e.key]) this.setMode({ verb: map[e.key] });
      if (e.key === 'c') this.communicator();
      if (e.key === 'i' && COMPACT) this.openInventory();
      if (e.key === 'Escape') this.setMode({ verb: 'walk' });
    });
  }

  /** Standard layout: verbs, crew and inventory in a bar under the room. */
  buildBottomBar(D) {
    panel(this, 0, UI_Y, WIDTH, 100).setDepth(8000);
    this.verbBtns = {};
    const verbs = [...VERBS, 'comm'];
    verbs.forEach((v, i) => {
      const label = v === 'comm' ? 'COMM' : v.toUpperCase();
      const b = button(this, 10 + (i % 3) * 84, UI_Y + 6 + Math.floor(i / 3) * 32, 80, 28, label, () => {
        if (v === 'comm') return this.communicator();
        this.setMode({ verb: v });
      }).setDepth(D);
      this.verbBtns[v] = b;
    });

    // reveal every hotspot: discoverability without hover (and handy anywhere)
    button(this, 10, UI_Y + 70, 248, 26, 'SHOW HOTSPOTS', () => this.revealHotspots()).setDepth(D);

    // crew specialists
    this.crewBtns = {};
    AWAY_TEAM.forEach((id, i) => {
      const def = Director.characters[id];
      const x = 268 + i * 46, y = UI_Y + 10;
      const key = portraitKey(this, id, def);
      const img = this.add.image(x, y, key).setOrigin(0).setDepth(D).setInteractive({ useHandCursor: true });
      const frame = this.add.rectangle(x - 2, y - 2, 44, 44).setOrigin(0).setStrokeStyle(2, COLORS.panelEdge).setDepth(D);
      const lbl = text(this, x + 20, y + 46, SPECIALTY[id].label, def.color).setOrigin(0.5, 0).setDepth(D);
      img.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); sfx('blip'); this.setMode({ crew: id }); });
      img.on('pointerover', () => this.setHover(`${def.name} - ${SPECIALTY[id].verb}`));
      img.on('pointerout', () => this.setHover(''));
      this.crewBtns[id] = { img, frame, lbl };
    });
    this.refreshCrewButtons = () => {
      for (const id of AWAY_TEAM) {
        const b = this.crewBtns[id];
        b.img.setTint(Director.state.crew[id]?.injured ? 0xff6060 : 0xffffff);
      }
    };
    this.refreshCrewButtons();

    // inventory
    for (let i = 0; i < 10; i++) this.addInvSlot(412 + (i % 5) * 44, UI_Y + 10 + Math.floor(i / 5) * 44, 40, D);
  }

  /**
   * Compact layout (phones in landscape): the room fills the full height and the
   * controls sit in a sidebar with large labels. Inventory opens as an overlay.
   */
  buildSidebar(D) {
    const x0 = ROOM_PX_W, w = WIDTH - x0;
    panel(this, x0, 0, w, HEIGHT).setDepth(8000);
    // crew specialists, scaled to fit three across
    this.crewBtns = {};
    const cs = Math.min(1, (w - 16) / 3 / 44);
    AWAY_TEAM.forEach((id, i) => {
      const def = Director.characters[id];
      const x = x0 + 8 + i * 44 * cs + 2, y = 8;
      const img = this.add.image(x, y, portraitKey(this, id, def)).setOrigin(0).setScale(cs).setDepth(D).setInteractive({ useHandCursor: true });
      const frame = this.add.rectangle(x - 2, y - 2, 40 * cs + 4, 40 * cs + 4).setOrigin(0).setStrokeStyle(2, COLORS.panelEdge).setDepth(D);
      img.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); sfx('blip'); this.setMode({ crew: id }); });
      this.crewBtns[id] = { img, frame };
    });
    this.refreshCrewButtons = () => {
      for (const id of AWAY_TEAM) this.crewBtns[id].img.setTint(Director.state.crew[id]?.injured ? 0xff6060 : 0xffffff);
    };
    this.refreshCrewButtons();
    // verbs, one per row
    this.verbBtns = {};
    const top = 8 + 44 * cs + 6, rowH = 31;
    [...VERBS, 'comm'].forEach((v, i) => {
      this.verbBtns[v] = button(this, x0 + 6, top + i * rowH, w - 12, rowH - 3, v.toUpperCase(), () => {
        if (v === 'comm') return this.communicator();
        this.setMode({ verb: v });
      }, { size: 16 }).setDepth(D);
    });
    const yb = top + 6 * rowH + 2;
    this.itemsBtn = button(this, x0 + 6, yb, w - 12, 28, 'ITEMS', () => this.openInventory(), { size: 16, color: 0xffd860 }).setDepth(D);
    button(this, x0 + 6, yb + 31, w - 12, Math.min(28, HEIGHT - yb - 35), 'REVEAL', () => this.revealHotspots(), { size: 16 }).setDepth(D);
  }

  /** One inventory slot with select / examine / combine behaviour. */
  addInvSlot(x, y, size, depth, container = null, onPicked = null) {
    const bg = this.add.rectangle(x, y, size, size, 0x0c1420).setOrigin(0).setStrokeStyle(2, COLORS.panelEdge).setDepth(depth).setInteractive({ useHandCursor: true });
    const icon = this.add.image(x + size / 2, y + size / 2, '__DEFAULT').setScale(size >= 56 ? 3 : 2).setDepth(depth).setVisible(false);
    const slot = { bg, icon, item: null };
    container?.add([bg, icon]);
    bg.on('pointerdown', (p, lx, ly, ev) => {
      ev.stopPropagation();
      if (!slot.item) return;
      sfx('blip');
      const held = this.mode.item;
      onPicked?.();
      if (p.rightButtonDown() || held === slot.item) this.describeItem(slot.item);
      else if (held && held !== slot.item) this.combineItems(held, slot.item);
      else this.setMode({ item: slot.item });
    });
    bg.on('pointerover', () => { if (slot.item) this.setHover(this.mode.item && this.mode.item !== slot.item ? `Use ${this.itemName(this.mode.item)} with ${this.itemName(slot.item)}` : this.itemName(slot.item)); });
    bg.on('pointerout', () => this.setHover(this.modePrefix()));
    this.invSlots.push(slot);
    return slot;
  }

  /** Compact layout: inventory as a large overlay over the room. */
  openInventory() {
    if (this.busy || this.halted || this.invLayer) return;
    const D = 8600;
    const c = this.add.container(0, 0).setDepth(D);
    this.invLayer = c;
    const close = () => {
      this.invSlots = []; this.invLayer = null; c.destroy();
      this.setMode(this.mode); // refresh highlights
    };
    const shade = this.add.rectangle(0, 0, ROOM_PX_W, HEIGHT, 0x000000, 0.55).setOrigin(0).setDepth(D).setInteractive();
    shade.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); close(); });
    const pw = 5 * 64 + 28, ph = 2 * 64 + 74, px = (ROOM_PX_W - pw) / 2, py = (HEIGHT - ph) / 2;
    const help = this.mode.item ? `Holding ${this.itemName(this.mode.item)}` : 'Tap to use'; // one line
    c.add([shade, panel(this, px, py, pw, ph).setDepth(D), text(this, px + 16, py + 14, 'ITEMS', COLORS.lcars1).setFontSize(16).setDepth(D),
      text(this, px + 16, py + ph - 20, `${help}. Tap again to examine.`, COLORS.dim, pw - 32).setDepth(D)]);
    this.invSlots = [];
    for (let i = 0; i < 10; i++) this.addInvSlot(px + 14 + (i % 5) * 64, py + 40 + Math.floor(i / 5) * 64, 56, D + 1, c, close);
    c.add(button(this, px + pw - 106, py + 8, 92, 26, 'CLOSE', close, { size: 16 }).setDepth(D + 1));
    this.refreshInventory();
    this.setMode(this.mode);
  }

  itemName(id) { return Director.items[id]?.name || id; }

  async describeItem(id) {
    const def = Director.items[id] || {};
    await Director.run(this, def.look || [{ narrate: def.desc || def.name || id }]);
  }

  async combineItems(a, b) {
    const defA = Director.items[a] || {}, defB = Director.items[b] || {};
    const acts = defA.combine?.[b] || defB.combine?.[a];
    this.setMode({ verb: 'walk' });
    await Director.run(this, acts || [{ say: 'captain', text: pick(FALLBACK.item) }]);
  }

  refreshInventory() {
    if (!this.invSlots) return;
    const inv = Director.state.inventory;
    this.invSlots.forEach((slot, i) => {
      const id = inv[i];
      slot.item = id || null;
      if (id) { slot.icon.setTexture(itemIcon(this, id, Director.items[id])).setVisible(true); }
      else slot.icon.setVisible(false);
    });
    if (this.mode.item && !inv.includes(this.mode.item)) this.setMode({ verb: 'walk' });
  }

  setMode(mode) {
    this.mode = mode;
    for (const [v, b] of Object.entries(this.verbBtns)) b.setSelected(mode.verb === v);
    for (const id of AWAY_TEAM) this.crewBtns[id].frame.setStrokeStyle(2, mode.crew === id ? COLORS.highlight : COLORS.panelEdge);
    for (const slot of this.invSlots) slot.bg.setStrokeStyle(2, slot.item && mode.item === slot.item ? COLORS.highlight : COLORS.panelEdge);
    this.itemsBtn?.setSelected(!!mode.item);
    this.setHover(this.modePrefix());
  }

  modePrefix() {
    const m = this.mode;
    if (m.item) return `Use ${this.itemName(m.item)} on`;
    if (m.crew) return `${Director.characters[m.crew].short}: ${SPECIALTY[m.crew].verb}`;
    return VERB_LABEL[m.verb];
  }

  inRoom(p) { return p.x < ROOM_PX_W && p.y < ROOM_H * ART; }

  setHover(str) {
    this.hoverLabel.setText(str);
    this.hoverBg.setSize(str ? this.hoverLabel.width + 12 : 0, this.hoverBg.height);
  }

  /** Briefly outline and name every interactive thing in the room. */
  revealHotspots() {
    if (this.busy || this.halted) return;
    this.revealLayer?.destroy();
    const c = this.add.container(0, 0).setDepth(7000);
    this.revealLayer = c;
    for (const ho of this.hotspotObjs.values()) {
      if (!ho.visible) continue;
      const [x, y, w, h] = ho.rect.map((v) => v * ART);
      const col = ho.def.exit ? 0x60e070 : 0xffd860;
      c.add(this.add.rectangle(x, y, w, h).setOrigin(0).setStrokeStyle(2, col, 0.9));
      const label = (ho.def.exit ? '> ' : '') + ho.def.name;
      const ty = Math.max(2, y - 11);
      const t = text(this, 0, ty, label, col).setOrigin(0.5, 0);
      t.setX(Phaser.Math.Clamp(x + w / 2, t.width / 2 + 4, ROOM_PX_W - t.width / 2 - 4));
      c.add(this.add.rectangle(t.x, ty - 1, t.width + 6, 10, 0x000000, 0.7).setOrigin(0.5, 0));
      c.add(t);
    }
    this.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 500, onComplete: () => c.destroy() });
  }

  onMove(p) {
    if (!this.inRoom(p)) return;
    const ax = p.x / ART, ay = p.y / ART;
    const h = this.hotspotAt(ax, ay);
    const crew = this.crewAt(ax, ay);
    const name = crew ? Director.characters[crew].short : h ? h.def.name : '';
    this.setHover(name ? `${this.modePrefix()} ${name}` : this.modePrefix());
    this.input.setDefaultCursor(h || crew ? 'pointer' : 'default');
  }

  onClick(p) {
    if (!this.inRoom(p) || this.busy || this.halted || this.invLayer) return;
    // no hover on touch screens: show what was tapped, and mark the spot
    this.onMove(p);
    if (p.wasTouch) {
      const ring = this.add.circle(p.x, p.y, 6).setStrokeStyle(2, COLORS.highlight).setDepth(6500);
      this.tweens.add({ targets: ring, radius: 14, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
    }
    if (p.rightButtonDown()) {
      // cycle verbs (and drop any held item / crew selection)
      const i = this.mode.verb ? VERBS.indexOf(this.mode.verb) : -1;
      this.setMode({ verb: VERBS[(i + 1) % VERBS.length] });
      return;
    }
    const ax = p.x / ART, ay = p.y / ART;
    const crew = this.crewAt(ax, ay);
    if (crew && this.mode.verb !== 'walk') return this.interactCrew(crew);
    const h = this.hotspotAt(ax, ay);
    if (h) return this.interact(h);
    this.walkTo(ax, ay);
  }

  // ------------------------------------------------------------ interactions

  async interact(ho) {
    const h = ho.def;
    const mode = this.mode;
    const ctx = Director.context(this);
    const verb = mode.item ? 'item' : mode.crew ? 'crew' : mode.verb;
    this.target = ho;

    // exits: walking (or using) them leaves the room
    if (h.exit && (verb === 'walk' || verb === 'use')) {
      await this.approach(ho);
      if (this.halted) return;
      if (h.exit.if && !check(h.exit.if, ctx)) return Director.run(this, h.exit.blocked || [{ say: 'venn', text: 'We cannot go that way yet, Captain.' }]);
      return Director.run(this, [...(h.onExit || []), { goto: h.exit.room, at: h.exit.at, face: h.exit.face }]);
    }
    if (verb === 'walk') return this.approach(ho);

    const asActions = (v, speaker = null) => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'string') return speaker ? [{ say: speaker, text: v }] : [{ narrate: v }];
      if (Array.isArray(v)) return v;
      // condition list form: [{ if, do }] as object with cases
      if (v.cases) { const c = v.cases.find((x) => check(x.if, ctx)); return c ? asActions(c.do, speaker) : null; }
      return [v];
    };

    let actions = null;
    if (verb === 'look') {
      actions = asActions(h.look) || [{ narrate: h.desc || `It's ${aOrAn(h.name)}.` }];
    } else if (verb === 'crew') {
      const id = mode.crew;
      if (Director.state.crew[id]?.injured) actions = [{ narrate: interp(FALLBACK.injured[0].replace('{name}', Director.characters[id].short), ctx) }];
      else {
        const spec = SPECIALTY[id];
        actions = asActions(h[id], id) || asActions(h[spec.field], id) || [{ say: id, text: pick(FALLBACK[id]) }];
        if (spec.sfx) actions = [{ sfx: spec.sfx }, ...actions];
      }
    } else if (verb === 'item') {
      const it = mode.item;
      actions = asActions(h.items?.[it]) || asActions(h.items?.['*']);
      if (!actions) {
        if (it === 'phaser_kill') actions = [{ say: 'okafor', text: pick(FALLBACK.phaserKill) }];
        else if (it === 'phaser_stun' && h.npc) actions = [{ say: 'venn', text: pick(FALLBACK.phaserStunLiving) }];
        else actions = [{ say: 'captain', text: pick(FALLBACK.item) }];
      }
      this.setMode({ verb: 'walk' });
    } else {
      actions = asActions(h[verb]);
      if (verb !== 'look' && actions && h.approach !== false) { await this.approach(ho); if (this.halted) return; }
      if (!actions) actions = [{ say: 'captain', text: pick(verb === 'talk' && h.npc ? [`${h.name} doesn't respond.`] : FALLBACK[verb]) }];
    }
    await Director.run(this, actions);
  }

  async interactCrew(id) {
    const mode = this.mode;
    const def = Director.characters[id];
    const s = Director.state;
    const ctx = Director.context(this);
    const m = Director.mission;
    let actions;
    if (mode.crew === 'okafor' && s.crew[id]?.injured) {
      actions = m.healScripts?.[id] || [
        { sfx: 'scan' },
        { say: 'okafor', text: `Hold still, ${def.short}. Hypospray... there. You'll live.` },
        { heal: id },
        { say: id, text: 'Thank you, Doctor.' },
      ];
    } else if (mode.verb === 'look') {
      actions = [{ narrate: `${def.name}, ${def.role}. ${def.bio || ''}${s.crew[id]?.injured ? ' Injured.' : ''}` }];
    } else if (mode.verb === 'talk') {
      const opt = (m.crewTalk?.[id] || []).find((o) => check(o.if, ctx));
      actions = opt ? opt.do : [{ say: id, text: { venn: 'I am at your disposal, Captain.', okafor: 'Something on your mind, Captain?', daska: 'Standing by, sir!' }[id] }];
    } else if (mode.item) {
      const it = mode.item;
      if (it === 'phaser_kill' || it === 'phaser_stun') actions = [{ say: id, text: 'Captain?!' }];
      else actions = [{ say: id, text: `I don't think I need the ${this.itemName(it)}, Captain.` }];
      this.setMode({ verb: 'walk' });
    } else {
      actions = [{ say: id, text: 'Captain?' }];
    }
    await Director.run(this, actions);
  }

  async approach(ho) {
    const h = ho.def, r = ho.rect;
    const [x, y] = h.walkTo || [r[0] + r[2] / 2, r[1] + r[3] + 4];
    await this.walkTo(x, y);
    // face the hotspot
    const cx = r[0] + r[2] / 2;
    const cap = this.team.captain;
    if (h.faceDir) this.face(h.faceDir);
    else if (Math.abs(cx - cap.x) > 6) this.face(cx < cap.x ? 'left' : 'right');
    else this.face(r[1] + r[3] < cap.y ? 'up' : 'down');
  }

  /** Script action { phaser: 'stun' | 'kill' } - fire at the current target. */
  firePhaser(kind = 'stun') {
    const ho = this.target;
    sfx(kind === 'kill' ? 'handphaser' : 'stun');
    if (!ho) return;
    const h = { rect: ho.rect };
    const cap = this.team.captain;
    const sx = cap.x * ART, sy = (cap.y - 22) * ART;
    const tx = (h.rect[0] + h.rect[2] / 2) * ART, ty = (h.rect[1] + h.rect[3] / 2) * ART;
    const g = this.add.graphics().setDepth(6000);
    const col = kind === 'kill' ? 0xff4030 : 0x60c0ff;
    g.lineStyle(4, col, 1).lineBetween(sx, sy, tx, ty);
    g.lineStyle(2, 0xffffff, 1).lineBetween(sx, sy, tx, ty);
    this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
  }

  async communicator() {
    if (this.busy || this.halted) return;
    sfx('chirp');
    const m = Director.mission;
    const ctx = Director.context(this);
    const opts = ['"Hale to Meridian. Beam us up."', '"Hale to Meridian. Status report."', 'Close communicator.'];
    await Director.run(this, [{
      choice: [
        {
          text: opts[0], do: (() => {
            const room = this.room.beamUp;
            const mis = (m.awayBeamUp || []).find((o) => check(o.if, ctx));
            if (room) return room;
            if (mis) return mis.do;
            return [{ say: 'arun', text: 'Locking on, Captain. Energizing.' }, { sfx: 'transporter' }, { beamUp: true }];
          })(),
        },
        {
          text: opts[1], do: (() => {
            const open = Director.state.objectives.filter((o) => !o.done).map((o) => o.text);
            return [{ say: 'arun', text: open.length ? `All quiet up here, sir. Outstanding objectives: ${open.join('; ')}.` : 'All quiet up here, Captain.' }];
          })(),
        },
        { text: opts[2], do: [] },
      ],
    }]);
  }

  async beamInEffect() {
    const all = Object.values(this.team).map((m) => m.spr);
    all.forEach((s) => s.setAlpha(0));
    sfx('transporter');
    const sparkles = all.map((s) => {
      const g = this.add.graphics().setDepth(s.depth + 1);
      return { g, s };
    });
    await new Promise((resolve) => {
      let t = 0;
      const ev = this.time.addEvent({
        delay: 50, repeat: 24, callback: () => {
          t++;
          for (const { g, s } of sparkles) {
            g.clear();
            const h = s.displayHeight, w = s.displayWidth;
            for (let i = 0; i < 14; i++) g.fillStyle(0xe0f0ff, Math.random()).fillRect(s.x - w / 2 + Math.random() * w, s.y - h + Math.random() * h, 2, 2);
            s.setAlpha(t / 24);
          }
          if (t >= 24) { sparkles.forEach(({ g }) => g.destroy()); resolve(); }
        },
      });
    });
  }

  // ------------------------------------------------------------ host API

  say(who, str) { return this.dialog.say(who, str); }
  choose(opts) { return this.dialog.choose(opts); }
  wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
  onScore(pts) { if (pts > 0) toast(this, `COMMENDATION +${pts}`, COLORS.good, UI_Y - 30); }
  onObjective(t) { toast(this, `NEW OBJECTIVE: ${t}`.slice(0, 72), COLORS.highlight, UI_Y - 46); }
  onBusyChange() { if (this.busy) this.input.setDefaultCursor('wait'); else this.input.setDefaultCursor('default'); }

  update(t, dt) {
    const d = Math.min(dt, 50) / 1000;
    if (!this.team) return;
    for (const mem of Object.values(this.team)) {
      if (mem.id !== 'captain' && Director.state.crew[mem.id]?.injured) continue;
      this.stepMember(mem, d);
    }
  }
}

function aOrAn(name = 'something') {
  const n = name.toLowerCase();
  if (/^(the|a|an|some)\s/.test(n) || /^[A-Z]/.test(name)) return name;
  return (/^[aeiou]/.test(n) ? 'an ' : 'a ') + n;
}
