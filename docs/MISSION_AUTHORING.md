# Writing a Mission

A mission is **one data object**. It describes everything in the episode: the briefing, star map, rooms,
dialogue, combat encounters, puzzles, scoring and endings. The engine supplies the cast, the scenes and the
rules. You write the story.

Because missions are data, not code, the same object works as an ES module (`export default {...}`) or as a
plain `.json` file.

- **Bundled:** `src/missions/<id>/mission.js` with `export default { ... }`. It's picked up automatically at
  build time. You can use JS helpers to make background art less verbose (see `silent-choir`), but the
  exported value must still be plain data.
- **External:** `public/missions/<id>.json`, listed in `public/missions/manifest.json`. It's fetched at
  startup, so you can deploy a new episode by uploading two files.

Always run `npm run validate`. It catches unknown rooms, speakers, items, dialogue nodes, endings,
encounters and star systems before a player hits them.

---

## 1. Top level

```js
{
  id: 'my-mission',            // unique, used for saves and the profile
  episode: 3,                  // sort order in the archive
  title: 'The Long Dark',
  stardate: '4450.1',
  synopsis: 'Shown in the mission archive.',
  requires: ['silent-choir'],  // optional: locked until these are completed
  maxScore: 100,               // denominator for the evaluation percentage
  hints: ['Shown on the debrief when the player scores < 100%.'],

  briefing:   { speaker: 'thorne', lines: ['...', '...'] },   // or { actions: [...] }
  characters: { ... },  // NPCs (the crew and recurring guests come from src/cast/crew.js)
  items:      { ... },
  starmap:    { ... },
  bridge:     { onStart: [...], stations: {...}, navLock: {...} },
  encounters: { ... },
  rooms:      { ... },
  dialogues:  { ... },
  scripts:    { ... },  // named, reusable action lists: { run: 'name' }
  crewTalk:   { venn: [{ if, do }], okafor: [...], daska: [...] },  // "Talk to" a crewmember
  awayBeamUp: [{ if, do }],  // override the COMM > beam up behaviour
  endings:    { ... },
}
```

## 2. The cast

Crew ids: `captain`, `venn`, `okafor`, `daska` (the away team), `sato`, `arun`, `brandt` (the bridge crew),
`thorne` (the admiral) and `computer`. Recurring guests in `src/cast/crew.js` include `kesh` and `halvorsen`.
Add new recurring characters there. Characters that appear in only one episode go in the mission's
`characters`:

```js
characters: {
  tamsin: {
    name: 'Captain Tamsin Reyes', short: 'Reyes', color: 0xf0b080,
    look: {
      skin: '#c89070', hair: '#2a1a14', hairStyle: 'short',   // short | long | bun | crest | bald
      uniform: '#6a5040', trim: '#3a2a20', pants: '#2a2420',
      features: ['scar'],   // beard old glasses markings ridges tusks armor visor scar pointed robe
      bg: '#2a2018',        // portrait background
    },
  },
  patience: { name: 'PATIENCE', short: 'Patience', color: 0xffc060, portrait: false }, // voice only
}
```

The same `look` generates both the walking sprite and the dialogue portrait.

## 3. Actions

Behaviour is written as **arrays of actions**. Each action is an object whose key names it:

