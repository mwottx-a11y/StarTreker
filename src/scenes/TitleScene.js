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

    let y = 200;
    const save = loadMissionSave();
    if (save && getMission(save.missionId)) {
      const m = getMission(save.missionId);
      button(this, WIDTH / 2 - 130, y, 260, 26, `CONTINUE: ${m.title.toUpperCase()}`.slice(0, 30), () => Director.startMission(save.missionId, save));
      y += 36;
    }
    button(this, WIDTH / 2 - 130, y, 260, 26, 'MISSION SELECT', () => this.scene.start('MissionSelect'));
    y += 36;
    const snd = button(this, WIDTH / 2 - 130, y, 260, 26, `SOUND: ${isMuted() ? 'OFF' : 'ON'}`, () => {
      setMuted(!isMuted());
      Director.profile.settings.muted = isMuted(); Director.profile.save();
      snd.setLabel(`SOUND: ${isMuted() ? 'OFF' : 'ON'}`);
      sfx('chirp');
    });
    text(this, WIDTH / 2, HEIGHT - 16, 'CLICK TO INTERACT  -  RIGHT-CLICK CYCLES VERBS IN AWAY MISSIONS', COLORS.dim).setOrigin(0.5);
  }
  update(t, dt) { this.stars.update(dt / 1000); }
}
