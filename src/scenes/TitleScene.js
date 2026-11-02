import Phaser from 'phaser';
import { text } from '../engine/font.js';
import { button } from '../engine/ui.js';
import { Starfield } from '../engine/starfield.js';
import { makeShip, makePlanet } from '../engine/pixel.js';
import { WIDTH, HEIGHT, COLORS } from '../engine/constants.js';
import { Director } from '../engine/director.js';
import { loadMissionSave } from '../engine/state.js';
import { getMission } from '../engine/missions.js';
import { SHIP } from '../cast/crew.js';
import { setMuted, isMuted, sfx } from '../engine/audio.js';
import { prefs, IS_TOUCH } from '../engine/device.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    Director.host = this;
    this.stars = new Starfield(this, 0, 0, WIDTH, HEIGHT, { count: 180, vx: -30 });
    makePlanet(this, 'title-planet', { size: 96, base: '#7a3a6a', accent: '#c07090', bands: 7, seed: 9 });
    this.add.image(520, 300, 'title-planet').setScale(2);
    makeShip(this, 'ship-meridian', 'meridian');
    this.ship = this.add.image(-100, 150, 'ship-meridian').setScale(2);
    this.tweens.add({ targets: this.ship, x: WIDTH + 120, duration: 14000, repeat: -1, delay: 500 });

    const title = text(this, WIDTH / 2, 58, 'STAR TREKER', COLORS.lcars1).setOrigin(0.5).setFontSize(32);
    text(this, WIDTH / 2, 92, `VOYAGES OF THE ${SHIP.name.toUpperCase()}`, COLORS.lcars2).setOrigin(0.5).setFontSize(16);
    text(this, WIDTH / 2, 114, SHIP.service.toUpperCase(), COLORS.dim).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 0.75, yoyo: true, repeat: -1, duration: 1600 });

    let y = 150;
    const B = (label, fn) => { const b = button(this, WIDTH / 2 - 140, y, 280, 32, label, fn); y += 40; return b; };
    const save = loadMissionSave();
    if (save && getMission(save.missionId)) {
      const m = getMission(save.missionId);
      B(`CONTINUE: ${m.title.toUpperCase()}`.slice(0, 30), () => Director.startMission(save.missionId, save));
    }
    B('MISSION SELECT', () => this.scene.start('MissionSelect'));
    const snd = B(`SOUND: ${isMuted() ? 'OFF' : 'ON'}`, () => {
      setMuted(!isMuted());
      Director.profile.settings.muted = isMuted(); Director.profile.save();
      snd.setLabel(`SOUND: ${isMuted() ? 'OFF' : 'ON'}`);
      sfx('chirp');
    });
    const txt = B(`TEXT SIZE: ${prefs.largeText ? 'LARGE' : 'NORMAL'}`, () => {
      prefs.largeText = !prefs.largeText;
      Director.profile.settings.largeText = prefs.largeText; Director.profile.save();
      txt.setLabel(`TEXT SIZE: ${prefs.largeText ? 'LARGE' : 'NORMAL'}`);
    });
    if (this.scale.fullscreen.available) {
      const fs = B(this.scale.isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN', () => {
        if (this.scale.isFullscreen) { this.scale.stopFullscreen(); fs.setLabel('FULLSCREEN'); return; }
        this.scale.startFullscreen();
        try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* unsupported */ }
        fs.setLabel('EXIT FULLSCREEN');
      });
    }
    const hint = IS_TOUCH ? 'TAP TO INTERACT - BEST PLAYED IN LANDSCAPE' : 'CLICK TO INTERACT  -  RIGHT-CLICK CYCLES VERBS IN AWAY MISSIONS';
    text(this, WIDTH / 2, HEIGHT - 16, hint, COLORS.dim).setOrigin(0.5);
  }
  update(t, dt) { this.stars.update(dt / 1000); }
}