| Action | Effect |
|---|---|
| `{ say: 'venn', text: '...' }` | A character speaks. `text` may be an array of consecutive lines. |
| `{ narrate: '...' }` | Narration, with no speaker. |
| `{ choice: [{ text, if?, once?, id?, do: [...] }] }` | Present the player with options. |
| `{ dialogue: 'treeId', node? }` | Run a dialogue tree (see §5). |
| `{ run: 'scriptName' }` | Run a named script from `scripts`. |
| `{ if: COND, then: [...], else: [...] }` | Branch. |
| `{ set: 'flag' }` / `{ set: { a: true, b: false } }` / `{ unset: 'flag' }` | Flags. |
| `{ inc: 'var', by: 1 }` / `{ inc: { a: 1 } }` / `{ setVar: { a: 0 } }` | Numeric vars. |
| `{ give: 'item' }` / `{ give: ['a','b'], silent: true }` / `{ take: 'item' }` | Inventory. |
| `{ score: 10, reason: 'Talked them down' }` | Award points. Each `reason` pays out only once and appears on the debrief. |
| `{ objective: 'Text', id: 'obj' }` / `{ complete: 'obj' }` | The mission log. |
| `{ goto: 'room', at: [x, y], face: 'left' }` | Change room (away missions). |
| `{ beamDown: 'room', at: [x, y] }` / `{ beamUp: true, then: [...] }` | Transport. `then` runs on the bridge. |
| `{ combat: 'encounterId' }` | Start a space battle. |
| `{ endCombat: 'spared', then: [...] }` | Inside combat scripts: stop the fight and return. |
| `{ end: 'endingId' }` | End the mission and show the debrief. |
| `{ hide: 'hotspot' }` / `{ show: 'hotspot' }` | Toggle hotspots (`'room:hotspot'` targets another room). |
| `{ pose: 'npcHotspot', frame: 'down' }` | Change an NPC's frame (`down` = lying on the ground). |
| `{ moveNpc: 'hotspot', to: [x, y] }` / `{ walk: [x, y] }` / `{ face: 'up' }` | Movement. |
| `{ injure: 'daska' }` / `{ heal: 'daska' }` | Injured crew can't act until Okafor treats them. |
| `{ phaser: 'stun' \| 'kill' }` | Draw a hand-phaser beam at the current target. |
| `{ remember: 'key', value? }` | Write to the **persistent profile**, for continuity across episodes. |
| `{ unlock: 'systemId' }` / `{ setSystem: 'id' }` | Star map. |
| `{ alert: 'red' \| null }` | Bridge alert state. |
| `{ repair: { hull, shields, torpedoes } }` | Ship status. |
| `{ sfx: 'name' }` | Sounds: `blip select deny chirp phaser handphaser torpedo disruptor hit explosion shieldhit door transporter warp alert pickup success fail hum scan stun`. |
| `{ tone: 'A3', dur }` / `{ melody: ['A2','E4'], dur, gap }` / `{ drone: ['A1','E2'] \| null }` | Music. |
| `{ wait: ms }`, `{ shake: ms }`, `{ flash: '#ffffff', ms }` | Pacing and effects. |
| `{ random: [[...], [...]] }` | Run one of several action lists at random. |
| `{ stop: true }` | Stop the current action list. |

Any action may carry `when: COND` to make it conditional.

Text supports `{captain}`, `{venn}`, `{ship}`, `{var.name}` and `{someone.name}` interpolation.

## 4. Conditions

```js
'flagName'                       // shorthand for { flag: 'flagName' }
{ flag: 'x' } { flag: 'x', eq: 'value' } { notFlag: 'x' }
{ has: 'item' } { lacks: 'item' }
{ var: 'n', gte: 2 }            // also eq, lte, gt, lt
{ memory: 'kesh_owes_us' }      // persistent, set by earlier episodes
{ completed: 'silent-choir' }   // another mission finished
{ injured: 'daska' } { visited: 'roomId' } { room: 'id' } { system: 'id' } { chose: 'choiceId' } { scoreGte: 50 }
{ all: [...] } { any: [...] } { not: COND }
[cond, cond]                     // array = all
true
```

## 5. Dialogue trees

```js
dialogues: {
  halvorsen: {
    start: 'n1',
    nodes: {
      n1: {
        redirect: [{ if: 'calm', goto: 'calm' }],          // optional conditional entry
        lines: [['halvorsen', 'Stay back!'], [null, 'He backs into the corner.']],
        // or: say: 'halvorsen', text: '...'
        do: [ /* actions */ ],
        choices: [
          { text: 'What happened here?', once: true, goto: 'story' },
          { text: 'Mira is outside.', if: 'talked_mira', goto: 'mira', do: [{ score: 5, reason: '...' }] },
          { text: 'Goodbye.', goto: null },                 // null ends the conversation
        ],
        // or, with no choices: next: 'otherNode'
      },
    },
  },
}
```

