import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { button, panel } from '../engine/ui.js';
import { Starfield } from '../engine/starfield.js';
import { WIDTH, HEIGHT, COLORS } from '../engine/constants.js';
import { Director } from '../engine/director.js';
import { sfx } from '../engine/audio.js';

/** End of mission: page 1 is the captain's log, page 2 is Command's evaluation. */
export default class DebriefScene extends Phaser.Scene {
  constructor() { super('Debrief'); }

  create(data) {
    Director.host = this;
    this.data_ = data;
    this.cameras.main.fadeIn(600);
    this.stars = new Starfield(this, 0, 0, WIDTH, HEIGHT, { count: 90, vx: -8 });
    sfx(data.result.success ? 'success' : 'fail');
    this.page = null;
    this.showLog();
  }

  frame() {
    if (this.page) this.page.destroy();
    this.page = this.add.container(0, 0);
    this.page.add(panel(this, 16, 12, WIDTH - 32, HEIGHT - 24));
    return this.page;
  }

  showLog() {
    const m = Director.mission;
    const { ending: endingId, result: r } = this.data_;
    const ending = m.endings[endingId];
    const c = this.frame();
    c.add(text(this, 32, 28, `CAPTAIN'S LOG - ${m.title.toUpperCase()}`, COLORS.lcars1));
    c.add(text(this, 32, 46, (ending.title || '').toUpperCase(), r.success ? COLORS.good : COLORS.alert));
    c.add(text(this, 32, 70, [].concat(ending.text || []).join('\n\n'), COLORS.text, WIDTH - 64));
    c.add(button(this, WIDTH / 2 - 100, HEIGHT - 42, 200, 24, 'EVALUATION', () => this.showEvaluation()));
  }

  showEvaluation() {
    const m = Director.mission;
    const { result: r, events } = this.data_;
    const c = this.frame();
    c.add(text(this, 32, 28, 'CONCORD COMMAND EVALUATION', COLORS.lcars1));
    c.add(text(this, 32, 46, m.title.toUpperCase(), COLORS.dim));
    const pct = text(this, WIDTH - 40, 28, '0%', COLORS.highlight).setOrigin(1, 0).setFontSize(24);
    c.add(pct);
    let n = 0;
    this.time.addEvent({ delay: 18, repeat: r.percent, callback: () => { pct.setText(`${n}%`); n++; } });
    c.add(text(this, 32, 72, `RATING: ${r.rating.toUpperCase()}`, r.success ? COLORS.lcars2 : COLORS.alert));
    c.add(text(this, 32, 96, 'COMMENDATIONS', COLORS.dim));
    const notes = Object.entries(events).filter(([, v]) => v > 0);
    notes.forEach(([reason, pts], i) => {
      c.add(text(this, 40, 114 + i * 14, `+${String(pts).padStart(2)}  ${reason}`, COLORS.good, WIDTH - 90));
    });
    if (!notes.length) c.add(text(this, 40, 114, 'None.', COLORS.dim));
    if (r.percent < 100 && m.hints?.length) {
      const hint = m.hints[Math.floor(Math.random() * m.hints.length)];
      c.add(text(this, 32, HEIGHT - 84, `ADMIRAL THORNE: "${hint}"`, COLORS.dim, WIDTH - 64));
    }
    c.add(button(this, WIDTH / 2 - 210, HEIGHT - 42, 200, 24, 'CAPTAIN\'S LOG', () => this.showLog()));
    c.add(button(this, WIDTH / 2 + 10, HEIGHT - 42, 200, 24, 'MISSION ARCHIVE', () => this.scene.start('MissionSelect')));
  }

  update(t, dt) { this.stars.update(dt / 1000); }
}
