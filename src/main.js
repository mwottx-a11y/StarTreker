import Phaser from 'phaser';
import '@fontsource/press-start-2p/latin-400.css';
import { WIDTH, HEIGHT } from './engine/constants.js';
import { Director } from './engine/director.js';
import { DialogBox } from './engine/ui.js';
import { unlockAudio } from './engine/audio.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import MissionSelectScene from './scenes/MissionSelectScene.js';
import BriefingScene from './scenes/BriefingScene.js';
import BridgeScene from './scenes/BridgeScene.js';
import AwayScene from './scenes/AwayScene.js';
import CombatScene from './scenes/CombatScene.js';
import DebriefScene from './scenes/DebriefScene.js';

// Mobile browsers only start audio from inside a real user gesture.
const unlock = () => { unlockAudio(); window.removeEventListener('touchend', unlock); window.removeEventListener('pointerdown', unlock); };
window.addEventListener('touchend', unlock);
window.addEventListener('pointerdown', unlock);
// iOS Safari ignores user-scalable=no; block pinch-zoom explicitly.
document.addEventListener('gesturestart', (e) => e.preventDefault());

async function start() {
  try { await document.fonts.load('8px "Press Start 2P"'); } catch { /* fallback font */ }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    disableContextMenu: true,
    input: { activePointers: 2 },
    scene: [BootScene, TitleScene, MissionSelectScene, BriefingScene, BridgeScene, AwayScene, CombatScene, DebriefScene],
  });
  Director.game = game;
  window.__startreker = { game, Director, DialogBox }; // handy for debugging & automated tests
}
start();