Choices with `once: true` disappear after they're picked. Loop back to a "menu" node to build the classic
ask-about-everything conversation.

## 6. Rooms and hotspots

The room canvas is **320 × 150 art pixels**, displayed at 2×. The verb bar sits below it.

```js
rooms: {
  plaza: {
    name: 'Kepos IV - Colony Plaza',
    paint: [ /* paint commands, §7 */ ],      // or image: 'missions/art/plaza.png' (320x150)
    foreground: [ /* paint drawn over characters */ ],
    walk: { poly: [[20,108],[300,104],[318,148],[0,148]] },  // walkable area
    scale: [100, 0.78, 148, 1.05],   // [farY, farScale, nearY, nearScale] depth scaling
    drone: ['A1', 'E2'],             // ambient tone
    onFirstEnter: [...], onEnter: [...],
    beamUp: [...],                    // optional override for COMM > beam up
    hotspots: [ ... ],
  },
}
```

### Hotspots

```js
{
  id: 'keypad', name: 'Keypad',
  rect: [74, 80, 8, 12],          // click area (x, y, w, h)
  walkTo: [76, 112], faceDir: 'up',
  hidden: false, if: COND,        // visibility
  // Visuals (optional):
  npc: 'mira', at: [190, 116], pose: 'front0', flip: false, scale: 0.62,
  sprite: { paint: [...], w, h } | { pixels: { rows: ['..XX..'], palette: { X: '#fff' } } },
  anim: 'pulse' | 'bob' | 'flicker' | 'sway', depth: 100,

  // Verbs. Each takes an action list, a plain string (narration; for crew fields, that officer says it),
  // or { cases: [{ if, do }] } to pick a response by state.
  look: 'A dead keypad.',
  use: [...], talk: [...], get: [...],
  venn: '...', okafor: '...', daska: '...',     // what each specialist does with it
  // shorthand alternatives: scan / med / sec
  items: { power_cell: [...], phaser_stun: [...], '*': [...] },

  exit: { room: 'lab', at: [30, 130], face: 'right', if: 'door_open', blocked: [...] },
  onExit: [...],
}
```

If a mission doesn't script a response, the crew answer in character with generic lines from
`src/cast/crew.js`.

## 7. Paint commands

These draw room backgrounds, hotspot sprites and foregrounds. All coordinates are in art pixels.

| type | fields |
|---|---|
| `sky` | `from, to, y0, y1`: dithered vertical gradient across the full width |
| `gradient` | `x, y, w, h, from, to, dir: 'v' \| 'h'` |
| `stars` | `count, seed, y0, y1, color` |
| `rect` | `x, y, w, h, c` |
| `poly` | `pts: [[x, y], ...], c` |
| `circle` / `ellipse` | `x, y, r, c` / `x, y, rx, ry, c` |
| `line` | `x1, y1, x2, y2, c, w` |
| `ridge` | `y, amp, c, seed, rough, x0, x1`: noisy horizon, filled downward |
| `noise` | `x, y, w, h, c, density, seed` |
| `bricks` | `x, y, w, h, c, bw, bh` |
| `crystal` | `x, y, w, h, c`: faceted spire; `x, y` is the base centre |
| `glow` | `x, y, r, c, strength` |
| `planet` | `x, y, size, base, accent, bands, seed` |
| `console` | `x, y, w, h, c, seed`: panel with blinking lights |
| `pixels` | `x, y, rows, palette` |

Tip: keep a palette of 8–12 colours per room and use dithered gradients rather than smooth ones. That's
most of the period look.

## 8. Items

```js
items: {
  shard: {
    name: 'Singing shard', icon: 'shard', color: '#a0f0ff',
    // built-in icons: phaser card cell shard tool datapad medkit crystal key disc fuse generic
    // or pixels: { rows, palette } for a custom 16x16 icon
    desc: 'Shown when examined.',
    look: [...],                    // optional: richer examine
    combine: { tuner: [...] },      // using this item on another item
  },
}
```

The standard kit is `phaser_stun` and `phaser_kill`. Set `startInventory` to override it.

## 9. Star map and bridge

