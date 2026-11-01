import { CREW, STANDARD_ITEMS } from '../cast/crew.js';
import { MissionState, Profile, saveMission, clearMissionSave, rating } from './state.js';
import { ScriptRunner, Halt } from './script.js';
import { getMission } from './missions.js';
import { stopDrone, setMuted } from './audio.js';

/**
 * The Director owns the mission in progress and moves the player between
 * scenes (bridge, away team, combat, debrief). Scripts call into it for any
 * action that changes scene; those calls throw `Halt` to end the running
 * script, because the scene that was running it is about to shut down.
 */
class DirectorImpl {
  constructor() {
    this.profile = new Profile();
    setMuted(!!this.profile.settings.muted);
    this.mission = null;
    this.state = null;
    this.host = null;
    this.combatReturn = null;
  }

  get characters() { return { ...CREW, ...(this.mission?.characters || {}) }; }
  get items() { return { ...STANDARD_ITEMS, ...(this.mission?.items || {}) }; }

  context(host) {
    return {
      state: this.state, profile: this.profile, mission: this.mission,
      characters: this.characters, items: this.items, host, director: this,
    };
  }

  /** Run actions on a host scene. Resolves when done (or halted by a scene change). */
  async run(host, actions) {
    if (!actions) return;
    this.host = host;
    host.busy = (host.busy || 0) + 1;
    host.onBusyChange?.();
    try {
      await new ScriptRunner(this.context(host)).run(actions);
    } catch (e) {
      if (!e.halt) { console.error(e); }
      else { host.halted = true; return; }
    } finally {
      host.busy -= 1;
      host.onBusyChange?.();
    }
    this.save();
  }

  save() { if (this.state) saveMission(this.state); }

  // ----------------------------------------------------------- lifecycle

  startMission(id, saveData = null) {
    this.mission = getMission(id);
    this.state = new MissionState(this.mission, saveData);
    this.combatReturn = null;
    if (saveData) return this.resume();
    this.save();
    this._switch('Briefing', {});
  }

  resume() {
    const loc = this.state.location;
    if (loc.scene === 'away' && loc.room) this._switch('Away', { room: loc.room, at: loc.at, resume: true });
    else this._switch('Bridge', {});
  }

  _switch(key, data, fade = true) {
    const h = this.host;
    stopDrone();
    if (h && h.scene && h.scene.isActive() && fade) {
      h.cameras.main.fadeOut(280, 0, 0, 0);
      h.time.delayedCall(300, () => h.scene.start(key, data));
    } else {
      (h?.scene || this.game.scene).start(key, data);
    }
  }

  // Scripts call these:
  gotoRoom(room, at, face) {
    this.state.location = { scene: 'away', room, at };
    this.save();
    this._switch('Away', { room, at, face });
    throw new Halt();
  }

  beamDown(room, at) {
    this.state.location = { scene: 'away', room, at };
    this.save();
    this._switch('Away', { room, at, beam: true });
    throw new Halt();
  }

  beamUp(then) {
    this.state.location = { scene: 'bridge' };
    this.save();
    this._switch('Bridge', { beamedUp: true, then });
    throw new Halt();
  }

  startCombat(encounterId) {
    this.combatReturn = { ...this.state.location };
    this._switch('Combat', { encounter: encounterId });
    throw new Halt();
  }

  returnFromCombat(then) {
    const loc = this.combatReturn || { scene: 'bridge' };
    this.state.location = loc;
    this.save();
    if (loc.scene === 'away') this._switch('Away', { room: loc.room, at: loc.at, then });
    else this._switch('Bridge', { then });
  }

  endMission(endingId) {
    const ending = this.mission.endings[endingId];
    const max = this.mission.maxScore || 100;
    const percent = Math.max(0, Math.min(100, Math.round((this.state.score / max) * 100)));
    const result = { percent, score: this.state.score, max, rating: rating(percent), ending: endingId, success: ending.outcome !== 'failure' };
    if (result.success) this.profile.recordCompletion(this.mission.id, result);
    clearMissionSave();
    this._switch('Debrief', { ending: endingId, result, events: { ...this.state.scoreEvents } });
    throw new Halt();
  }

  abandon() {
    clearMissionSave();
    this.mission = null; this.state = null;
  }
}

export const Director = new DirectorImpl();
