import Phaser from 'phaser';
import { buildPixelFont, text } from '../engine/font.js';
import { loadMissions } from '../engine/missions.js';
import { WIDTH, HEIGHT } from '../engine/constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  async create() {
    buildPixelFont(this);
    const t = text(this, WIDTH / 2, HEIGHT / 2, 'LOADING MISSION ARCHIVE...').setOrigin(0.5);
    await loadMissions();
    t.destroy();
    this.scene.start('Title');
  }
}
