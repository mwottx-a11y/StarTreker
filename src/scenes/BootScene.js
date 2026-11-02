import Phaser from 'phaser';
import { buildPixelFont, text } from '../engine/font.js';
import { loadMissions } from '../engine/missions.js';
import { WIDTH, HEIGHT } from '../engine/constants.js';
import { Director } from '../engine/director.js';
import { prefs } from '../engine/device.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create() {
    buildPixelFont(this);
    const saved = Director.profile.settings.largeText;
    if (typeof saved === 'boolean') prefs.largeText = saved;
    const t = text(this, WIDTH / 2, HEIGHT / 2, 'LOADING MISSION ARCHIVE...').setOrigin(0.5);
    await loadMissions();
    t.destroy();
    this.scene.start('Title');
  }
}
