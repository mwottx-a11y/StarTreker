import { CREW, SHIP } from '../cast/crew.js';
import { sfx, tone, startDrone, stopDrone } from './audio.js';

/**
 * Mission scripting.
 *
 * Missions describe behaviour as arrays of plain-data actions, e.g.
 *   [{ say: 'venn', text: 'Fascinating readings.' },
 *    { if: { has: 'shard' }, then: [{ goto: 'cavern' }], else: [{ say: 'okafor', text: 'Not yet.' }] }]
 *
 * Because actions are data (not code), missions can be distributed as JSON
 * and loaded at runtime. See docs/MISSION_AUTHORING.md for the full list.
 */

export class Halt extends Error {
  constructor() { super('script halted'); this.halt = true; }
}

// ---------------------------------------------------------------- conditions

export function check(cond, ctx) {
  if (cond === undefined || cond === null) return true;
  if (typeof cond === 'boolean') return cond;
  if (typeof cond === 'string') return !!ctx.state.flags[cond]; // shorthand
  if (Array.isArray(cond)) return cond.every((c) => check(c, ctx));
  const s = ctx.state;
  if ('all' in cond) return cond.all.every((c) => check(c, ctx));
  if ('any' in cond) return cond.any.some((c) => check(c, ctx));
  if ('not' in cond) return !check(cond.not, ctx);
  if ('flag' in cond) return 'eq' in cond ? s.flags[cond.flag] === cond.eq : !!s.flags[cond.flag];
  if ('notFlag' in cond) return !s.flags[cond.notFlag];
  if ('has' in cond) return s.has(cond.has);
  if ('lacks' in cond) return !s.has(cond.lacks);
  if ('var' in cond) {
    const v = s.vars[cond.var] ?? 0;
    if ('eq' in cond) return v === cond.eq;
    if ('gte' in cond) return v >= cond.gte;
    if ('lte' in cond) return v <= cond.lte;
    if ('gt' in cond) return v > cond.gt;
    if ('lt' in cond) return v < cond.lt;
    return !!v;
  }
  if ('memory' in cond) return !!ctx.profile.memories[cond.memory];
  if ('injured' in cond) return !!s.crew[cond.injured]?.injured;
  if ('visited' in cond) return !!s.visited[cond.visited];
  if ('room' in cond) return s.location.room === cond.room;
  if ('system' in cond) return s.system === cond.system;
  if ('completed' in cond) return !!ctx.profile.completed[cond.completed];
  if ('scoreGte' in cond) return s.score >= cond.scoreGte;
  if ('chose' in cond) return !!s.choicesTaken[cond.chose];
  console.warn('Unknown condition', cond);
  return false;
}

// ------------------------------------------------------------ interpolation

export function interp(text, ctx) {
  if (Array.isArray(text)) text = text.join(' ');
  return String(text).replace(/\{(\w+)(?:\.(\w+))?\}/g, (m, a, b) => {
    if (a === 'ship') return SHIP.name;
    if (a === 'var' && b) return String(ctx.state.vars[b] ?? 0);
    const who = ctx.characters[a] || CREW[a];
    if (who) return b ? who[b] ?? m : who.short || who.name;
    return m;
  });
}

// ------------------------------------------------------------------- runner

const ACTION_KEYS = [
  'if', 'say', 'narrate', 'choice', 'dialogue', 'run', 'set', 'unset', 'inc', 'setVar', 'give', 'take', 'score',
  'goto', 'hide', 'show', 'pose', 'sfx', 'tone', 'melody', 'drone', 'wait', 'walk', 'beamUp', 'beamDown',
  'combat', 'end', 'injure', 'heal', 'remember', 'objective', 'complete', 'unlock', 'shake', 'flash',
  'alert', 'stop', 'moveNpc', 'face', 'setSystem', 'repair', 'random', 'endCombat', 'phaser',
];

export class ScriptRunner {
  /** @param ctx { state, profile, mission, characters, host, director } */
  constructor(ctx) { this.ctx = ctx; }

