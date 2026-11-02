import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { DialogBox, button, panel, toast } from '../engine/ui.js';
import { makeShip, makePlanet } from '../engine/pixel.js';
import { WIDTH, HEIGHT, COLORS } from '../engine/constants.js';
import { Director } from '../engine/director.js';
import { Halt } from '../engine/script.js';
import { sfx, startDrone } from '../engine/audio.js';
import { IS_TOUCH } from '../engine/device.js';

const VIEW_H = 320;
const CX = WIDTH / 2, CY = VIEW_H / 2;
const F = 320; // focal length
const DEADZONE = 36;

/**
 * Ship-to-ship combat seen through the main viewscreen. The world is kept in
 * the player's frame of reference: turning the ship rotates everything else.
 * Aim with the mouse (the ship turns toward the crosshair), left-click for
 * phasers, right-click / T for photon torpedoes. Arrow keys/WASD also steer.
 */
export default class CombatScene extends Phaser.Scene {
  constructor() { super('Combat'); }

  create(data) {
    Director.host = this;
    this.busy = 0; this.halted = false; this.paused = false; this.over = false;
    const m = Director.mission, s = Director.state;
    this.enc = m.encounters[data.encounter];
    this.encId = data.encounter;
    this.cameras.main.fadeIn(300);
    s.alert = 'red';

    // background objects
    this.starG = this.add.graphics().setDepth(0);
    this.stars = Array.from({ length: 220 }, () => {
      const v = new Phaser.Math.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().scale(900 + Math.random() * 300);
      return v;
    });
    this.planetDir = null;
    if (this.enc.background?.planet) {
      makePlanet(this, `combat-planet-${this.encId}`, { size: 96, ...this.enc.background.planet });
      this.planet = this.add.image(0, 0, `combat-planet-${this.encId}`).setScale(4).setDepth(1);
      this.planetDir = new Phaser.Math.Vector3(0.6, -0.25, 1).normalize().scale(5000);
    }

    // enemies
    this.enemies = this.enc.enemies.map((e, i) => {
      const key = `ship-${e.style || 'raider'}-${e.color || ''}`;
      makeShip(this, key, e.style || 'raider', e.color);
      const spr = this.add.image(0, 0, key).setDepth(10);
      const pos = new Phaser.Math.Vector3((i - (this.enc.enemies.length - 1) / 2) * 220, 20 * i, 700 + i * 120);
      return {
        def: e, spr, pos, vel: new Phaser.Math.Vector3(0, 0, -1).scale(e.speed ?? 110),
        hull: e.hull ?? 100, maxHull: e.hull ?? 100, shields: e.shields ?? 50, maxShields: e.shields ?? 50,
        fireT: 1.5 + Math.random() * 2, target: new Phaser.Math.Vector3(0, 0, 300), retargetT: 0,
        alive: true, surrendered: false, hitFlash: 0,
      };
    });

    this.bolts = []; // enemy fire
    this.torps = []; // player torpedoes
    this.fx = this.add.graphics().setDepth(20);
    this.phaserCd = 0; this.torpCd = 0;
    this.yaw = 0; this.pitch = 0;

    // crosshair
    this.cross = this.add.graphics().setDepth(30);
    this.aim = { x: CX, y: CY };
    this.input.on('pointermove', (p) => { if (p.y < VIEW_H && (!p.wasTouch || p.isDown)) { this.aim.x = p.x; this.aim.y = p.y; } });
    this.input.on('pointerdown', (p) => {
      if (this.paused || this.over || p.y >= VIEW_H) return;
      // aim where the pointer is *now* (a touch has no prior hover position)
      this.aim.x = p.x; this.aim.y = p.y;
      if (p.rightButtonDown()) this.fireTorpedo(); else this.firePhaser();
    });
    // Touch: steering lasts while the finger is down; lifting it re-centres
    // the crosshair so the ship stops turning.
    this.input.on('pointerup', (p) => { if (p.wasTouch) { this.aim.x = CX; this.aim.y = CY; } });
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,T');
    this.input.keyboard.on('keydown-SPACE', () => { if (!this.paused && !this.over) this.firePhaser(); });
    this.input.keyboard.on('keydown-T', () => { if (!this.paused && !this.over) this.fireTorpedo(); });

    this.buildHUD();
    this.dialog = new DialogBox(this, Director.characters, { y: 6 });
    startDrone(['D2', 'A2'], 0.03);
    sfx('alert');

    this.paused = true;
    (async () => {
      await Director.run(this, this.enc.onStart || [{ say: 'daska', text: 'Shields up! Weapons armed and ready, sir.' }]);
      if (!this.halted) this.paused = false;
    })();
  }

