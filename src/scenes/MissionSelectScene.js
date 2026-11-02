import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { button, panel } from '../engine/ui.js';
import { Starfield } from '../engine/starfield.js';
import { WIDTH, HEIGHT, COLORS } from '../engine/constants.js';
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
    c.add(panel(this, 340, 44, 284, 340));
    c.add(text(this, 356, 60, m.title.toUpperCase(), COLORS.highlight, 256));
    c.add(text(this, 356, 84, `STARDATE ${m.stardate || '----'}`, COLORS.lcars2));
    c.add(text(this, 356, 104, m.synopsis || '', COLORS.text, 256));
    const done = Director.profile.completed[m.id];
    if (done) c.add(text(this, 356, 300, `BEST: ${done.percent}% - ${done.rating.toUpperCase()}`, COLORS.good, 256));
    c.add(text(this, 356, 318, m.source?.endsWith('.json') ? 'SOURCE: EXTERNAL MODULE' : 'SOURCE: BUNDLED MODULE', COLORS.dim));
    if (locked) {
      c.add(text(this, 356, 344, 'LOCKED: COMPLETE EARLIER MISSIONS FIRST', COLORS.alert, 256));
    } else {
      c.add(button(this, 390, 340, 190, 32, 'BEGIN MISSION', () => Director.startMission(m.id)));
    }
  }
  update(t, dt) { this.stars.update(dt / 1000); }
}