  async run(actions) {
    if (!actions) return;
    if (!Array.isArray(actions)) actions = [actions];
    for (const a of actions) {
      const r = await this.exec(a);
      if (r === 'stop') return 'stop';
    }
  }

  async exec(a) {
    const { ctx } = this;
    const s = ctx.state;
    const host = ctx.host;
    const key = ACTION_KEYS.find((k) => k in a);
    if (!key) { console.warn('Unknown action', a); return; }
    if (a.when !== undefined && !check(a.when, ctx)) return;

    switch (key) {
      case 'if': {
        const branch = check(a.if, ctx) ? a.then : a.else;
        return this.run(branch);
      }
      case 'say': {
        const lines = Array.isArray(a.text) ? a.text : [a.text]; // array = consecutive lines
        for (const t of lines) await host.say(a.say, interp(t, ctx));
        return;
      }
      case 'narrate': return host.say(null, interp(a.narrate, ctx));
      case 'choice': {
        const opts = a.choice.filter((o) => check(o.if, ctx) && !(o.once && s.choicesTaken[o.id || o.text]));
        if (!opts.length) return;
        const i = await host.choose(opts.map((o) => interp(o.text, ctx)));
        const o = opts[i];
        s.choicesTaken[o.id || o.text] = true;
        return this.run(o.do);
      }
      case 'dialogue': return this.dialogue(a.dialogue, a.node);
      case 'run': {
        const script = ctx.mission.scripts?.[a.run];
        if (!script) { console.warn('No script', a.run); return; }
        return this.run(script);
      }
      case 'set':
        if (typeof a.set === 'string') s.flags[a.set] = a.value ?? true;
        else Object.assign(s.flags, a.set);
        return;
      case 'unset': [].concat(a.unset).forEach((f) => delete s.flags[f]); return;
      case 'inc':
        for (const [k, v] of Object.entries(typeof a.inc === 'string' ? { [a.inc]: a.by ?? 1 } : a.inc)) s.vars[k] = (s.vars[k] || 0) + v;
        return;
      case 'setVar': Object.assign(s.vars, a.setVar); return;
      case 'give':
        for (const it of [].concat(a.give)) {
          if (s.has(it)) continue;
          s.give(it);
          sfx('pickup');
          const def = ctx.mission.items?.[it] || ctx.items?.[it];
          if (!a.silent && def) await host.say(null, `Acquired: ${def.name}.`);
        }
        host.refreshInventory?.();
        return;
      case 'take': [].concat(a.take).forEach((it) => s.take(it)); host.refreshInventory?.(); return;
      case 'score': {
        const reason = a.reason || a.id || `score_${Math.random()}`;
        if (s.award(reason, a.score)) host.onScore?.(a.score, reason);
        return;
      }
      case 'goto': return ctx.director.gotoRoom(a.goto, a.at, a.face);
      case 'hide': [].concat(a.hide).forEach((id) => { s.hidden[this.roomKey(id, a.room)] = true; host.refreshHotspots?.(); }); return;
      case 'show': [].concat(a.show).forEach((id) => { s.hidden[this.roomKey(id, a.room)] = false; host.refreshHotspots?.(); }); return;
      case 'pose': s.poses[this.roomKey(a.pose, a.room)] = a.frame; host.refreshHotspots?.(); return;
      case 'sfx': sfx(a.sfx); return;
      case 'tone': tone(a.tone, a.dur || 0.8, a.wave); return;
      case 'melody':
        for (const n of a.melody) { tone(n, a.dur || 0.5, a.wave); await host.wait((a.gap || 0.45) * 1000); }
        return;
      case 'drone': if (a.drone) startDrone(a.drone, a.vol); else stopDrone(); return;
      case 'wait': return host.wait(a.wait);
      case 'walk': return host.walkTo?.(a.walk[0], a.walk[1]);
      case 'face': return host.face?.(a.face);
      case 'moveNpc': return host.moveNpc?.(a.moveNpc, a.to, a.speed);
      case 'beamUp': return ctx.director.beamUp(a.then);
      case 'beamDown': return ctx.director.beamDown(a.beamDown, a.at);
      case 'combat': return ctx.director.startCombat(a.combat);
      case 'end': return ctx.director.endMission(a.end);
      case 'injure':
        s.crew[a.injure] = { ...(s.crew[a.injure] || {}), injured: true };
        host.refreshCrew?.();
        return;
      case 'heal':
        s.crew[a.heal] = { ...(s.crew[a.heal] || {}), injured: false };
        host.refreshCrew?.();
        return;
      case 'remember': ctx.profile.remember(a.remember, a.value ?? true); return;
      case 'objective':
        if (!s.objectives.find((o) => o.id === (a.id || a.objective))) {
          s.objectives.push({ id: a.id || a.objective, text: interp(a.objective, ctx), done: false });
          host.onObjective?.(interp(a.objective, ctx));
        }
        return;
      case 'complete': {
        const o = s.objectives.find((x) => x.id === a.complete);
        if (o) o.done = true;
        return;
      }
      case 'unlock': [].concat(a.unlock).forEach((id) => { if (!s.unlocked.includes(id)) s.unlocked.push(id); }); return;
      case 'setSystem': s.system = a.setSystem; return;
      case 'shake': host.cameras?.main.shake(a.shake || 300, 0.01); return;
      case 'flash': {
        const c = Phaser_rgb(a.flash);
        host.cameras?.main.flash(a.ms || 300, c[0], c[1], c[2]);
        return;
      }
      case 'alert': s.alert = a.alert || null; host.refreshAlert?.(); if (a.alert === 'red') sfx('alert'); return;
      case 'repair':
        s.ship.hull = Math.min(100, s.ship.hull + (a.repair.hull || 0));
        s.ship.shields = Math.min(100, s.ship.shields + (a.repair.shields || 0));
        if (a.repair.torpedoes) s.ship.torpedoes += a.repair.torpedoes;
        return;
      case 'random': {
        const opts = a.random;
        return this.run(opts[Math.floor(Math.random() * opts.length)]);
      }
      case 'phaser': return host.firePhaser?.(a.phaser);
      case 'endCombat':
        if (host.endCombat) return host.endCombat(a.endCombat, a.then);
        console.warn('endCombat used outside combat');
        return;
      case 'stop': return 'stop';
      default:
        return;
    }
  }