  buildHUD() {
    panel(this, 0, VIEW_H, WIDTH, HEIGHT - VIEW_H).setDepth(100);
    const D = 101;
    this.hud = this.add.graphics().setDepth(D);
    this.hudText = text(this, 12, VIEW_H + 10, '', COLORS.text).setDepth(D);
    this.enemyText = text(this, 330, VIEW_H + 10, '', COLORS.alert).setDepth(D);
    this.radar = this.add.graphics().setDepth(D);
    button(this, 12, HEIGHT - 36, 96, 30, 'HAIL', () => this.hail()).setDepth(D);
    button(this, 114, HEIGHT - 36, 110, 30, 'RETREAT', () => this.retreat()).setDepth(D);
    button(this, 230, HEIGHT - 36, 120, 30, 'TORPEDO', () => { if (!this.paused && !this.over) this.fireTorpedo(); }, { color: 0xffb070 }).setDepth(D);
    const help = IS_TOUCH ? 'TAP: FIRE PHASERS\nHOLD+DRAG: STEER' : 'CLICK/SPACE: PHASERS\nR-CLICK/T: TORPEDO';
    text(this, 358, HEIGHT - 32, help, COLORS.dim).setDepth(D);
  }

  // ---------------------------------------------------------------- weapons

  project(v) {
    if (v.z <= 1) return null;
    return { x: CX + (v.x / v.z) * F, y: CY - (v.y / v.z) * F, s: F / v.z };
  }

  firePhaser() {
    if (this.phaserCd > 0) return;
    this.phaserCd = 0.55;
    sfx('phaser');
    const { x, y } = this.aim;
    this.beam = { t: 0.18, x, y };
    // hit test
    let hit = null;
    for (const e of this.enemies) {
      if (!e.alive || e.pos.z <= 10) continue;
      const p = this.project(e.pos);
      const r = Math.max(10, 40 * p.s);
      if (Math.abs(p.x - x) < r * 1.2 && Math.abs(p.y - y) < r * 0.7 && e.pos.length() < 1100) {
        if (!hit || e.pos.z < hit.pos.z) hit = e;
      }
    }
    if (hit) this.damageEnemy(hit, Math.round(14 * (1.2 - hit.pos.length() / 1400)), 'phaser');
  }

  fireTorpedo() {
    const s = Director.state;
    if (this.torpCd > 0) return;
    if (s.ship.torpedoes <= 0) { sfx('deny'); toast(this, 'TORPEDO BAYS EMPTY', COLORS.alert, VIEW_H - 20); return; }
    s.ship.torpedoes--;
    this.torpCd = 1.2;
    sfx('torpedo');
    const dir = new Phaser.Math.Vector3((this.aim.x - CX) / F, -(this.aim.y - CY) / F, 1).normalize();
    this.torps.push({ pos: new Phaser.Math.Vector3(0, -20, 10), vel: dir.scale(520), life: 3 });
  }

  damageEnemy(e, dmg, kind) {
    if (!e.alive) return;
    e.hitFlash = 0.15;
    if (e.shields > 0) {
      const absorbed = Math.min(e.shields, dmg * (kind === 'torpedo' ? 0.6 : 0.8));
      e.shields -= absorbed;
      dmg -= absorbed;
      sfx('shieldhit');
    }
    if (dmg > 0) { e.hull = Math.max(0, e.hull - dmg); sfx('hit'); }
    if (e.hull <= 0) return this.destroyEnemy(e);
    const pct = (e.hull / e.maxHull) * 100;
    const sur = e.def.surrenderAt ?? this.enc.surrenderAt;
    if (!e.surrendered && sur && pct <= sur && this.enc.onSurrender) {
      e.surrendered = true;
      this.runPaused(this.enc.onSurrender);
    }
  }

  destroyEnemy(e) {
    e.alive = false;
    sfx('explosion');
    const p = this.project(e.pos);
    if (p) {
      const parts = Array.from({ length: 40 }, () => ({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 0.6 + Math.random() * 0.8 }));
      this.explosions = (this.explosions || []).concat(parts);
      this.cameras.main.flash(200, 255, 220, 160);
    }
    e.spr.setVisible(false);
    if (this.enemies.every((x) => !x.alive)) {
      this.time.delayedCall(1200, () => this.finish('victory'));
    }
  }

