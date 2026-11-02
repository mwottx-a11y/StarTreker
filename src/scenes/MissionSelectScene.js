import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { button, panel } from '../engine/ui.js';
import { Starfield } from '../engine/starfield.js';
import { WIDTH, HEIGHT, COLORS, COMPACT } from '../engine/constants.js';
import { Director } from '../engine/director.js';
import { listMissions, loadProblems } from '../engine/missions.js';

export default class MissionSelectScene extends Phaser.Scene {
  constructor() { super('MissionSelect'); }
  create() {
    Director.host = this;
    this.stars = new Starfield(this, 0, 0, WIDTH, HEIGHT, { count: 100, vx: -10 });
    text(this, WIDTH / 2, 20, 'MISSION ARCHIVE', COLORS.lcars1).setOrigin(0.5).setFontSize(16);
    const missions = listMissions();
    const prof = Director.profile;
    this.detail = null;
    let y = 46;
    missions.forEach((m) => {
      const done = prof.completed[m.id];
      const locked = (m.requires || []).some((r) => !prof.completed[r]);
      const label = `EP ${String(m.episode ?? '?').padStart(2, '0')}  ${m.title.toUpperCase()}`;
      const b = button(this, 20, y, 280, 30, label.slice(0, 32), () => this.show(m, locked));
      b.label.setOrigin(0, 0.5).setX(10);
      if (locked) b.label.setTint(COLORS.dim);
      if (done) text(this, 306, y + 11, `${done.percent}%`, COLORS.good);
      y += 36;
    });
    const probs = loadProblems();
    if (probs.length) {
      text(this, 20, HEIGHT - 70, `${probs.length} mission file(s) failed validation - see console.`, COLORS.alert, 280);
    }
    button(this, 20, HEIGHT - 42, 120, 30, 'BACK', () => this.scene.start('Title'));
    if (missions[0]) this.show(missions[0], (missions[0].requires || []).some((r) => !prof.completed[r]));
  }

  show(m, locked) {
    if (this.detail) this.detail.destroy();
    const c = this.add.container(0, 0);
    this.detail = c;
    // detail panel fills the space right of the list, to the bottom of the screen
    const px = 330, pw = WIDTH - px - 8, ph = HEIGHT - 52, tw = pw - 32, bot = 44 + ph;
    c.add(panel(this, px, 44, pw, ph));
    c.add(text(this, px + 16, 60, m.title.toUpperCase(), COLORS.highlight, tw));
    c.add(text(this, px + 16, 84, `STARDATE ${m.stardate || '----'}`, COLORS.lcars2));
    c.add(text(this, px + 16, 104, m.synopsis || '', COLORS.text, tw));
    const done = Director.profile.completed[m.id];
    if (done) c.add(text(this, px + 16, bot - 84, `BEST: ${done.percent}% - ${done.rating.toUpperCase()}`, COLORS.good, tw));
    c.add(text(this, px + 16, bot - 66, m.source?.endsWith('.json') ? 'SOURCE: EXTERNAL MODULE' : 'SOURCE: BUNDLED MODULE', COLORS.dim));
    if (locked) {
      c.add(text(this, px + 16, bot - 40, 'LOCKED: COMPLETE EARLIER MISSIONS FIRST', COLORS.alert, tw));
    } else {
      c.add(button(this, px + pw / 2 - 100, bot - 46, 200, 34, 'BEGIN MISSION', () => Director.startMission(m.id)));
    }
  }
  update(t, dt) { this.stars.update(dt / 1000); }
}