  roomKey(id, room) {
    return id.includes(':') ? id : `${room || this.ctx.state.location.room || 'bridge'}:${id}`;
  }

  // ------------------------------------------------------------- dialogue

  async dialogue(id, startNode) {
    const { ctx } = this;
    const tree = ctx.mission.dialogues?.[id];
    if (!tree) { console.warn('No dialogue', id); return; }
    let nodeId = startNode || tree.start || Object.keys(tree.nodes)[0];
    let guard = 0;
    while (nodeId && guard++ < 200) {
      const node = tree.nodes[nodeId];
      if (!node) { console.warn('Missing dialogue node', id, nodeId); return; }
      // conditional redirects let one entry point branch on state
      if (node.redirect) {
        const r = node.redirect.find((x) => check(x.if, ctx));
        if (r) { nodeId = r.goto; continue; }
      }
      if (node.lines) for (const [who, t] of node.lines) await ctx.host.say(who, interp(t, ctx));
      if (node.say) await ctx.host.say(node.say, interp(node.text, ctx));
      if (node.do) { const r = await this.run(node.do); if (r === 'stop') return; }
      if (node.choices) {
        const opts = node.choices.filter((o) => check(o.if, ctx) && !(o.once && ctx.state.choicesTaken[`${id}.${nodeId}.${o.text}`]));
        if (!opts.length) { nodeId = node.next; continue; }
        const i = await ctx.host.choose(opts.map((o) => interp(o.text, ctx)));
        const o = opts[i];
        ctx.state.choicesTaken[`${id}.${nodeId}.${o.text}`] = true;
        if (o.id) ctx.state.choicesTaken[o.id] = true;
        if (o.do) { const r = await this.run(o.do); if (r === 'stop') return; }
        nodeId = o.goto;
      } else {
        nodeId = node.next;
      }
    }
  }
}

function Phaser_rgb(c) {
  const n = typeof c === 'number' ? c : parseInt(String(c || '#ffffff').replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