  damagePlayer(dmg) {
    const s = Director.state;
    this.cameras.main.shake(200, 0.012);
    if (s.ship.shields > 0) {
      const a = Math.min(s.ship.shields, dmg);
      s.ship.shields = Math.round(s.ship.shields - a);
      dmg -= a * 0.9;
      sfx('shieldhit');
    }
    if (dmg > 0) {
      s.ship.hull = Math.max(0, Math.round(s.ship.hull - dmg));
      sfx('hit');
      this.cameras.main.flash(120, 255, 60, 40);
    }
    if (!this.warned50 && s.ship.hull < 50) { this.warned50 = true; toast(this, 'BRANDT: HULL BREACHES ON DECKS 4 AND 5!', COLORS.alert, VIEW_H - 20); }
    if (s.ship.hull <= 0) this.finish('defeat');
  }

  // ---------------------------------------------------------------- flow

  async runPaused(actions) {
    this.paused = true;
    await Director.run(this, actions);
    if (!this.halted) this.paused = false;
  }

  async hail() {
    if (this.paused || this.over) return;
    sfx('chirp');
    await this.runPaused(this.enc.hail || [{ say: 'arun', text: 'They\'re not answering, Captain.' }]);
  }

  async retreat() {
    if (this.paused || this.over) return;
    if (this.enc.canRetreat === false) {
      return this.runPaused(this.enc.noRetreat || [{ say: 'sato', text: 'We can\'t leave now, Captain - not with people still down there.' }]);
    }
    this.finish('retreat');
  }

  async finish(result) {
    if (this.over) return;
    this.over = true; this.paused = true;
    const s = Director.state;
    const handler = { victory: this.enc.onVictory, defeat: this.enc.onDefeat, retreat: this.enc.onRetreat }[result];
    const fallback = {
      victory: [{ say: 'daska', text: 'Target destroyed, Captain.' }],
      defeat: [{ say: 'brandt', text: 'She can\'t take any more, Captain!' }],
      retreat: [{ say: 'sato', text: 'Warping out!' }, { sfx: 'warp' }],
    }[result];
    s.alert = null;
    await Director.run(this, handler || fallback);
    if (this.halted) return;
    if (result === 'defeat' && s.ship.hull <= 0) s.ship.hull = 5;
    this.halted = true;
    Director.returnFromCombat();
  }

  /** Script action { endCombat: 'spared' } ends the fight immediately. */
  endCombat(result, then) {
    this.over = true;
    Director.state.alert = null;
    Director.state.flags[`combat_${this.encId}_${result}`] = true;
    Director.returnFromCombat(then);
    throw new Halt();
  }

  say(who, str) { return this.dialog.say(who, str); }
  choose(opts) { return this.dialog.choose(opts); }
  wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
  onScore(pts) { if (pts > 0) toast(this, `COMMENDATION +${pts}`, COLORS.good, VIEW_H - 40); }

  // ---------------------------------------------------------------- update

  rotateWorld(dyaw, dpitch, forward) {
    const rot = (v) => {
      // yaw about Y
      const cy = Math.cos(dyaw), sy = Math.sin(dyaw);
      const x = v.x * cy - v.z * sy, z = v.x * sy + v.z * cy;
      v.x = x; v.z = z;
      // pitch about X
      const cp = Math.cos(dpitch), sp = Math.sin(dpitch);
      const y = v.y * cp - v.z * sp, z2 = v.y * sp + v.z * cp;
      v.y = y; v.z = z2;
    };
    for (const st of this.stars) rot(st);
    for (const e of this.enemies) { rot(e.pos); rot(e.vel); rot(e.target); e.pos.z -= forward; }
    for (const b of this.bolts) { rot(b.pos); rot(b.vel); b.pos.z -= forward; }
    for (const t of this.torps) { rot(t.pos); rot(t.vel); }
    if (this.planetDir) rot(this.planetDir);
  }

  update(time, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000;
    const s = Director.state;
    if (!this.paused) this.simulate(dt);
    this.draw(dt);
    this.hudText.setText(
      `SHIELDS ${String(Math.round(s.ship.shields)).padStart(3)}%\nHULL    ${String(Math.round(s.ship.hull)).padStart(3)}%\nTORPS   ${s.ship.torpedoes}`,
    );
    const live = this.enemies.filter((e) => e.alive);
    this.enemyText.setText(live.map((e) => `${e.def.name.toUpperCase()}\nSHD ${Math.round(e.shields)}  HULL ${Math.round((e.hull / e.maxHull) * 100)}%`).join('\n'));
  }

