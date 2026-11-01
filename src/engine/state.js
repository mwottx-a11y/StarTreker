// Game state. Two layers:
//  - Profile: persists across missions (completed missions, commendations,
//    crew "memories" that later missions can reference for continuity).
//  - MissionState: everything about the mission in progress (flags, items,
//    score, where you are). Autosaved so a mission can be resumed.

const PROFILE_KEY = 'startreker.profile.v1';
const SAVE_KEY = 'startreker.save.v1';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export class Profile {
  constructor() {
    const p = store.get(PROFILE_KEY) || {};
    this.completed = p.completed || {}; // missionId -> {score, max, rating, ending, at}
    this.memories = p.memories || {};   // cross-mission continuity flags
    this.settings = p.settings || { muted: false };
  }
  save() { store.set(PROFILE_KEY, { completed: this.completed, memories: this.memories, settings: this.settings }); }
  remember(key, value = true) { this.memories[key] = value; this.save(); }
  recordCompletion(missionId, result) {
    const prev = this.completed[missionId];
    if (!prev || result.percent >= prev.percent) this.completed[missionId] = { ...result, at: Date.now() };
    this.save();
  }
}

export class MissionState {
  constructor(mission, data = null) {
    this.missionId = mission.id;
    const d = data || {};
    this.flags = d.flags || {};
    this.vars = d.vars || {};
    this.inventory = d.inventory || [...(mission.startInventory || ['phaser_stun', 'phaser_kill'])];
    this.scoreEvents = d.scoreEvents || {}; // reason -> points (each awarded once)
    this.crew = d.crew || { venn: {}, okafor: {}, daska: {} };
    this.hidden = d.hidden || {}; // `${room}:${hotspot}` -> bool (true hidden, false forced shown)
    this.poses = d.poses || {};   // `${room}:${hotspot}` -> frame name
    this.visited = d.visited || {};
    this.objectives = d.objectives || [];
    this.system = d.system || mission.starmap?.start || null;
    this.unlocked = d.unlocked || [];
    this.location = d.location || { scene: 'bridge' };
    this.choicesTaken = d.choicesTaken || {};
    this.ship = d.ship || { hull: 100, shields: 100, torpedoes: mission.ship?.torpedoes ?? 8 };
    this.alert = d.alert || null;
  }

  get score() { return Object.values(this.scoreEvents).reduce((a, b) => a + b, 0); }

  award(reason, pts) {
    if (reason in this.scoreEvents) return false;
    this.scoreEvents[reason] = pts;
    return true;
  }

  has(item) { return this.inventory.includes(item); }
  give(item) { if (!this.has(item)) this.inventory.push(item); }
  take(item) { this.inventory = this.inventory.filter((i) => i !== item); }

  isHidden(room, id, defaultHidden = false) {
    const k = `${room}:${id}`;
    return k in this.hidden ? this.hidden[k] : defaultHidden;
  }

  toJSON() {
    const { missionId, flags, vars, inventory, scoreEvents, crew, hidden, poses, visited, objectives, system, unlocked, location, choicesTaken, ship, alert } = this;
    return { missionId, flags, vars, inventory, scoreEvents, crew, hidden, poses, visited, objectives, system, unlocked, location, choicesTaken, ship, alert };
  }
}

export function saveMission(state) { store.set(SAVE_KEY, state.toJSON()); }
export function loadMissionSave() { return store.get(SAVE_KEY); }
export function clearMissionSave() { store.del(SAVE_KEY); }

export function rating(percent) {
  if (percent >= 95) return 'Exemplary';
  if (percent >= 80) return 'Commendable';
  if (percent >= 60) return 'Satisfactory';
  if (percent >= 40) return 'Marginal';
  return 'Under Review';
}
