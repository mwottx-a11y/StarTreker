// Mission validator. Pure JS (no Phaser) so it runs both in the browser at
// load time and from the command line (`npm run validate`). It catches the
// mistakes that otherwise only show up deep into a playthrough: a `goto` to a
// room that doesn't exist, a speaker with no character definition, etc.

import { CREW, STANDARD_ITEMS } from '../cast/crew.js';

export function validateMission(m) {
  const errors = [];
  const warn = [];
  const err = (msg) => errors.push(`[${m?.id || '?'}] ${msg}`);
  if (!m || typeof m !== 'object') return { errors: ['mission is not an object'], warnings: [] };
  for (const k of ['id', 'title', 'rooms', 'endings']) if (!m[k]) err(`missing required field "${k}"`);

  const rooms = m.rooms || {};
  const chars = { ...CREW, ...(m.characters || {}) };
  const items = { ...STANDARD_ITEMS, ...(m.items || {}) };
  const dialogues = m.dialogues || {};
  const endings = m.endings || {};
  const encounters = m.encounters || {};
  const scripts = m.scripts || {};
  const systems = m.starmap?.systems || {};

  const visit = (actions, where) => {
    if (!actions) return;
    if (typeof actions === 'string') return;
    if (actions.cases) { actions.cases.forEach((c, i) => visit(c.do, `${where}.cases[${i}]`)); return; }
    if (!Array.isArray(actions)) actions = [actions];
    for (const a of actions) {
      if (!a || typeof a !== 'object') { err(`${where}: invalid action ${JSON.stringify(a)}`); continue; }
      if ('say' in a && a.say && !chars[a.say]) err(`${where}: unknown speaker "${a.say}"`);
      if ('goto' in a && !rooms[a.goto]) err(`${where}: goto unknown room "${a.goto}"`);
      if ('beamDown' in a && !rooms[a.beamDown]) err(`${where}: beamDown unknown room "${a.beamDown}"`);
      if ('dialogue' in a && !dialogues[a.dialogue]) err(`${where}: unknown dialogue "${a.dialogue}"`);
      if ('end' in a && !endings[a.end]) err(`${where}: unknown ending "${a.end}"`);
      if ('combat' in a && !encounters[a.combat]) err(`${where}: unknown encounter "${a.combat}"`);
      if ('run' in a && !scripts[a.run]) err(`${where}: unknown script "${a.run}"`);
      for (const it of [].concat(a.give || [], a.take || [])) if (!items[it]) err(`${where}: unknown item "${it}"`);
      for (const sys of [].concat(a.unlock || [], a.setSystem || [])) if (!systems[sys]) err(`${where}: unknown system "${sys}"`);
      visit(a.then, where); visit(a.else, where);
      if (a.choice) a.choice.forEach((c, i) => visit(c.do, `${where}.choice[${i}]`));
      if (a.random) a.random.forEach((r, i) => visit(r, `${where}.random[${i}]`));
    }
  };

  for (const [rid, room] of Object.entries(rooms)) {
    visit(room.onEnter, `rooms.${rid}.onEnter`);
    visit(room.onFirstEnter, `rooms.${rid}.onFirstEnter`);
    visit(room.beamUp, `rooms.${rid}.beamUp`);
    if (!room.walk) warn.push(`[${m.id}] rooms.${rid}: no walk area; using default`);
    const ids = new Set();
    for (const h of room.hotspots || []) {
      const w = `rooms.${rid}.${h.id}`;
      if (!h.id) err(`rooms.${rid}: hotspot without id`);
      if (ids.has(h.id)) err(`${w}: duplicate hotspot id`);
      ids.add(h.id);
      if (!h.rect && !h.npc && !h.sprite) err(`${w}: needs rect, npc or sprite`);
      if (h.npc && !chars[h.npc]) err(`${w}: unknown npc character "${h.npc}"`);
      if (h.exit && !rooms[h.exit.room]) err(`${w}: exit to unknown room "${h.exit.room}"`);
      for (const v of ['look', 'use', 'talk', 'get', 'venn', 'okafor', 'daska', 'onExit']) {
        const val = h[v];
        if (val && val.cases) val.cases.forEach((c, i) => visit(c.do, `${w}.${v}.cases[${i}]`));
        else visit(val, `${w}.${v}`);
      }
      if (h.exit?.blocked) visit(h.exit.blocked, `${w}.exit.blocked`);
      for (const [it, acts] of Object.entries(h.items || {})) {
        if (it !== '*' && !items[it]) err(`${w}.items: unknown item "${it}"`);
        visit(acts, `${w}.items.${it}`);
      }
    }
  }
  for (const [did, d] of Object.entries(dialogues)) {
    const nodes = d.nodes || {};
    if (d.start && !nodes[d.start]) err(`dialogues.${did}: start node "${d.start}" missing`);
    for (const [nid, n] of Object.entries(nodes)) {
      const w = `dialogues.${did}.${nid}`;
      if (n.say && !chars[n.say]) err(`${w}: unknown speaker "${n.say}"`);
      (n.lines || []).forEach(([who]) => { if (who && !chars[who]) err(`${w}: unknown speaker "${who}"`); });
      if (n.next && !nodes[n.next]) err(`${w}: next "${n.next}" missing`);
      (n.redirect || []).forEach((r) => { if (!nodes[r.goto]) err(`${w}: redirect to missing "${r.goto}"`); });
      (n.choices || []).forEach((c, i) => {
        if (c.goto && !nodes[c.goto]) err(`${w}.choices[${i}]: goto "${c.goto}" missing`);
        visit(c.do, `${w}.choices[${i}]`);
      });
      visit(n.do, w);
    }
  }
  for (const [sid, s] of Object.entries(systems)) {
    for (const k of ['onArrive', 'onFirstArrive', 'scan', 'hail', 'tactical']) visit(s[k], `starmap.${sid}.${k}`);
    for (const [k, v] of Object.entries(s.stations || {})) [].concat(v).forEach((o, i) => visit(o.do, `starmap.${sid}.stations.${k}[${i}]`));
    if (s.orbit) { visit(s.orbit.before, `starmap.${sid}.orbit.before`); visit(s.orbit.blocked, `starmap.${sid}.orbit.blocked`); }
    if (s.orbit?.beamDown && !rooms[s.orbit.beamDown]) err(`starmap.${sid}.orbit: unknown room "${s.orbit.beamDown}"`);
  }
  if (m.starmap && !systems[m.starmap.start]) err(`starmap.start "${m.starmap.start}" missing`);
  for (const [eid, e] of Object.entries(encounters)) {
    for (const k of ['onVictory', 'onDefeat', 'onSurrender', 'onRetreat', 'hail', 'onStart']) visit(e[k], `encounters.${eid}.${k}`);
    if (!e.enemies?.length) err(`encounters.${eid}: no enemies`);
  }
  for (const [sid, s] of Object.entries(scripts)) visit(s, `scripts.${sid}`);
  visit(m.bridge?.onStart, 'bridge.onStart');
  for (const [k, v] of Object.entries(m.bridge?.stations || {})) [].concat(v).forEach((o, i) => visit(o.do, `bridge.stations.${k}[${i}]`));
  if (m.bridge?.navLock) visit(m.bridge.navLock.do, 'bridge.navLock');
  for (const [k, v] of Object.entries(m.crewTalk || {})) v.forEach((o, i) => visit(o.do, `crewTalk.${k}[${i}]`));
  (m.awayBeamUp || []).forEach((o, i) => visit(o.do, `awayBeamUp[${i}]`));
  for (const [iid, it] of Object.entries(m.items || {})) {
    visit(it.look, `items.${iid}.look`);
    for (const [o, acts] of Object.entries(it.combine || {})) { if (!items[o]) err(`items.${iid}.combine: unknown item "${o}"`); visit(acts, `items.${iid}.combine.${o}`); }
  }
  return { errors, warnings: warn };
}