  simulate(dt) {
    const s = Director.state;
    // steering
    let yawIn = 0, pitchIn = 0;
    const ox = this.aim.x - CX, oy = this.aim.y - CY;
    if (Math.abs(ox) > DEADZONE) yawIn = (ox - Math.sign(ox) * DEADZONE) / (CX - DEADZONE);
    if (Math.abs(oy) > DEADZONE) pitchIn = -(oy - Math.sign(oy) * DEADZONE) / (CY - DEADZONE);
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown) yawIn = -1;
    if (k.RIGHT.isDown || k.D.isDown) yawIn = 1;
    if (k.UP.isDown || k.W.isDown) pitchIn = 1;
    if (k.DOWN.isDown || k.S.isDown) pitchIn = -1;
    const turn = 1.1;
    this.yawV = yawIn * turn; this.pitchV = pitchIn * turn * 0.7;
    // turning right means world rotates left: positive yaw input -> rotate world by -angle
    this.rotateWorld(this.yawV * dt, this.pitchV * dt, 40 * dt);

    this.phaserCd = Math.max(0, this.phaserCd - dt);
    this.torpCd = Math.max(0, this.torpCd - dt);
    // slow shield regen
    if (s.ship.shields < 100 && s.ship.hull > 0) s.ship.shields = Math.min(100, s.ship.shields + dt * 1.2);

    // enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const def = e.def;
      e.retargetT -= dt;
      if (e.retargetT <= 0) {
        // pick a new waypoint: alternate attack runs and strafing passes
        const r = 180 + Math.random() * 260;
        const a = Math.random() * Math.PI * 2;
        const ahead = e.surrendered ? 1500 : (Math.random() < 0.6 ? 250 + Math.random() * 300 : -150);
        e.target.set(Math.cos(a) * r, Math.sin(a) * r * 0.5, ahead);
        e.retargetT = 3 + Math.random() * 3;
      }
      const desired = e.target.clone().subtract(e.pos).normalize().scale(def.speed ?? 110);
      e.vel.lerp(desired, Math.min(1, dt * (def.agility ?? 0.9)));
      e.pos.add(e.vel.clone().scale(dt));
      if (e.surrendered) continue;
      // fire at the player
      e.fireT -= dt;
      const dist = e.pos.length();
      if (e.fireT <= 0 && dist < 900) {
        e.fireT = (def.fireRate ?? 2.4) * (0.7 + Math.random() * 0.6);
        const toPlayer = e.pos.clone().negate().normalize();
        const inacc = 1 - (def.skill ?? 0.6);
        toPlayer.x += (Math.random() - 0.5) * inacc * 0.25;
        toPlayer.y += (Math.random() - 0.5) * inacc * 0.25;
        this.bolts.push({ pos: e.pos.clone(), vel: toPlayer.normalize().scale(380), dmg: def.damage ?? 8, life: 4 });
        sfx('disruptor');
      }
    }
    // enemy bolts
    for (const b of this.bolts) {
      b.pos.add(b.vel.clone().scale(dt));
      b.life -= dt;
      if (b.pos.length() < 40) { b.life = 0; this.damagePlayer(b.dmg); }
    }
    this.bolts = this.bolts.filter((b) => b.life > 0);
    // torpedoes (gently homing)
    for (const t of this.torps) {
      const tgt = this.enemies.filter((e) => e.alive).sort((a, b) => a.pos.distance(t.pos) - b.pos.distance(t.pos))[0];
      if (tgt) {
        const want = tgt.pos.clone().subtract(t.pos).normalize();
        const cur = t.vel.clone().normalize();
        if (want.dot(cur) > 0.88) t.vel = cur.lerp(want, dt * 2.2).normalize().scale(520);
        if (tgt.pos.distance(t.pos) < 45) { t.life = 0; this.damageEnemy(tgt, 30, 'torpedo'); this.cameras.main.flash(80, 255, 200, 120); }
      }
      t.pos.add(t.vel.clone().scale(dt));
      t.life -= dt;
    }
    this.torps = this.torps.filter((t) => t.life > 0);
  }

  draw(dt) {
    const g = this.starG; g.clear();
    for (const st of this.stars) {
      const p = this.project(st);
      if (!p || p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > VIEW_H) continue;
      g.fillStyle(st.length() > 1100 ? 0x8890a8 : 0xffffff).fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, 2, 2);
    }
    if (this.planet) {
      const p = this.project(this.planetDir);
      this.planet.setVisible(!!p);
      if (p) this.planet.setPosition(Math.round(p.x), Math.round(p.y));
    }
    // enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const p = this.project(e.pos);
      if (!p || e.pos.z < 15) { e.spr.setVisible(false); continue; }
      e.spr.setVisible(true);
      const sc = Phaser.Math.Clamp(p.s * 1.6, 0.15, 3.5);
      e.spr.setPosition(Math.round(p.x), Math.round(p.y)).setScale(sc);
      e.spr.setFlipX(e.vel.x < 0);
      e.spr.setDepth(10 + 1000 / e.pos.z);
      e.hitFlash -= dt;
      e.spr.setTint(e.hitFlash > 0 ? 0xff8080 : 0xffffff);
    }
    // fx
    const fx = this.fx; fx.clear();
    for (const b of this.bolts) {
      const p = this.project(b.pos);
      if (!p) continue;
      const r = Phaser.Math.Clamp(p.s * 10, 2, 14);
      fx.fillStyle(0x60ff40, 1).fillCircle(p.x, p.y, r);
      fx.fillStyle(0xe0ffd0, 1).fillCircle(p.x, p.y, r * 0.45);
    }
    for (const t of this.torps) {
      const p = this.project(t.pos);
      if (!p) continue;
      const r = Phaser.Math.Clamp(p.s * 14, 2, 12);
      fx.fillStyle(0xff7030, 0.8).fillCircle(p.x, p.y, r * 1.6);
      fx.fillStyle(0xffe0a0, 1).fillCircle(p.x, p.y, r * 0.7);
    }
    if (this.beam && this.beam.t > 0) {
      this.beam.t -= dt;
      for (const sx of [80, WIDTH - 80]) {
        fx.lineStyle(5, 0xff6a20, 1).lineBetween(sx, VIEW_H, this.beam.x, this.beam.y);
        fx.lineStyle(2, 0xffe0a0, 1).lineBetween(sx, VIEW_H, this.beam.x, this.beam.y);
      }
    }
    if (this.explosions) {
      for (const pt of this.explosions) {
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
        if (pt.life > 0) fx.fillStyle(pt.life > 0.6 ? 0xffe080 : 0xff6020, 1).fillRect(pt.x, pt.y, 4, 4);
      }
      this.explosions = this.explosions.filter((p) => p.life > 0);
    }
    // off-screen indicators
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const p = this.project(e.pos);
      if (p && p.x > 0 && p.x < WIDTH && p.y > 0 && p.y < VIEW_H) continue;
      const ang = Math.atan2(-e.pos.y, e.pos.x);
      const ex = CX + Math.cos(ang) * (CX - 24), ey = CY + Math.sin(ang) * (CY - 24);
      fx.fillStyle(e.pos.z < 0 ? 0xff4040 : 0xffd060, 1);
      fx.fillTriangle(ex + Math.cos(ang) * 10, ey + Math.sin(ang) * 10, ex + Math.cos(ang + 2.4) * 8, ey + Math.sin(ang + 2.4) * 8, ex + Math.cos(ang - 2.4) * 8, ey + Math.sin(ang - 2.4) * 8);
    }
    // crosshair
    const c = this.cross; c.clear();
    const { x, y } = this.aim;
    c.lineStyle(2, this.phaserCd > 0 ? 0x806040 : 0xffd060, 1);
    c.strokeRect(x - 10, y - 10, 20, 20);
    c.lineBetween(x - 18, y, x - 12, y); c.lineBetween(x + 12, y, x + 18, y);
    c.lineBetween(x, y - 18, x, y - 12); c.lineBetween(x, y + 12, x, y + 18);
    c.lineStyle(1, 0x405070, 0.6).strokeRect(CX - DEADZONE, CY - DEADZONE, DEADZONE * 2, DEADZONE * 2);

    // HUD bars + radar
    const s = Director.state;
    const h = this.hud; h.clear();
    h.fillStyle(0x203040).fillRect(160, VIEW_H + 10, 140, 8).fillRect(160, VIEW_H + 22, 140, 8);
    h.fillStyle(0x40a0ff).fillRect(160, VIEW_H + 10, 1.4 * s.ship.shields, 8);
    h.fillStyle(s.ship.hull > 40 ? 0x60e070 : 0xff5040).fillRect(160, VIEW_H + 22, 1.4 * s.ship.hull, 8);
    const R = this.radar; R.clear();
    const rx = WIDTH - 50, ry = VIEW_H + 40;
    R.lineStyle(1, 0x40a060).strokeCircle(rx, ry, 30).lineBetween(rx, ry - 30, rx, ry + 30).lineBetween(rx - 30, ry, rx + 30, ry);
    R.fillStyle(0x60e070).fillRect(rx - 2, ry - 2, 4, 4);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.min(1, e.pos.length() / 1200);
      const a = Math.atan2(e.pos.x, e.pos.z);
      R.fillStyle(e.surrendered ? 0xffd060 : 0xff4040).fillRect(rx + Math.sin(a) * d * 28 - 2, ry - Math.cos(a) * d * 28 - 2, 4, 4);
    }
  }
}
