import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { DialogBox, panel, portraitKey } from '../engine/ui.js';
import { Starfield } from '../engine/starfield.js';
import { WIDTH, HEIGHT, COLORS } from '../engine/constants.js';
import { Director } from '../engine/director.js';
import { sfx } from '../engine/audio.js';

/** Mission briefing: an admiral on the viewscreen, then off to the bridge. */
export default class BriefingScene extends Phaser.Scene {
  constructor() { super('Briefing'); }
  create() {
    Director.host = this;
    const m = Director.mission;
    this.cameras.main.fadeIn(400);
    this.stars = new Starfield(this, 0, 0, WIDTH, HEIGHT, { count: 80, vx: -6 });
    text(this, WIDTH / 2, 150, `EPISODE ${m.episode ?? ''}`, COLORS.lcars2).setOrigin(0.5);
    const title = text(this, WIDTH / 2, 180, m.title.toUpperCase(), COLORS.lcars1).setOrigin(0.5).setFontSize(16);
    text(this, WIDTH / 2, 210, `STARDATE ${m.stardate || ''}`, COLORS.dim).setOrigin(0.5);
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 1200 });
    this.dialog = new DialogBox(this, Director.characters, { y: 280 });
    this.time.delayedCall(2200, () => this.runBriefing());
  }
  say(who, str) { return this.dialog.say(who, str); }
  choose(opts) { return this.dialog.choose(opts); }
  wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
  async runBriefing() {
    sfx('chirp');
    const m = Director.mission;
    const b = m.briefing || {};
    await Director.run(this, b.actions || (b.lines || []).map((t) => ({ say: b.speaker || 'thorne', text: t })));
    if (this.halted) return;
    Director.state.location = { scene: 'bridge' };
    Director.save();
    Director._switch('Bridge', { start: true });
  }
  update(t, dt) { this.stars.update(dt / 1000); }
}