```js
starmap: {
  start: 'sb9',
  systems: {
    kepos: {
      name: 'Kepos IV', x: 210, y: 78, color: '#e090c0', desc: 'Shown on hover.',
      locked: true, hidden: false,                 // locked: shown but can't be selected until { unlock }
      view: { planet: { size: 96, base, accent, bands, seed, scale }, station: true,
              ship: { style: 'raider' | 'drone' | 'freighter' | 'meridian', color, if: COND } },
      onFirstArrive: [...], onArrive: [...],
      scan: [...],      // Science
      hail: [...],      // Comms
      tactical: [...],  // Tactical
      stations: { engineering: [{ if, do }] },   // per-system station overrides
      orbit: { beamDown: 'plaza', at: [150, 136], if: COND, before: [...], blocked: [...], line: '...' },
    },
  },
},
bridge: {
  onStart: [...],                                   // runs when the player first reaches the bridge
  stations: { helm: [{ if, do }] },                 // mission-wide station overrides
  navLock: { if: COND, do: [...] },                 // stop the player leaving the system
}
```

Station ids: `helm`, `science`, `comms`, `tactical`, `engineering`, `transporter`, `log` and `menu`.

## 10. Encounters (space combat)

```js
encounters: {
  kesh: {
    background: { planet: { base, accent, bands, seed } },
    enemies: [{ name: "Kesh's Claw", style: 'raider', color, hull: 100, shields: 60,
                damage: 12, fireRate: 2.0, speed: 120, skill: 0.65, agility: 0.9, surrenderAt: 35 }],
    surrenderAt: 35,                 // % hull at which onSurrender runs (once)
    onStart: [...], hail: [...],
    onSurrender: [...],              // use { endCombat: 'spared' } to accept; otherwise the fight resumes
    onVictory: [...], onDefeat: [...], onRetreat: [...],
    canRetreat: true, noRetreat: [...],
  },
}
```

After `onVictory` and `onRetreat`, the player returns to wherever combat started, unless the script changes
scene or ends the mission.

## 11. Endings and scoring

```js
endings: {
  harmony: { title: 'The Song Resumes', outcome: 'success', text: ['Captain\'s log...', '...'] },
  lost:    { title: 'All Hands',        outcome: 'failure', text: ['...'] },
}
```

The evaluation percentage is `sum(score awards) / maxScore`. Set `maxScore` to the best achievable total,
and play your golden path to confirm the debrief reads 100%.

Good scoring rewards the things the genre values: gathering information before acting, choosing words over
weapons, keeping the crew safe, keeping promises, and treating the unknown as possibly alive.

## 12. Continuity between episodes

`{ remember: 'kesh_owes_us' }` writes to the player's persistent profile. Later episodes check it with
`{ memory: 'kesh_owes_us' }`. Episode 2 uses this to offer a third solution that only exists if you kept your
word to Kesh in Episode 1. Document the memories your episode writes at the top of its file, so later
authors can build on them.

Memories written so far:

| Key | Set by | Meaning |
|---|---|---|
| `kesh_owes_us` | silent-choir | Kept the bargain with Kesh; Varr-Tesh owes the Meridian |
| `kesh_grudge` | silent-choir | Jailed Kesh's crew |
| `destroyed_kesh` | silent-choir | Destroyed Kesh's ship |
| `killed_varr` | silent-choir | Killed Varr looters |
| `varr_respect` | silent-choir | Talked the looters down |
| `met_choir` / `choir_restored` / `destroyed_choir` | silent-choir | The fate of the Choir |
| `ilvari_asylum` | veil-of-patience | Granted the Ilvari asylum on the record |
| `kesh_debt_paid` | veil-of-patience | Called in Kesh's debt |

## 13. Testing checklist

1. Run `npm run validate`.
2. Play the golden path and confirm the debrief shows 100%.
3. Play the worst path: shoot first, stun everyone. Every branch should still reach an ending.
4. Try every verb on every hotspot with every crewmember. Fallback lines cover gaps, but specific lines are
   what make a room feel alive.
5. Try the puzzle steps out of order. For example, use the item before you've learned why you need it.
