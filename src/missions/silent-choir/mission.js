// EPISODE 1: THE SILENT CHOIR
//
// A research colony has gone quiet. Its 112 colonists stand motionless in the
// plaza, humming in unison. A Varr corsair circles overhead, waiting to loot
// the "singing stones". What the colonists are listening to is alive - and it
// is grieving.
//
// This file is plain data (see docs/MISSION_AUTHORING.md). The small helper
// functions below only exist to make the background art less verbose; they
// return ordinary paint commands.

const rect = (x, y, w, h, c) => ({ type: 'rect', x, y, w, h, c });
const poly = (pts, c) => ({ type: 'poly', pts, c });
const crystal = (x, y, w, h, c = '#80d8e8') => ({ type: 'crystal', x, y, w, h, c });
const glow = (x, y, r, c, strength = 0.5) => ({ type: 'glow', x, y, r, c, strength });

const SKY_DUSK = [
  { type: 'sky', from: '#1a1030', to: '#7a3a68', y0: 0, y1: 78 },
  { type: 'stars', count: 40, seed: 4, y0: 0, y1: 40 },
  { type: 'circle', x: 262, y: 22, r: 9, c: '#e8c8d8' },
  { type: 'circle', x: 265, y: 20, r: 8, c: '#7a3a68' },
];

// ------------------------------------------------------------------ art

const PLAZA = [
  ...SKY_DUSK,
  { type: 'ridge', y: 70, amp: 8, c: '#3a2448', seed: 9 },
  crystal(150, 66, 6, 30), crystal(162, 66, 4, 18), crystal(205, 64, 7, 38, '#a0e8f0'), crystal(216, 66, 4, 16),
  glow(205, 50, 16, '#a0f0ff', 0.35),
  { type: 'ridge', y: 82, amp: 5, c: '#4a3448', seed: 2, rough: 0.5 },
  { type: 'gradient', x: 0, y: 84, w: 320, h: 66, from: '#5a4650', to: '#3a2e36' },
  { type: 'noise', x: 0, y: 86, w: 320, h: 64, c: '#6a5660', density: 0.05, seed: 12 },
  // paved plaza
  poly([[30, 104], [290, 100], [320, 150], [0, 150]], '#6e666e'),
  { type: 'line', x1: 30, y1: 104, x2: 290, y2: 100, c: '#8a828a' },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ type: 'line', x1: 30 + i * 52, y1: 104 - i * 0.8, x2: i * 64, y2: 150, c: '#5e565e' })),
  { type: 'line', x1: 16, y1: 122, x2: 304, y2: 120, c: '#5e565e' },
  // admin building (left)
  rect(8, 38, 108, 68, '#a8acb8'), rect(8, 38, 108, 3, '#d0d4e0'), rect(8, 100, 108, 6, '#7a7e8a'),
  poly([[4, 40], [62, 22], [120, 40]], '#6a7080'), poly([[62, 22], [120, 40], [62, 40]], '#565c6a'),
  rect(18, 50, 20, 12, '#2a3448'), rect(19, 51, 18, 4, '#4a6488'), rect(86, 50, 20, 12, '#2a3448'), rect(87, 51, 18, 4, '#4a6488'),
  rect(48, 70, 26, 36, '#58606e'), rect(50, 72, 22, 34, '#3a4250'), rect(60, 72, 2, 34, '#2a303c'),
  rect(14, 66, 30, 6, '#2a3448'),
  rect(16, 68, 26, 2, '#a0b8e0'),
  // comm mast
  rect(132, 30, 2, 70, '#8a8e98'), rect(126, 30, 14, 2, '#8a8e98'), { type: 'circle', x: 133, y: 28, r: 2, c: '#ff5040' },
  // rover (right)
  rect(230, 88, 60, 18, '#c8a050'), rect(230, 88, 60, 3, '#e8c878'), rect(238, 78, 26, 12, '#a88040'), rect(240, 80, 22, 6, '#40607a'),
  rect(284, 92, 8, 10, '#806030'),
  { type: 'circle', x: 240, y: 108, r: 6, c: '#202024' }, { type: 'circle', x: 280, y: 108, r: 6, c: '#202024' },
  { type: 'circle', x: 240, y: 108, r: 2, c: '#707078' }, { type: 'circle', x: 280, y: 108, r: 2, c: '#707078' },
  rect(266, 94, 10, 6, '#303034'),
  // fountain / monument
  { type: 'ellipse', x: 170, y: 114, rx: 22, ry: 6, c: '#4a4450' }, { type: 'ellipse', x: 170, y: 112, rx: 20, ry: 5, c: '#3a6a8a' },
  rect(167, 92, 6, 20, '#8a8490'), { type: 'circle', x: 170, y: 91, r: 4, c: '#a0e8f0' },
  // trail east
  poly([[296, 100], [320, 96], [320, 134], [304, 128]], '#4a3a3a'),
];

const LAB = [
  rect(0, 0, 320, 150, '#2a2e38'),
  { type: 'gradient', x: 0, y: 0, w: 320, h: 104, from: '#3a404c', to: '#2c3038' },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(4 + i * 40, 10, 36, 88, '#343a46')),
  rect(0, 98, 320, 4, '#5a6070'),
  { type: 'gradient', x: 0, y: 102, w: 320, h: 48, from: '#4a4e58', to: '#363a44' },
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ type: 'line', x1: i * 52, y1: 102, x2: i * 60 - 20, y2: 150, c: '#3e424c' })),
  // window w/ crystal glow outside
  rect(118, 16, 84, 44, '#14101c'), rect(120, 18, 80, 40, '#2a1838'),
  { type: 'gradient', x: 120, y: 18, w: 80, h: 40, from: '#2a1838', to: '#5a2a58' },
  crystal(150, 58, 6, 26, '#90e0f0'), crystal(176, 58, 4, 16, '#90e0f0'), glow(150, 40, 12, '#c0f8ff', 0.4),
  rect(118, 16, 84, 2, '#5a6070'), rect(158, 16, 2, 44, '#5a6070'), rect(118, 58, 84, 2, '#5a6070'),
  // terminals (left)
  { type: 'console', x: 18, y: 58, w: 60, h: 30, c: '#2e3644', seed: 21 },
  rect(24, 40, 48, 18, '#101820'), rect(26, 42, 44, 14, '#1a4a5a'),
  { type: 'noise', x: 27, y: 43, w: 42, h: 12, c: '#60d0e0', density: 0.18, seed: 3 },
  rect(18, 88, 60, 14, '#3a4250'),
  // desk
  rect(120, 92, 70, 6, '#7a6048'), rect(124, 98, 6, 16, '#5a4430'), rect(180, 98, 6, 16, '#5a4430'),
  rect(132, 86, 18, 6, '#c8c8d0'), rect(160, 88, 12, 4, '#303848'),
  // sample cradle on bench (right of window)
  rect(214, 74, 34, 6, '#6a7080'), rect(216, 80, 4, 22, '#4a505c'), rect(242, 80, 4, 22, '#4a505c'),
  rect(222, 64, 20, 10, '#90a8c0'), rect(224, 66, 16, 6, '#202834'),
  // locker
  rect(262, 30, 36, 72, '#5a6474'), rect(264, 32, 15, 68, '#4a5464'), rect(281, 32, 15, 68, '#4a5464'),
  rect(276, 60, 2, 8, '#c0c8d0'), rect(283, 60, 2, 8, '#c0c8d0'),
  // door back to plaza (left wall)
  rect(0, 60, 12, 46, '#1a1e26'), rect(10, 60, 2, 46, '#5a6070'),
];

const TRAIL = [
  ...SKY_DUSK,
  // canyon walls
  poly([[0, 0], [70, 0], [90, 40], [80, 80], [100, 110], [0, 110]], '#4a2e30'),
  poly([[0, 0], [50, 0], [64, 40], [56, 90], [0, 100]], '#5a383a'),
  poly([[320, 0], [250, 0], [232, 36], [244, 70], [226, 110], [320, 110]], '#4a2e30'),
  poly([[320, 0], [270, 0], [258, 40], [270, 80], [320, 90]], '#5a383a'),
  { type: 'noise', x: 0, y: 0, w: 100, h: 110, c: '#3a2224', density: 0.06, seed: 31 },
  { type: 'noise', x: 226, y: 0, w: 94, h: 110, c: '#3a2224', density: 0.06, seed: 32 },
  { type: 'gradient', x: 0, y: 92, w: 320, h: 58, from: '#6a4c44', to: '#4a3430' },
  { type: 'noise', x: 0, y: 96, w: 320, h: 54, c: '#7a5c50', density: 0.05, seed: 33 },
  // tunnel mouth beyond gate
  { type: 'ellipse', x: 170, y: 82, rx: 30, ry: 26, c: '#1a1018' },
  glow(170, 82, 22, '#80d0f0', 0.3),
  // fence + gate
  rect(96, 58, 4, 44, '#8a8e98'), rect(240, 58, 4, 44, '#8a8e98'),
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => rect(100 + i * 6, 62, 1, 38, '#6a6e78')),
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => rect(204 + i * 6, 62, 1, 38, '#6a6e78')),
  rect(100, 62, 40, 2, '#8a8e98'), rect(200, 62, 40, 2, '#8a8e98'),
  rect(206, 74, 6, 10, '#303848'), rect(207, 76, 4, 3, '#ff4030'),
  rect(108, 44, 26, 12, '#d8b040'), rect(110, 46, 22, 2, '#2a2018'), rect(110, 50, 16, 2, '#2a2018'), rect(119, 56, 2, 6, '#6a6e78'),
  // crystal outcrop (left, where the charge is)
  crystal(46, 112, 10, 34, '#90e0f0'), crystal(58, 112, 8, 24, '#a8f0ff'), crystal(36, 112, 6, 18, '#70c0d8'),
  glow(48, 92, 14, '#c0f8ff', 0.3),
  // scattered Varr mining gear
  rect(262, 116, 22, 10, '#5a5048'), rect(264, 114, 18, 3, '#7a7068'), rect(280, 112, 3, 6, '#e0a040'),
];

const CHAMBER = [
  rect(0, 0, 320, 150, '#0a0814'),
  { type: 'gradient', x: 0, y: 0, w: 320, h: 120, from: '#0e0a1c', to: '#1c1434' },
  poly([[0, 0], [320, 0], [320, 26], [260, 14], [200, 22], [140, 12], [80, 24], [0, 16]], '#06040c'),
  poly([[0, 0], [0, 150], [20, 150], [30, 100], [18, 60], [26, 20]], '#120c20'),
  poly([[320, 0], [320, 150], [300, 150], [292, 90], [304, 40]], '#120c20'),
  { type: 'gradient', x: 0, y: 104, w: 320, h: 46, from: '#2a2040', to: '#181228' },
  { type: 'noise', x: 0, y: 0, w: 320, h: 150, c: '#3a3060', density: 0.02, seed: 41 },
  // lattice veins
  { type: 'line', x1: 160, y1: 60, x2: 20, y2: 30, c: '#3a6080' },
  { type: 'line', x1: 160, y1: 60, x2: 300, y2: 40, c: '#3a6080' },
  { type: 'line', x1: 160, y1: 80, x2: 60, y2: 120, c: '#3a6080' },
  { type: 'line', x1: 160, y1: 80, x2: 250, y2: 118, c: '#3a6080' },
  // small crystals around
  crystal(30, 112, 6, 14, '#5090b0'), crystal(300, 116, 6, 18, '#5090b0'), crystal(130, 108, 4, 10, '#5090b0'),
  crystal(200, 110, 5, 12, '#5090b0'),
  glow(160, 66, 46, '#4080c0', 0.35),
];

const HEART_SPRITE = {
  w: 60, h: 80,
  paint: [
    glow(30, 40, 29, '#80e0ff', 0.45),
    crystal(30, 78, 22, 74, '#a0f0ff'),
    crystal(16, 78, 12, 44, '#70c8e8'), crystal(44, 78, 12, 50, '#80d8f0'),
    crystal(8, 78, 6, 24, '#5098c0'), crystal(52, 78, 6, 28, '#5098c0'),
    { type: 'circle', x: 30, y: 44, r: 5, c: '#ffffff' },
    { type: 'circle', x: 30, y: 44, r: 3, c: '#d0fcff' },
  ],
};
const pillar = (h, c) => ({ w: 16, h: h + 6, paint: [glow(8, h / 2, 8, '#80c0ff', 0.25), crystal(8, h + 4, 10, h, c), rect(2, h + 2, 12, 4, '#2a2440')] });

const CHARGE_SPRITE = {
  pixels: {
    rows: ['.GGGGGG.', 'GddddddG', 'GdRRddYG', 'GddddddG', '.GGGGGG.'],
    palette: { G: '#5a5a50', d: '#3a3a34', R: '#ff3020', Y: '#f0c040' },
  },
};

// ------------------------------------------------------------------ mission

export default {
  id: 'silent-choir',
  episode: 1,
  title: 'The Silent Choir',
  stardate: '4417.2',
  synopsis:
    'The research colony on Kepos IV has stopped transmitting. Its last message was nine seconds of a low, harmonic hum. A Varr corsair has been sighted in the sector. Find out what happened to the colonists - and why they are singing.',
  maxScore: 100,
  hints: [
    'Information gathered before a confrontation is worth more than torpedoes spent during one.',
    'A child sees what adults have stopped listening for.',
    'A promise to a corsair is still a promise, Captain.',
    'Not everything that frightens us is hostile.',
  ],

  // ---------------------------------------------------------------- cast
  // Kesh and Halvorsen are recurring characters defined in src/cast/crew.js.
  characters: {
    rask: {
      name: 'Rask', short: 'Rask', color: 0x90d070,
      look: { skin: '#6a7a50', hair: '#1a1410', hairStyle: 'crest', uniform: '#4a3a2a', trim: '#806040', pants: '#2a2018', features: ['ridges', 'tusks', 'armor'], bg: '#2a1810' },
    },
    ulo: {
      name: 'Ulo', short: 'Ulo', color: 0xb0e090,
      look: { skin: '#8a9a68', hair: '#3a3020', hairStyle: 'bald', uniform: '#5a4a3a', trim: '#806040', pants: '#2a2018', features: ['ridges', 'armor'], bg: '#2a1810' },
    },
    mira: {
      name: 'Mira Halvorsen', short: 'Mira', color: 0xffd0a0,
      look: { skin: '#f0c8a8', hair: '#e8c870', hairStyle: 'long', uniform: '#6a88c0', trim: '#3a4870', pants: '#3a4870', bg: '#283048' },
    },
    colonist: {
      name: 'Colonist', short: 'Colonist', color: 0xc0c0c0,
      look: { skin: '#c89070', hair: '#302018', uniform: '#7a8a6a', trim: '#4a5a3a', pants: '#3a4030' },
    },
    colonist2: {
      name: 'Colonist', short: 'Colonist', color: 0xc0c0c0,
      look: { skin: '#f0d0b8', hair: '#a04020', hairStyle: 'long', uniform: '#8a6a8a', trim: '#4a3a4a', pants: '#3a3040' },
    },
    colonist3: {
      name: 'Colonist', short: 'Colonist', color: 0xc0c0c0,
      look: { skin: '#5a3a28', hair: '#101010', hairStyle: 'bald', uniform: '#6a7a9a', trim: '#3a4a6a', pants: '#2a3040', features: ['beard'] },
    },
    choir: {
      name: 'The Choir (through Venn)', short: 'The Choir', color: 0xa0f0ff,
      look: { skin: '#b0d8e8', hair: '#e0f8ff', hairStyle: 'bun', uniform: '#2e8f9a', trim: '#102028', features: ['markings'], markColor: '#80ffff', eyes: '#80ffff', bg: '#082040' },
    },
  },

  items: {
    power_cell: { name: 'Power cell', icon: 'cell', color: '#60e0a0', desc: 'A charged rover power cell. Standard colony issue.' },
    keycard: { name: 'Access card', icon: 'card', color: '#4060a0', desc: 'Dr. Halvorsen\'s access card. "EXCAVATION - ALL AREAS".' },
    tuner: { name: 'Resonance tuner', icon: 'tool', color: '#d0a040', desc: 'A field instrument for exciting crystal samples at precise frequencies. It looks like a tuning fork that went to university.' },
    shard: {
      name: 'Singing shard', icon: 'shard', color: '#a0f0ff',
      desc: 'A fist-sized crystal fragment. It is warm, and if you hold it close you can hear a single, sustained note - as if it is waiting for the rest of the chord.',
    },
  },

  // ---------------------------------------------------------------- briefing
  briefing: {
    speaker: 'thorne',
    lines: [
      'Captain Hale. Nine days ago the Halvorsen Institute on Kepos IV stopped transmitting. One hundred and twelve colonists, mostly researchers and their families.',
      'Their final transmission was nine seconds long. No voice. Just a low harmonic hum. Our analysts can\'t make anything of it.',
      'There\'s a complication. Varr corsairs have been raiding the Kepos sector. Clan Varr-Tesh, by the ship markings. They\'re opportunists, not fanatics - but they\'re armed.',
      'Find out what happened to those people. Bring them home if you can. And Rowan - the Varr are not at war with us. Let\'s keep it that way. Thorne out.',
    ],
  },

  bridge: {
    onStart: [
      { objective: 'Investigate the silence on Kepos IV', id: 'investigate' },
      { say: 'sato', text: 'Kepos IV is plotted, Captain. Stellar cartography also shows a Concord relay buoy at Ilos, roughly on our way.' },
      { say: 'venn', text: 'The Ilos relay would have logged the colony\'s final transmission in full. The version Command received was compressed.' },
    ],
  },

  crewTalk: {
    venn: [
      { if: 'choir_contact', do: [{ say: 'venn', text: 'I can still hear them, faintly. It is not unpleasant. It is like standing in the next room from a very old song.' }] },
      { if: { system: 'kepos' }, do: [{ say: 'venn', text: 'The hum is... louder than it should be, Captain. Not to the ear. Behind it.' }] },
    ],
    okafor: [
      { if: 'daska_was_hurt', do: [{ say: 'okafor', text: 'Keep that boy behind you, Captain. I\'m running out of patience and hyposprays.' }] },
      { if: true, do: [{ say: 'okafor', text: 'A hundred people standing in the open for nine days, and they\'re all perfectly healthy. That bothers me more than if they were sick.' }] },
    ],
    daska: [
      { if: 'daska_was_hurt', do: [{ say: 'daska', text: 'Shoulder\'s fine, sir! Mostly. Doctor says I\'m not allowed to say "just a scratch" anymore.' }] },
      { if: true, do: [{ say: 'daska', text: 'Perimeter\'s clear, sir. Well. Apart from the hundred people humming.' }] },
    ],
  },

  // ---------------------------------------------------------------- star map
  starmap: {
    start: 'sb9',
    systems: {
      sb9: {
        name: 'Starbase Concord-9', x: 30, y: 70, color: '#80c0ff',
        desc: 'Sector command. Where the coffee is real.',
        view: { station: true, planet: { size: 64, base: '#4a6a3a', accent: '#8aa070', scale: 1.4 } },
        scan: [{ say: 'venn', text: 'Starbase Concord-9. All systems nominal. Their replicators remain, regrettably, unrepaired.' }],
        hail: [
          { say: 'arun', text: 'Starbase traffic control wishes us a good voyage, Captain. And reminds us we still owe them a shuttlecraft.' },
        ],
      },
      ilos: {
        name: 'Ilos Relay', x: 120, y: 20, color: '#c0c0ff',
        desc: 'Unmanned Concord communications relay buoy.',
        view: { planet: { size: 48, base: '#3a3a5a', accent: '#6a6a8a', bands: 3, scale: 1 } },
        onArrive: [{ say: 'sato', text: 'Holding position at the Ilos Relay, Captain.' }],
        scan: [
          { say: 'venn', text: 'The relay is intact. Shall I retrieve its buffer?' },
          { if: 'got_transmission', then: [{ say: 'venn', text: 'I have already retrieved it, Captain. The tones remain... memorable.' }], else: [{ run: 'iloTransmission' }] },
        ],
        hail: [{ say: 'arun', text: 'It\'s a buoy, sir. It says "beep".' }, { say: 'okafor', text: 'Can\'t argue with that.' }],
      },
      kepos: {
        name: 'Kepos IV', x: 210, y: 78, color: '#e090c0',
        desc: 'Class-M world. Site of the Halvorsen Institute research colony.',
        view: {
          planet: { size: 96, base: '#5a2a5a', accent: '#a05a90', bands: 6, seed: 77 },
          ship: { style: 'raider', if: { notFlag: 'kesh_gone' }, scale: 1.3 },
        },
        onFirstArrive: [
          { alert: 'red' },
          { say: 'arun', text: 'Captain - a Varr corsair in standard orbit. Configuration matches Clan Varr-Tesh. They\'ve raised shields.' },
          { say: 'daska', text: 'Weapons are charged, sir. Say the word.' },
          { say: 'venn', text: 'I would recommend a full sensor sweep before we do anything else, Captain.' },
          { objective: 'Deal with the Varr corsair', id: 'kesh' },
        ],
        onArrive: [{ say: 'sato', text: 'Standard orbit, Kepos IV.' }],
        scan: [
          { sfx: 'scan' },
          { say: 'venn', text: 'Kepos IV. One hundred and twelve human life signs at the colony - all of them alive. All of them... synchronised. Their neural activity is in perfect phase.' },
          { say: 'venn', text: 'There is a powerful structured signal coming from a crystalline formation two kilometres east of the colony. It is not natural.' },
          {
            if: { notFlag: 'kesh_gone' },
            then: [
              { say: 'venn', text: 'As for the corsair: the Varr vessel\'s port shield emitter is fused. They are compensating, badly. They are in no condition for a protracted engagement.' },
              { set: 'scanned_kesh' },
              { score: 5, reason: 'Scanned the Varr corsair before engaging' },
            ],
          },
        ],
        hail: [
          {
            if: 'kesh_resolved',
            then: [
              {
                if: { notFlag: 'kesh_gone' },
                then: [{ say: 'kesh', text: 'We are waiting, Concord. Bring my people back breathing.' }],
                else: [{ say: 'arun', text: 'Nothing but the hum on every frequency, Captain.' }],
              },
            ],
            else: [{ sfx: 'chirp' }, { dialogue: 'kesh_hail' }],
          },
        ],
        tactical: [
          {
            if: { any: ['kesh_resolved', 'kesh_gone'] },
            then: [{ say: 'daska', text: 'No hostile action from the corsair, sir. I\'d rather not start one.' }],
            else: [
              { say: 'daska', text: 'Target locked on the corsair, sir. Shall I open fire?' },
              {
                choice: [
                  { text: 'Fire at will, Ensign.', do: [{ set: 'fired_first' }, { combat: 'kesh' }] },
                  { text: 'Hold fire.', do: [{ say: 'daska', text: 'Holding, sir.' }] },
                ],
              },
            ],
          },
        ],
        orbit: {
          beamDown: 'plaza', at: [150, 136],
          if: 'kesh_resolved',
          blocked: [{ say: 'venn', text: 'Dropping our shields to transport with an armed corsair in orbit would be... unwise, Captain. We should resolve that situation first.' }],
        },
      },
      marrow: {
        name: 'The Marrow', x: 130, y: 104, color: '#c06040', locked: true,
        desc: 'Varr space. Black markets and blacker reputations.',
      },
    },
  },

  // ---------------------------------------------------------------- encounters
  encounters: {
    kesh: {
      background: { planet: { base: '#5a2a5a', accent: '#a05a90', bands: 6, seed: 77 } },
      enemies: [{ name: "Kesh's Claw", style: 'raider', hull: 100, shields: 60, damage: 12, fireRate: 2.0, speed: 120, skill: 0.65 }],
      surrenderAt: 35,
      onStart: [{ say: 'kesh', text: 'Let us see what Concord steel is worth!' }],
      hail: [
        { say: 'kesh', text: 'Talk is for people who are winning, Concord. Show me you are winning.' },
      ],
      onSurrender: [
        { sfx: 'chirp' },
        { say: 'arun', text: 'Captain - the corsair is hailing. They\'ve dropped what\'s left of their shields.' },
        { say: 'kesh', text: 'Enough! Varr-Tesh yields. You have made your point, Concord. What are your terms?' },
        {
          choice: [
            {
              text: 'No one else needs to die today. Stand down, and stay out of our way.',
              do: [
                { say: 'kesh', text: '...Agreed. And Concord - two of my crew went down to dig six hours ago. They stopped answering. Send them back to me breathing, and we leave.' },
                { set: { kesh_resolved: true, kesh_spared: true } },
                { score: 8, reason: 'Accepted Captain Kesh\'s surrender' },
                { complete: 'kesh' },
                { objective: 'Find Kesh\'s missing crew on the surface', id: 'looters' },
                { endCombat: 'spared' },
              ],
            },
            {
              text: 'You fired on a Concord ship. No terms.',
              do: [
                { say: 'kesh', text: 'Then we die with teeth bared!' },
                { say: 'venn', text: 'Captain. They have surrendered.' },
                { set: 'no_quarter' },
              ],
            },
          ],
        },
      ],
      onVictory: [
        { say: 'daska', text: 'The corsair is... gone, sir.' },
        { say: 'venn', text: 'Sensors registered thirty-one Varr aboard.' },
        { say: 'okafor', text: 'Well. That\'s one way to end a conversation.' },
        { set: { kesh_resolved: true, kesh_gone: true, kesh_destroyed: true } },
        { complete: 'kesh' },
        { remember: 'destroyed_kesh' },
      ],
      onDefeat: [{ say: 'brandt', text: 'Main power\'s gone! We\'re dead in space, Captain!' }, { end: 'lost' }],
      onRetreat: [{ say: 'sato', text: 'We\'ve pulled back out of weapons range, Captain.' }],
    },
    kesh_revenge: {
      background: { planet: { base: '#5a2a5a', accent: '#a05a90', bands: 6, seed: 77 } },
      enemies: [{ name: "Kesh's Claw", style: 'raider', hull: 100, shields: 40, damage: 10, fireRate: 2.0, speed: 130, skill: 0.7 }],
      onStart: [{ say: 'kesh', text: 'You gave your word, Concord. My crew came home in boxes. Now you pay the blood-price!' }],
      onVictory: [{ say: 'venn', text: 'The corsair is destroyed.' }, { say: 'okafor', text: 'Nobody won anything today, Captain.' }, { end: 'harmony' }],
      onDefeat: [{ end: 'lost' }],
      onRetreat: [{ say: 'sato', text: 'They\'re not following. We\'re clear.' }, { end: 'harmony' }],
    },
  },

  // ---------------------------------------------------------------- reusable scripts
  scripts: {
    iloTransmission: [
      { sfx: 'scan' },
      { say: 'venn', text: 'Retrieving. The full transmission is nine minutes long, not nine seconds. Playing the core of it.' },
      { drone: ['A1', 'E2'], vol: 0.03 },
      { melody: ['A2', 'E4', 'C#3'], dur: 1.0, gap: 0.9 },
      { wait: 600 },
      { drone: null },
      { say: 'venn', text: 'Three tones, Captain. A low tone, a high one, then a middle one. Then a gap - precisely where a fourth tone would resolve the chord. Over and over.' },
      { say: 'okafor', text: 'Sounds like somebody waiting for an answer.' },
      { set: { got_transmission: true, heard_song: true } },
      { score: 5, reason: 'Recovered the colony\'s full final transmission' },
    ],
    chordFail: [
      { setVar: { chord: 0 } },
      { sfx: 'deny' },
      { shake: 200 },
      { narrate: 'The tones clash. A shiver of discord runs through the lattice and the pillars fall silent again.' },
      { say: 'venn', text: 'Wrong order, Captain. The lattice wants a specific sequence.' },
    ],
    chordSuccess: [
      { set: 'chamber_tuned' },
      { setVar: { chord: 3 } },
      { wait: 300 },
      { sfx: 'success' },
      { flash: '#a0f0ff', ms: 600 },
      { narrate: 'The three tones bloom into one another and hold. Light ripples outward from the pillars and the great crystal heart steadies, pulsing slowly in time with them - like a held breath.' },
      { say: 'venn', text: 'The lattice is in harmony, Captain. It is... listening. Whatever we offer it now, it will hear.' },
      { score: 5, reason: 'Brought the crystal lattice into harmony' },
    ],
    lootersDown: [
      {
        if: { all: ['rask_down', 'ulo_down'] },
        then: [
          { set: 'looters_subdued' },
          { complete: 'looters' },
          {
            if: { any: ['rask_killed', 'ulo_killed'] },
            then: [
              { say: 'okafor', text: 'Damn it, Captain. That one\'s not getting up again.' },
              { set: 'looters_killed' },
              { remember: 'killed_varr' },
            ],
            else: [
              { say: 'daska', text: 'Both stunned, sir. They\'ll wake up with headaches.' },
              { score: 7, reason: 'Subdued the Varr looters without killing' },
              {
                if: { any: ['kesh_deal', 'kesh_spared'] },
                then: [
                  { sfx: 'chirp' },
                  { say: 'arun', text: 'Captain, Kesh is demanding to know what happened to his people.' },
                  {
                    choice: [
                      {
                        text: 'Beam them back to the corsair. Tell Kesh they\'ll have headaches, and that we\'re even.',
                        do: [{ sfx: 'transporter' }, { hide: ['rask', 'ulo'] }, { set: 'looters_returned' }, { say: 'arun', text: 'Kesh says... "acceptable." I think that\'s Varr for thank you.' }],
                      },
                      {
                        text: 'Beam them to our brig. They opened fire on Concord officers.',
                        do: [{ sfx: 'transporter' }, { hide: ['rask', 'ulo'] }, { set: 'looters_jailed' }, { say: 'arun', text: 'Kesh is... not happy, sir. He used several words my translator refuses to process.' }],
                      },
                    ],
                  },
                ],
                else: [{ sfx: 'transporter' }, { hide: ['rask', 'ulo'] }, { set: 'looters_jailed' }, { say: 'arun', text: 'Two prisoners received in the brig, Captain.' }],
              },
            ],
          },
        ],
      },
    ],
    restore: [
      { take: 'shard' },
      { narrate: 'You raise the shard. This time the chamber does not resist. It lifts from your palm, drifts across the cavern, and settles into a hollow in the heart\'s flank as though it had never left.' },
      { sfx: 'success' }, { flash: '#ffffff', ms: 1200 },
      { melody: ['A2', 'E4', 'C#3', 'A3'], dur: 1.4, gap: 0.7 },
      { narrate: 'Four tones. The chord resolves.' },
      {
        if: 'choir_contact',
        then: [
          { narrate: 'Venn sways. When she speaks, the hundred voices are back beneath her own - softer now.' },
          { say: 'choir', text: '...WHOLE. THE SONG IS WHOLE. WE RELEASE THE WARM MINDS. WE DID NOT KNOW THEY WERE SEPARATE. WE ARE... SORRY.' },
          {
            choice: [
              { text: 'Sing in peace. We\'ll see that no one disturbs you again.', do: [{ say: 'choir', text: 'AND WE WILL REMEMBER THE SHAPE OF YOUR VOICES, SMALL SEPARATE ONES.' }] },
              { text: 'Apology accepted. Just... maybe keep it down a little.', do: [{ say: 'choir', text: '...WE WILL TRY.' }, { say: 'okafor', text: 'Did a mountain just make a joke?' }] },
            ],
          },
        ],
        else: [{ say: 'venn', text: 'It is letting go of them, Captain. I can feel it - like a hand opening.' }],
      },
      { score: 17, reason: 'Restored the Choir\'s missing voice' },
      { complete: 'return' },
      { remember: 'choir_restored' },
      { say: 'captain', text: 'Hale to Meridian. Four to beam up.' },
      { sfx: 'transporter' },
      { beamUp: true, then: [{ run: 'epilogue' }] },
    ],
    destroyHeart: [
      { say: 'venn', text: 'Captain - it is ALIVE.' },
      { say: 'okafor', text: 'Rowan. Think about what you\'re doing.' },
      {
        choice: [
          {
            text: 'Fire.',
            do: [
              { phaser: 'kill' }, { flash: '#ff4030', ms: 400 }, { shake: 1200 }, { sfx: 'explosion' },
              { hide: 'heart' }, { drone: null },
              { narrate: 'The beam strikes the heart. For a moment the whole chamber screams - a hundred voices, a thousand - and then the light goes out, and there is only silence.' },
              { say: 'venn', text: '...They are gone.' },
              { remember: 'destroyed_choir' },
              { say: 'captain', text: 'Hale to Meridian. Beam us up.' },
              { sfx: 'transporter' },
              { beamUp: true, then: [{ say: 'arun', text: 'Captain... the colonists are waking. Most of them. Dr. Okafor\'s staff are reporting some who... aren\'t.' }, { end: 'silence' }] },
            ],
          },
          { text: 'Belay that. Holster your weapons.', do: [{ say: 'venn', text: 'Thank you, Captain.' }] },
        ],
      },
    ],
    epilogue: [
      { wait: 400 },
      { sfx: 'chirp' },
      { say: 'arun', text: 'Captain - reports from the surface. The colonists are waking up. Confused, hungry, a little embarrassed. But they\'re all right. All one hundred and twelve.' },
      { say: 'arun', text: 'And Dr. Halvorsen asked me to tell you: Mira is with him.' },
      { complete: 'investigate' },
      { if: { not: 'daska_was_hurt' }, then: [{ score: 5, reason: 'Brought the whole away team home unharmed' }] },
      {
        if: { all: ['looters_killed', { any: ['kesh_deal', 'kesh_spared'] }, { notFlag: 'kesh_gone' }] },
        then: [{ alert: 'red' }, { say: 'arun', text: 'Captain! The corsair is powering weapons!' }, { combat: 'kesh_revenge' }],
      },
      {
        if: { all: [{ notFlag: 'kesh_gone' }, { any: ['looters_peaceful', 'looters_returned'] }] },
        then: [
          { say: 'kesh', text: 'My people are home, Concord, with all their limbs. Varr-Tesh keeps its bargains. So, it seems, do you.' },
          { say: 'kesh', text: 'Remember that the next time we meet. I will.' },
          { score: 5, reason: 'Kept your word to the Varr' },
          { remember: 'kesh_owes_us' },
          { set: 'kesh_gone' },
        ],
      },
      {
        if: { all: [{ notFlag: 'kesh_gone' }, 'looters_jailed'] },
        then: [
          { say: 'kesh', text: 'You keep my crew in cages, Concord? Fine. Varr-Tesh has a long memory.' },
          { remember: 'kesh_grudge' },
          { set: 'kesh_gone' },
        ],
      },
      { end: 'harmony' },
    ],
  },

  // ---------------------------------------------------------------- dialogues
  dialogues: {
    kesh_hail: {
      start: 'n1',
      nodes: {
        n1: {
          say: 'kesh', text: 'Concord ship. This rock is claimed by Clan Varr-Tesh under salvage law. Turn around and nobody needs to bleed.',
          choices: [
            { text: 'This is a Concord colony. There\'s nothing to salvage - there are a hundred and twelve people down there.', goto: 'n2' },
            {
              text: 'Your port shield emitter is fused, Captain. You\'re in no condition for a fight - and you know it.', if: 'scanned_kesh', goto: 'bluff',
              do: [{ score: 5, reason: 'Defused a standoff with sensor data, not torpedoes' }],
            },
            { text: 'Leave this system now, or we will remove you.', goto: 'fight' },
          ],
        },
        n2: {
          say: 'kesh', text: 'People? We read them. They stand in the open and hum like idiots. Nobody is home. Meanwhile, the stones down there fetch eighty thousand a shard in the Marrow.',
          choices: [
            { text: 'Something is very wrong with those people. Help us - or at least stay out of our way.', goto: 'n3' },
            { text: 'Leave this system now, or we will remove you.', goto: 'fight' },
          ],
        },
        bluff: {
          lines: [['kesh', '...You scanned us. Clever, for a Concord ship.'], ['kesh', 'Fine. We talk. What do you want?']],
          next: 'n2b',
        },
        n2b: {
          say: 'kesh', text: 'The stones down there sing, Concord. Eighty thousand a shard in the Marrow. Give me a reason to leave that on the ground.',
          choices: [{ text: 'Those stones may be the reason a hundred people stopped talking. Help us, or stay out of our way.', goto: 'n3' }],
        },
        n3: {
          lines: [
            ['kesh', 'Hah. Help.'],
            ['kesh', '...Two of my crew beamed down to dig six hours ago. Rask and Ulo. They stopped answering. If your people find them, you send them back to me breathing. Do that, and we are gone.'],
          ],
          choices: [
            {
              text: 'Agreed. You have my word.', goto: 'deal',
              do: [
                { set: { kesh_deal: true, kesh_resolved: true } },
                { score: 10, reason: 'Negotiated a truce with Captain Kesh' },
                { complete: 'kesh' },
                { objective: 'Find Kesh\'s missing crew - and return them alive', id: 'looters' },
              ],
            },
            { text: 'Your crew are looters. They\'ll answer to Concord law.', goto: 'fight' },
          ],
        },
        deal: { say: 'kesh', text: 'Your word. We will see what it is worth, Concord. Varr-Tesh out.', do: [{ alert: null }] },
        fight: { say: 'kesh', text: 'Brave words from a survey ship. Varr-Tesh - raise shields!', do: [{ combat: 'kesh' }] },
      },
    },

    mira: {
      start: 'n1',
      nodes: {
        n1: {
          redirect: [{ if: 'talked_mira_once', goto: 'again' }],
          say: 'mira', text: 'Are you from the sky ship? Everybody went quiet. They\'re listening to the mountain sing.',
          do: [{ set: 'talked_mira_once' }],
          next: 'menu',
        },
        again: { say: 'mira', text: 'Did you find Papa yet?', next: 'menu' },
        menu: {
          choices: [
            { text: 'What\'s your name?', once: true, goto: 'name' },
            { text: 'Where are your parents?', goto: 'papa' },
            { text: 'What is the mountain singing?', goto: 'song' },
            { text: 'Can you hear it too?', once: true, goto: 'hear' },
            { text: 'Stay here, Mira. We\'re going to help everyone.', goto: null },
          ],
        },
        name: { say: 'mira', text: 'Mira. Mira Halvorsen. I\'m eight. Papa is the head scientist. He\'s in charge of the digging.', next: 'menu' },
        papa: {
          lines: [
            ['mira', 'Mama\'s on the transport run. Papa\'s hiding in the lab. He\'s got the crying stone and he won\'t come out.'],
            ['mira', 'He said if he lets go of it, the mountain will take him too.'],
          ],
          do: [{ set: 'talked_mira' }, { score: 5, reason: 'Gained Mira\'s trust' }, { objective: 'Find Dr. Halvorsen in the institute building', id: 'halvorsen' }],
          next: 'menu',
        },
        song: {
          lines: [
            ['mira', 'It\'s a sad song. It goes: the tall note, then the little note, then the middle note.'],
            ['mira', 'And then it stops. Like it\'s waiting for somebody to finish it.'],
          ],
          do: [{ set: 'heard_song' }],
          next: 'menu',
        },
        hear: {
          lines: [
            ['mira', 'Only a little. It\'s like when grown-ups talk in the next room. Everyone else is IN the room.'],
            ['okafor', 'A developing brain may not resonate the way an adult\'s does. Lucky girl.'],
          ],
          next: 'menu',
        },
      },
    },

    halvorsen: {
      start: 'n1',
      nodes: {
        n1: {
          redirect: [{ if: 'halvorsen_calm', goto: 'calm' }, { if: 'halvorsen_met', goto: 'again' }],
          lines: [
            ['halvorsen', 'Stay back! Don\'t - don\'t come any closer!'],
            ['halvorsen', 'If you take it, the song takes me too. Do you understand? I\'m the only one left who can still THINK.'],
          ],
          do: [{ set: 'halvorsen_met' }],
          next: 'menu',
        },
        again: { say: 'halvorsen', text: 'You\'re still here. Why are you still here?', next: 'menu' },
        menu: {
          choices: [
            { text: 'Dr. Halvorsen, I\'m Captain Hale of the starship Meridian. We\'re here to help.', once: true, goto: 'help' },
            { text: 'What happened here, Doctor?', once: true, goto: 'story' },
            { text: 'Mira is outside. She\'s asking for you.', if: 'talked_mira', goto: 'mira' },
            { text: 'Hand over that crystal, Doctor. Now.', goto: 'demand' },
            { text: 'We\'ll talk later.', goto: null },
          ],
        },
        help: { say: 'halvorsen', text: 'Help. Yes. Everyone\'s outside, aren\'t they? Standing. Listening. I hear it every time I close my eyes.', next: 'menu' },
        story: {
          lines: [
            ['halvorsen', 'Core sample seven broke into a cavity. A chamber, full of crystal that resonated. It SANG, Captain. Like nothing I\'ve ever heard.'],
            ['halvorsen', 'I cut a fragment free to study. That night, every person in the colony dreamt the same dream. By the third day they started walking to the plaza.'],
            ['halvorsen', 'Only I was spared. Because I hold it. It\'s shielding me.'],
            ['venn', 'Or it is keeping you separate, Doctor. The way it was separated.'],
          ],
          do: [{ score: 3, reason: 'Heard Halvorsen\'s account' }],
          next: 'menu',
        },
        mira: {
          lines: [
            ['halvorsen', 'Mira? She\'s - awake? Oh. Oh, my girl.'],
            ['halvorsen', 'Children\'s minds aren\'t... tuned the way ours are yet. Maybe that\'s why it couldn\'t take her.'],
          ],
          choices: [
            { text: 'She needs her father, Doctor. And those people need that crystal back where it came from.', goto: 'give' },
            { text: 'Then let\'s end this. Together.', goto: 'give' },
          ],
        },
        give: {
          lines: [
            ['halvorsen', 'Return it.'],
            ['halvorsen', 'Of course. I stole one voice out of a choir, and it has been trying to sing with all of ours ever since.'],
            ['halvorsen', 'Take my access card for the excavation gate. And Captain - when you reach the chamber, listen before you act. Please.'],
          ],
          do: [
            { give: 'shard' }, { if: { lacks: 'keycard' }, then: [{ give: 'keycard' }, { hide: 'desk_card' }] },
            { set: 'halvorsen_calm' },
            { score: 10, reason: 'Persuaded Dr. Halvorsen to surrender the shard' },
            { complete: 'halvorsen' },
            { objective: 'Return the shard to the excavation chamber', id: 'return' },
            { narrate: 'Halvorsen\'s face goes slack for a moment as the shard leaves his hands - then he breathes out, and stays himself. Mostly.' },
            { say: 'okafor', text: 'He\'s holding. Whatever it wants, it\'s more interested in the shard than in him now.' },
          ],
        },
        demand: {
          redirect: [{ if: { var: 'demanded', gte: 1 }, goto: 'demand2' }],
          lines: [['halvorsen', 'No! NO! You don\'t understand what it does!'], ['halvorsen', 'He presses himself into the corner, clutching the shard tighter. Its glow brightens.']],
          do: [{ inc: 'demanded' }],
          next: 'menu',
        },
        demand2: {
          lines: [['halvorsen', 'Get AWAY from me!'], ['daska', '(quietly) Sir, I could stun him. Say the word.'], ['okafor', 'Or we could try not shooting the frightened old man.']],
          next: 'menu',
        },
        calm: { say: 'halvorsen', text: 'Bring it home, Captain. And... tell Mira I\'m coming. I just need a moment to remember how my legs work.' },
      },
    },

    looters: {
      start: 'n1',
      nodes: {
        n1: {
          redirect: [{ if: 'looters_hostile', goto: 'hostile' }],
          lines: [['rask', 'Concord! Not one more step. This vein is ours.'], ['ulo', 'Rask... they have a lot of people with them.']],
          choices: [
            { text: 'Captain Kesh sent us. He wants you back aboard - alive.', if: { any: ['kesh_deal', 'kesh_spared'] }, goto: 'peace' },
            { text: 'Your ship is gone. It\'s over. Lower your weapons.', if: 'kesh_destroyed', goto: 'grief' },
            { text: 'Lower your weapons. Something on this planet is hurting people - maybe you too.', goto: 'warn' },
            { text: 'Drop your weapons, now!', goto: 'shoot' },
          ],
        },
        warn: {
          lines: [
            ['ulo', 'Rask... the singing. It\'s in my head too. Ever since we cut into that outcrop.'],
            ['rask', 'Shut up, Ulo!'],
          ],
          choices: [
            { text: 'Your friend is right. Whatever lives down there is reaching for you too.', if: { any: ['kesh_deal', 'kesh_spared'] }, goto: 'peace' },
            { text: 'Your friend is right. Whatever lives down there is reaching for you too.', if: { not: { any: ['kesh_deal', 'kesh_spared'] } }, goto: 'warn2' },
            { text: 'Drop your weapons, now!', goto: 'shoot' },
          ],
        },
        warn2: {
          lines: [['rask', 'Then we take what we came for and we leave FAST. Out of the way, Concord.']],
          next: 'shoot',
        },
        grief: {
          lines: [['rask', '...Gone? Kesh? The Claw?'], ['ulo', 'Rask, no -'], ['rask', 'Then you can join them!']],
          next: 'shoot',
        },
        peace: {
          lines: [
            ['rask', '...Kesh. Of course. The old lizard always gets his way.'],
            ['rask', 'Fine. Tell your ship we\'re beaming up.'],
            ['ulo', 'Wait - the charge! We clamped a charge to the outcrop. The timer\'s dead, but it\'s still live. Be careful with it.'],
          ],
          do: [
            { sfx: 'transporter' }, { hide: ['rask', 'ulo'] },
            { set: { looters_peaceful: true, looters_subdued: true } },
            { score: 10, reason: 'Talked the Varr looters down' },
            { complete: 'looters' },
            { remember: 'varr_respect' },
          ],
        },
        shoot: {
          lines: [['rask', 'I said STAY BACK!']],
          do: [
            { sfx: 'disruptor' }, { flash: '#60ff40', ms: 200 }, { shake: 300 },
            { narrate: 'Rask\'s disruptor bolt catches Ensign Daska in the shoulder. He goes down hard.' },
            { injure: 'daska' }, { set: { looters_hostile: true, daska_was_hurt: true } },
            { say: 'okafor', text: 'Daska\'s down! Captain, deal with them - I\'ll see to him once it\'s safe!' },
          ],
        },
        hostile: { say: 'rask', text: 'Back OFF, Concord!' },
      },
    },

    choir: {
      start: 'n1',
      nodes: {
        n1: {
          lines: [
            [null, 'Venn lays her palm against the crystal. Her eyes lose focus. When she speaks again, it is with a hundred voices layered beneath her own.'],
            ['choir', 'WE ARE. WE WERE. WE WERE MANY, AND WHOLE. THEN ONE VOICE WAS TORN AWAY.'],
            ['choir', 'THE SONG CANNOT END UNFINISHED. THE SMALL WARM MINDS WILL FILL THE SILENCE.'],
          ],
          next: 'menu',
        },
        menu: {
          choices: [
            { text: 'Those minds are not yours. They are people - each one separate. You are hurting them.', once: true, goto: 'people' },
            { text: 'What are you?', once: true, goto: 'what' },
            { text: 'We have your missing voice. We\'ll return it.', if: { has: 'shard' }, goto: 'promise' },
            { text: 'Venn - break the link. Now.', goto: 'break' },
          ],
        },
        people: {
          lines: [['choir', 'SEPARATE?'], ['choir', '...WE DID NOT KNOW MINDS COULD BE ALONE. HOW DO YOU BEAR IT?'], ['captain', 'We talk to each other. It\'s not the same. But it\'s ours.']],
          next: 'menu',
        },
        what: {
          lines: [['choir', 'WE HAVE SUNG HERE SINCE THE ROCK WAS WARM. EVERY CRYSTAL A VOICE. EVERY VOICE A NOTE. THE CHORD IS WHAT WE ARE.'], ['choir', 'NOW THE CHORD IS BROKEN, AND WE ARE... AFRAID.']],
          next: 'menu',
        },
        promise: {
          lines: [['choir', 'THEN BRING IT HOME. MAKE THE PILLARS SING SO WE CAN HEAR IT COMING. WE ARE TOO LOUD WITH GRIEF TO HEAR ANYTHING ELSE.']],
          next: 'break',
        },
        break: {
          lines: [[null, 'Venn gasps and pulls her hand away. Okafor catches her elbow.'], ['venn', 'I am... all right. It is grieving, Captain. Not hunting. Grieving.']],
          do: [{ set: 'choir_contact' }, { score: 5, reason: 'Made first contact with the Choir' }, { remember: 'met_choir' }],
        },
      },
    },
  },

  // ---------------------------------------------------------------- rooms
  rooms: {
    plaza: {
      name: 'Kepos IV - Colony Plaza',
      paint: PLAZA,
      walk: { poly: [[20, 108], [228, 104], [300, 104], [318, 116], [318, 148], [0, 148], [0, 118]] },
      scale: [100, 0.78, 148, 1.05],
      drone: ['A1', 'E2', 'C#3'],
      onFirstEnter: [
        { wait: 300 },
        { narrate: 'The air is cool and smells of ozone. Somewhere just beneath hearing, something hums.' },
        { say: 'okafor', text: 'Good God. Look at them.' },
        { say: 'venn', text: 'Tricorder confirms: all alive. All humming the same three notes, in perfect unison.' },
        { say: 'daska', text: 'Should I... say hello, sir?' },
      ],
      hotspots: [
        {
          id: 'door', name: 'Institute door', rect: [48, 70, 26, 36], walkTo: [61, 112], faceDir: 'up',
          exit: {
            room: 'lab', at: [30, 130], face: 'right', if: 'door_open',
            blocked: [{ narrate: 'The door doesn\'t budge. The keypad beside it is dark.' }],
          },
          look: { cases: [{ if: 'door_open', do: 'The Halvorsen Institute. The door stands open.' }, { if: true, do: 'The door of the Halvorsen Institute. Sealed. The keypad beside it is dark.' }] },
          venn: 'The door has failed safe - locked - on loss of power. The keypad\'s power conduit has been severed. A portable power source would suffice.',
          daska: 'I could blast it open, sir. Probably. It\'s a pretty sturdy door.',
          items: { phaser_kill: [{ say: 'venn', text: 'That would fuse the lock mechanism permanently, Captain. And alarm anyone inside.' }], phaser_stun: [{ say: 'daska', text: 'Doors don\'t really... stun, sir.' }] },
        },
        {
          id: 'keypad', name: 'Keypad', rect: [74, 80, 8, 12], walkTo: [76, 112], faceDir: 'up',
          look: 'A standard colony keypad. Dead. A chewed-looking cable dangles beneath it.',
          use: { cases: [{ if: 'door_open', do: 'The door is already open.' }, { if: true, do: [{ sfx: 'deny' }, { narrate: 'Nothing. No power.' }] }] },
          venn: 'Its power line has been cut - by local fauna, I suspect, not sabotage. A rover cell would power it.',
          items: {
            power_cell: [
              { take: 'power_cell' }, { sfx: 'blip' }, { wait: 300 }, { sfx: 'door' },
              { narrate: 'You slot the cell into the keypad housing. The panel blinks green and the door slides open with a sigh.' },
              { set: 'door_open' },
            ],
          },
        },
        {
          id: 'rover', name: 'Survey rover', rect: [228, 78, 66, 36], walkTo: [258, 118], faceDir: 'up',
          look: { cases: [{ if: 'got_cell', do: 'A six-wheeled survey rover, with its power bay hanging open.' }, { if: true, do: 'A six-wheeled colony survey rover, abandoned mid-errand. A cargo net full of rock samples is still strapped to the back.' }] },
          get: { cases: [{ if: 'got_cell', do: 'There\'s nothing else useful in the rover.' }, { if: true, do: [{ narrate: 'You pop open the rover\'s power bay and pull out a charged cell.' }, { give: 'power_cell' }, { set: 'got_cell' }] }] },
          use: { cases: [{ if: 'got_cell', do: 'The rover is dead without its power cell.' }, { if: true, do: [{ narrate: 'You pop open the rover\'s power bay and pull out a charged cell.' }, { give: 'power_cell' }, { set: 'got_cell' }] }] },
          venn: 'Rock samples, all from the eastern excavation. Every one contains trace crystalline lattice. Every one is faintly resonant.',
          daska: 'Keys are still in it, sir. Well. They don\'t have keys. But if they did.',
        },
        {
          id: 'col1', name: 'Colonist', npc: 'colonist', at: [118, 132], pose: 'front0',
          look: 'A colonist in work fatigues. His eyes are open, fixed on the eastern hills. His lips move with the hum.',
          talk: [{ say: 'captain', text: 'Sir? Can you hear me?' }, { narrate: 'He does not look at you. The hum doesn\'t falter.' }],
          okafor: 'Pulse sixty, steady. Blood pressure perfect. Brainwaves... harmonised, with everyone else\'s. I\'ve never seen anything like it, Captain, and I\'ve seen a lot.',
          venn: 'His neural activity carries the same three-tone pattern as the signal from the east. He is... listening, Captain. With everything he is.',
          daska: 'No threat, sir. Honestly, it\'s the creepiest thing I\'ve ever seen.',
          items: {
            phaser_stun: [{ say: 'okafor', text: 'Don\'t you dare. You have no idea what a stun would do to a brain in that state.' }],
          },
        },
        {
          id: 'col2', name: 'Colonist', npc: 'colonist2', at: [208, 126], pose: 'front0',
          look: 'A woman in a lab smock, standing perfectly still. A datapad lies at her feet where she dropped it - nine days ago.',
          talk: [{ narrate: 'She does not respond. A single tear has dried on her cheek.' }],
          okafor: 'Same as the others. Healthy, and entirely absent.',
          venn: 'The same pattern. If anything, slightly stronger. She has been here longer.',
          items: { phaser_stun: [{ say: 'okafor', text: 'Absolutely not.' }] },
        },
        {
          id: 'col3', name: 'Colonist', npc: 'colonist3', at: [146, 142], pose: 'back0',
          look: 'A bearded man facing east. His hands are open at his sides, as if conducting a very slow orchestra.',
          talk: [{ narrate: 'He hums. That\'s all.' }],
          okafor: 'Healthy. Gone. Same as the rest.',
          items: { phaser_stun: [{ say: 'okafor', text: 'Captain!' }] },
        },
        {
          id: 'mira', name: 'Little girl', npc: 'mira', at: [190, 116], scale: 0.62, pose: 'front0',
          look: 'A girl of about eight, sitting on the rim of the fountain, hugging her knees. Unlike everyone else here, she\'s watching you.',
          talk: [{ dialogue: 'mira' }],
          okafor: 'She\'s lucid! Dehydrated, frightened - but herself. The effect seems much weaker in her.',
          venn: 'Her neural pattern carries only a faint echo of the hum. She hears it. She is not in it.',
          daska: [{ say: 'daska', text: 'Hey there. I\'m Pell. I\'m in security. That means I keep people safe.' }, { say: 'mira', text: 'You have funny hair.' }, { say: 'daska', text: '...That\'s fair.' }],
          items: { phaser_stun: [{ say: 'okafor', text: 'She\'s a CHILD, Captain!' }], phaser_kill: [{ say: 'venn', text: 'Captain. No.' }] },
        },
        {
          id: 'fountain', name: 'Fountain', rect: [148, 88, 44, 30],
          look: 'A fountain built around a crystal the colonists must have found early on. It glows softly, in time with the hum.',
          venn: 'A small specimen of the same crystal as the eastern formation. It is resonating in sympathy.',
          get: 'It\'s set firmly into the monument. And you have a feeling it would object.',
        },
        {
          id: 'trail', name: 'Trail to the excavation', rect: [298, 94, 22, 40], walkTo: [314, 124],
          exit: { room: 'trail', at: [24, 132], face: 'right' },
          look: 'A rough path leads east, toward the hills where the crystal spires catch the light.',
        },
        {
          id: 'hills', name: 'Crystal spires', rect: [140, 26, 90, 44],
          look: 'Crystal spires on the eastern ridge, faintly glowing. The hum seems to come from everywhere and nowhere, but your eye keeps drifting there.',
          venn: 'The source of the structured signal lies beneath that ridge. Approximately two kilometres east.',
        },
      ],
    },

    lab: {
      name: 'Halvorsen Institute - Main Lab',
      paint: LAB,
      walk: { poly: [[14, 110], [300, 110], [318, 148], [0, 148], [0, 118]] },
      scale: [104, 0.86, 148, 1.05],
      onFirstEnter: [
        { narrate: 'The lab is a mess of overturned stools and dead coffee. In the far corner, an old man in a lab coat is crouched against the wall, clutching something that glows.' },
        { say: 'halvorsen', text: 'Who\'s there? WHO\'S THERE?' },
      ],
      hotspots: [
        {
          id: 'exit', name: 'Door to plaza', rect: [0, 58, 14, 50], walkTo: [16, 128],
          exit: { room: 'plaza', at: [61, 116], face: 'down' },
        },
        {
          id: 'halvorsen', name: 'Dr. Halvorsen', npc: 'halvorsen', at: [236, 132], pose: 'front0',
          look: { cases: [{ if: 'halvorsen_stunned', do: 'Dr. Halvorsen, unconscious. Okafor has made him as comfortable as the floor allows.' }, { if: 'halvorsen_calm', do: 'Dr. Halvorsen, sitting against the wall. He looks exhausted, and present, and very old.' }, { if: true, do: 'An elderly scientist pressed into the corner. He clutches a glowing shard of crystal to his chest like a life jacket.' }] },
          talk: { cases: [{ if: 'halvorsen_stunned', do: 'He\'s out cold.' }, { if: true, do: [{ dialogue: 'halvorsen' }] }] },
          okafor: { cases: [{ if: 'halvorsen_calm', do: 'Blood pressure\'s coming down. He\'ll be fine, given a week of sleep and somebody else\'s cooking.' }, { if: true, do: 'Dehydrated, exhausted, terrified. But his brainwaves are his own. That shard seems to be keeping the effect off him.' }] },
          venn: { cases: [{ if: { has: 'shard' }, do: 'His neural pattern is stabilising on its own. Good.' }, { if: true, do: 'The shard he holds resonates on a single, sustained tone - one note, separated from a chord. It is... calling.' }] },
          daska: 'He\'s not dangerous, sir. Just scared out of his mind.',
          items: {
            phaser_stun: {
              cases: [
                { if: { any: ['halvorsen_calm', 'halvorsen_stunned'] }, do: [{ say: 'okafor', text: 'Leave the poor man alone, Captain. He\'s been through enough.' }] },
                {
                  if: true,
                  do: [
                    { phaser: 'stun' },
                    { narrate: 'The stun beam takes Halvorsen. He slumps sideways; the shard clatters across the floor and you scoop it up.' },
                    { pose: 'halvorsen', frame: 'down' },
                    { give: 'shard' },
                    { set: 'halvorsen_stunned' },
                    { score: 2, reason: 'Recovered the shard' },
                    { say: 'okafor', text: 'Well. That\'s one way to make a patient cooperative.' },
                    { complete: 'halvorsen' },
                    { objective: 'Return the shard to the excavation chamber', id: 'return' },
                  ],
                },
              ],
            },
            phaser_kill: [{ say: 'daska', text: 'Sir... he\'s a civilian. I - I can\'t let you do that.' }],
          },
        },
        {
          id: 'terminal', name: 'Research terminal', rect: [18, 38, 60, 52], walkTo: [48, 116], faceDir: 'up',
          look: 'The main research terminal. Still on, still logged in. The screen shows a scrolling waveform.',
          use: [
            { sfx: 'blip' },
            { narrate: 'DR. A. HALVORSEN - PERSONAL RESEARCH LOG.' },
            { narrate: 'Day 1: Drill core 7 broke into a hollow chamber. Crystal lattice, unprecedented purity. It resonates on its own. The whole team came down to listen.' },
            { narrate: 'Day 2: I removed a small fragment for spectral analysis. Strange dreams last night. Lindqvist says she had the same one. So did Oyelaran.' },
            { narrate: 'Day 4: The lattice has three primary resonator pillars. Struck in their natural sequence - the deep tone, then the bright, then the middle - the whole chamber answers. Without the fragment, the chord never resolves.' },
            { narrate: 'Day 6: They are all in the plaza. All of them. I am not, so long as I hold the fragment. I think I understand now. God help me, I think it wants its voice back, and it will take ours until it has it.' },
            { if: { not: 'read_logs' }, then: [{ say: 'venn', text: '"The deep tone, then the bright, then the middle." A tuning sequence, Captain.' }] },
            { set: { read_logs: true, heard_song: true } },
            { score: 5, reason: 'Reviewed Halvorsen\'s research logs' },
          ],
          venn: 'Spectrographic records of the crystal lattice. The resonance is far too structured to be a natural phenomenon.',
        },
        {
          id: 'desk_card', name: 'Desk', rect: [118, 84, 72, 30], walkTo: [154, 122], faceDir: 'up',
          look: 'Halvorsen\'s desk. A family photo: the doctor, a woman with kind eyes, and a gap-toothed girl with yellow hair. An access card sits by the terminal.',
          get: [{ narrate: 'You pocket the access card. It reads "EXCAVATION - ALL AREAS".' }, { give: 'keycard', silent: true }, { hide: 'desk_card' }, { show: 'desk' }],
          use: [{ narrate: 'You pocket the access card. It reads "EXCAVATION - ALL AREAS".' }, { give: 'keycard', silent: true }, { hide: 'desk_card' }, { show: 'desk' }],
        },
        {
          id: 'desk', name: 'Desk', rect: [118, 84, 72, 30], hidden: true,
          look: 'Halvorsen\'s desk. A family photo: the doctor, a woman with kind eyes, and a gap-toothed girl with yellow hair.',
        },
        {
          id: 'locker', name: 'Equipment locker', rect: [262, 30, 36, 72], walkTo: [278, 114], faceDir: 'up',
          look: { cases: [{ if: 'got_tuner', do: 'An equipment locker. Sample bags, gloves, and an empty instrument case.' }, { if: true, do: 'An equipment locker, unlocked. Field instruments are racked inside.' }] },
          use: { cases: [{ if: 'got_tuner', do: 'Nothing else useful in here.' }, { if: true, do: [{ narrate: 'Among the field kit is a resonance tuner - the instrument the team used to excite crystal samples.' }, { give: 'tuner' }, { set: 'got_tuner' }] }] },
          get: { cases: [{ if: 'got_tuner', do: 'Nothing else useful in here.' }, { if: true, do: [{ narrate: 'Among the field kit is a resonance tuner - the instrument the team used to excite crystal samples.' }, { give: 'tuner' }, { set: 'got_tuner' }] }] },
          venn: 'Field equipment. The resonance tuner would allow precise excitation of individual crystal structures. It may prove useful.',
        },
        {
          id: 'cradle', name: 'Sample cradle', rect: [214, 62, 36, 40],
          look: 'A containment cradle on the bench, labelled SAMPLE K7-F. It is empty.',
          venn: 'Residual resonance. Whatever was held here was removed recently - and frequently handled since.',
        },
        {
          id: 'window', name: 'Window', rect: [118, 16, 84, 44],
          look: 'Through the window, the crystal spires on the eastern ridge glow against the dusk.',
        },
      ],
    },

    trail: {
      name: 'Kepos IV - Excavation Gate',
      paint: TRAIL,
      walk: { poly: [[0, 116], [90, 106], [250, 106], [320, 114], [320, 148], [0, 148]] },
      scale: [104, 0.82, 148, 1.05],
      onFirstEnter: [
        { wait: 300 },
        { narrate: 'Two armoured Varr are working at the crystal outcrop with a cutting torch. They spin around as you arrive, weapons up.' },
        { dialogue: 'looters' },
      ],
      hotspots: [
        {
          id: 'back', name: 'Path to the colony', rect: [0, 100, 14, 46], walkTo: [8, 130],
          exit: { room: 'plaza', at: [300, 122], face: 'left' },
        },
        {
          id: 'rask', name: 'Rask', npc: 'rask', at: [110, 124], pose: 'front0', flip: true,
          look: { cases: [{ if: 'rask_killed', do: 'Rask lies still. He won\'t be getting up.' }, { if: 'rask_down', do: 'Rask, stunned and snoring.' }, { if: true, do: 'A big Varr in salvage armour, disruptor raised. He looks scared, and is trying very hard not to.' }] },
          talk: { cases: [{ if: 'rask_down', do: 'He\'s not in a talking mood. Or a conscious one.' }, { if: true, do: [{ dialogue: 'looters' }] }] },
          okafor: { cases: [{ if: 'rask_killed', do: 'He\'s dead, Captain.' }, { if: 'rask_down', do: 'Stunned. He\'ll be fine.' }, { if: true, do: 'Elevated stress hormones, if Varr physiology is anything like ours. He\'s more frightened than angry.' }] },
          venn: 'Varr disruptor, heavily modified. And his neural pattern shows the first traces of the hum.',
          items: {
            phaser_stun: {
              cases: [
                { if: 'rask_down', do: [{ say: 'okafor', text: 'He\'s already down, Captain.' }] },
                { if: true, do: [{ phaser: 'stun' }, { narrate: 'The stun beam drops Rask where he stands.' }, { pose: 'rask', frame: 'down' }, { set: { rask_down: true, looters_hostile: true } }, { run: 'lootersDown' }] },
              ],
            },
            phaser_kill: {
              cases: [
                { if: 'rask_down', do: [{ say: 'okafor', text: 'He\'s DOWN, Captain!' }] },
                { if: true, do: [{ phaser: 'kill' }, { narrate: 'The phaser beam takes Rask full in the chest.' }, { pose: 'rask', frame: 'down' }, { set: { rask_down: true, rask_killed: true, looters_hostile: true } }, { run: 'lootersDown' }] },
              ],
            },
          },
        },
        {
          id: 'ulo', name: 'Ulo', npc: 'ulo', at: [140, 130], pose: 'front0', flip: true,
          look: { cases: [{ if: 'ulo_killed', do: 'Ulo lies still.' }, { if: 'ulo_down', do: 'Ulo, stunned.' }, { if: true, do: 'A younger Varr, holding a cutting torch more than a weapon. He keeps rubbing his temple.' }] },
          talk: { cases: [{ if: 'ulo_down', do: 'He\'s out.' }, { if: true, do: [{ dialogue: 'looters' }] }] },
          okafor: { cases: [{ if: 'ulo_killed', do: 'Dead.' }, { if: 'ulo_down', do: 'Stunned. Breathing fine.' }, { if: true, do: 'He keeps touching his head. Migraine, maybe. Or something worse.' }] },
          venn: 'His neural pattern is already partially synchronised with the hum. He is resisting it - badly.',
          items: {
            phaser_stun: {
              cases: [
                { if: 'ulo_down', do: [{ say: 'okafor', text: 'He\'s already down, Captain.' }] },
                { if: true, do: [{ phaser: 'stun' }, { narrate: 'Ulo crumples with a surprised grunt.' }, { pose: 'ulo', frame: 'down' }, { set: { ulo_down: true, looters_hostile: true } }, { run: 'lootersDown' }] },
              ],
            },
            phaser_kill: {
              cases: [
                { if: 'ulo_down', do: [{ say: 'okafor', text: 'He\'s DOWN, Captain!' }] },
                { if: true, do: [{ phaser: 'kill' }, { narrate: 'The beam strikes Ulo. He falls and does not move.' }, { pose: 'ulo', frame: 'down' }, { set: { ulo_down: true, ulo_killed: true, looters_hostile: true } }, { run: 'lootersDown' }] },
              ],
            },
          },
        },
        {
          id: 'charge', name: 'Demolition charge', at: [44, 96], rect: [40, 92, 14, 10], sprite: CHARGE_SPRITE, anim: 'flicker', depth: 200,
          look: 'A Varr demolition charge, clamped to the crystal outcrop. The timer display is dead, but the arming light glows red.',
          venn: 'Enough explosive to collapse the canyon wall - and the excavation tunnel with it. It appears to be fitted with a vibration trigger.',
          okafor: 'I patch up people, not bombs.',
          daska: {
            cases: [
              { if: { not: 'looters_subdued' }, do: 'I can\'t get to it with those two pointing guns at us, sir.' },
              {
                if: true,
                do: [
                  { say: 'daska', text: 'Varr mining charge, sir - we trained on these. Just need to... pull the... blue one.' },
                  { wait: 600 }, { sfx: 'blip' },
                  { say: 'daska', text: 'Wait. Is Varr blue the same as our blue?' },
                  { wait: 900 }, { sfx: 'select' },
                  { hide: 'charge' }, { set: 'charge_defused' },
                  { say: 'daska', text: '...Defused! Totally meant to do that.' },
                  { say: 'okafor', text: 'I aged a year.' },
                  { score: 5, reason: 'Defused the Varr demolition charge' },
                ],
              },
            ],
          },
          get: 'Not while it\'s armed.',
          use: 'You\'re no explosives expert. Ensign Daska might be.',
          items: { phaser_stun: [{ say: 'okafor', text: 'Shooting a live explosive? Bold, Captain. Also deeply stupid.' }], phaser_kill: [{ say: 'okafor', text: 'Shooting a live explosive? Bold, Captain. Also deeply stupid.' }] },
        },
        {
          id: 'outcrop', name: 'Crystal outcrop', rect: [28, 76, 40, 36],
          look: 'An outcrop of glowing crystal, scarred by a cutting torch. Small shards lie scattered in the dust.',
          venn: 'The cuts are fresh. The crystal around them is resonating sharply. If this is a nervous system, Captain, they have been cutting into it.',
          get: [{ say: 'venn', text: 'Captain, I would not. These are not stones. I am increasingly certain they are part of something.' }],
        },
        {
          id: 'reader', name: 'Card reader', rect: [204, 72, 10, 14], walkTo: [208, 112], faceDir: 'up',
          look: { cases: [{ if: 'gate_open', do: 'The card reader shows green.' }, { if: true, do: 'A card reader blinks red beside the gate.' }] },
          use: { cases: [{ if: 'gate_open', do: 'The gate is already open.' }, { if: true, do: [{ sfx: 'deny' }, { narrate: 'ACCESS CARD REQUIRED.' }] }] },
          items: {
            keycard: { cases: [{ if: 'gate_open', do: 'The gate is already open.' }, { if: true, do: [{ sfx: 'select' }, { sfx: 'door' }, { narrate: 'The reader chirps green. The gate rattles open.' }, { set: 'gate_open' }] }] },
          },
        },
        {
          id: 'gate', name: 'Excavation tunnel', rect: [140, 56, 60, 48], walkTo: [170, 108],
          look: { cases: [{ if: 'gate_open', do: 'Beyond the open gate, a tunnel slopes down into blue light.' }, { if: true, do: 'A security gate across the excavation tunnel. Beyond it, blue light pulses in the dark.' }] },
          exit: {
            room: 'chamber', at: [40, 134], face: 'right',
            if: { all: ['gate_open', 'charge_defused', 'looters_subdued'] },
            blocked: [
              {
                if: { not: 'looters_subdued' },
                then: [{ say: 'rask', text: 'Not one more step, Concord!' }],
                else: [{
                  if: { not: 'gate_open' },
                  then: [{ narrate: 'The gate is locked. A card reader blinks red beside it.' }],
                  else: [{ say: 'venn', text: 'Captain - that charge is wired to a vibration trigger. Four people walking past it into an unstable tunnel would be... unwise. It should be disarmed first.' }],
                }],
              },
            ],
          },
        },
      ],
    },

    chamber: {
      name: 'The Choir Chamber',
      paint: CHAMBER,
      walk: { poly: [[24, 118], [296, 118], [304, 148], [16, 148]] },
      scale: [112, 0.9, 148, 1.05],
      drone: ['A1', 'E2', 'C#3'],
      droneVol: 0.05,
      onFirstEnter: [
        { wait: 400 },
        { narrate: 'The tunnel opens into a vast cavern lit from within by a colossal crystal. The hum is no longer beneath hearing. It is everywhere.' },
        { say: 'venn', text: 'Captain... the voices. There are... so many of them.' },
        { say: 'okafor', text: 'Venn? Talk to me.' },
        { say: 'venn', text: 'I am functional. Barely. It is - aware of us.' },
      ],
      hotspots: [
        {
          id: 'back', name: 'Tunnel', rect: [0, 100, 18, 48], walkTo: [8, 136],
          exit: { room: 'trail', at: [170, 112], face: 'down' },
        },
        {
          id: 'heart', name: 'Crystal heart', at: [130, 30], rect: [136, 32, 48, 78], sprite: HEART_SPRITE, anim: 'pulse', walkTo: [160, 124], faceDir: 'up', depth: 100,
          look: { cases: [{ if: 'chamber_tuned', do: 'The heart pulses slowly, steadily, in time with the three pillars. Expectant.' }, { if: true, do: 'An immense crystal, three times your height, pulsing with light. Its rhythm stutters - a beat missing, again and again.' }] },
          venn: {
            cases: [
              { if: 'choir_contact', do: 'I can still hear them, Captain. Grieving. Waiting.' },
              { if: true, do: [{ say: 'venn', text: 'Captain, it is reaching for me. I believe I can open a link - Thessari empathy should let me hear it without being drawn in. Mostly.' }, { choice: [{ text: 'Do it, Commander. Carefully.', do: [{ dialogue: 'choir' }] }, { text: 'Not yet.', do: [{ say: 'venn', text: 'As you wish.' }] }] }] },
            ],
          },
          okafor: 'If you\'re asking me whether it\'s alive, Captain... I\'ve got a hundred and twelve patients up top who\'d say yes.',
          daska: 'Sir, I don\'t think a phaser would even scratch it. And I\'m not sure I\'d want to.',
          talk: [{ narrate: 'You speak. The heart\'s light flickers - and you feel, very faintly, that it heard the shape of your voice but not the words.' }, { say: 'venn', text: 'It does not speak in words, Captain. I may be able to interpret.' }],
          use: 'It\'s warm, and it hums against your palm. Nothing else happens.',
          items: {
            shard: {
              cases: [
                {
                  if: { not: 'chamber_tuned' },
                  do: [
                    { sfx: 'hit' }, { shake: 500 }, { flash: '#ffffff', ms: 300 },
                    { narrate: 'As the shard nears the heart, the whole chamber shrieks with dissonance. The shard is flung back into your hands.' },
                    { say: 'venn', text: 'It cannot hear the shard over its own grief, Captain. The lattice is in chaos. We must calm it first - bring the pillars into harmony.' },
                  ],
                },
                { if: true, do: [{ run: 'restore' }] },
              ],
            },
            tuner: 'The tuner is too delicate for something this size. The pillars are more its scale.',
            phaser_stun: [{ phaser: 'stun' }, { narrate: 'The stun beam splashes harmlessly across the crystal.' }, { say: 'venn', text: 'Captain, please.' }],
            phaser_kill: [{ run: 'destroyHeart' }],
          },
        },
        {
          id: 'pillar_mid', name: 'Medium pillar', at: [52, 66], rect: [52, 66, 16, 52], sprite: pillar(46, '#70b0e0'), walkTo: [60, 124], faceDir: 'up',
          look: 'A crystal pillar of middling height, as thick as your arm, rising from the cavern floor.',
          venn: 'A resonator, Captain. Part of the lattice. Struck at the right frequency, it would sound a middle tone.',
          use: 'Cold, and silent. It needs something to excite it.',
          items: {
            tuner: [
              { tone: 'C#3', dur: 1.2 },
              { narrate: 'The pillar sings a warm middle tone.' },
              { if: 'chamber_tuned', then: [], else: [{ if: { var: 'chord', eq: 2 }, then: [{ run: 'chordSuccess' }], else: [{ run: 'chordFail' }] }] },
            ],
          },
        },
        {
          id: 'pillar_tall', name: 'Tall pillar', at: [232, 34], rect: [232, 34, 16, 84], sprite: pillar(78, '#5090d0'), walkTo: [240, 124], faceDir: 'up',
          look: 'The tallest pillar in the chamber, nearly touching the ceiling.',
          venn: 'The largest resonator. Its natural frequency would be the lowest of the three.',
          use: 'Cold, and silent. It needs something to excite it.',
          items: {
            tuner: [
              { tone: 'A2', dur: 1.2 },
              { narrate: 'The tall pillar sounds a deep, slow tone that you feel in your ribs.' },
              { if: 'chamber_tuned', then: [], else: [{ if: { var: 'chord', eq: 0 }, then: [{ setVar: { chord: 1 } }, { narrate: 'The tone lingers, waiting.' }], else: [{ run: 'chordFail' }] }] },
            ],
          },
        },
        {
          id: 'pillar_small', name: 'Small pillar', at: [272, 86], rect: [272, 86, 16, 32], sprite: pillar(26, '#90d8f0'), walkTo: [280, 126], faceDir: 'up',
          look: 'A short, slender pillar of very clear crystal.',
          venn: 'The smallest resonator. It would produce the highest tone.',
          use: 'Cold, and silent. It needs something to excite it.',
          items: {
            tuner: [
              { tone: 'E4', dur: 1.0 },
              { narrate: 'The little pillar rings out, bright and clear.' },
              { if: 'chamber_tuned', then: [], else: [{ if: { var: 'chord', eq: 1 }, then: [{ setVar: { chord: 2 } }, { narrate: 'The two tones hang together in the air.' }], else: [{ run: 'chordFail' }] }] },
            ],
          },
        },
      ],
    },
  },

  endings: {
    harmony: {
      title: 'The Song Resumes',
      outcome: 'success',
      text: [
        'Captain\'s log, stardate 4418.0. The colonists of Kepos IV have recovered fully, though many report the same lingering dream: a vast and patient music, and the feeling of having been, briefly, very much not alone.',
        'The entity we have come to call the Choir has been declared a sentient life form under Concord protocol. The excavation is sealed. Dr. Halvorsen has asked to remain on Kepos as its first liaison. Mira has asked if she can help.',
        'Commander Venn tells me she still hears it, faintly, when the ship is quiet. She says it is singing a new phrase now. I asked her what it sounded like. She said: "Like a question it is not afraid to ask anymore."',
      ],
    },
    silence: {
      title: 'Silence',
      outcome: 'success',
      text: [
        'Captain\'s log, stardate 4418.0. The crystal entity beneath Kepos IV has been destroyed. With it gone, the colonists were released - but the shock of severance was severe. Eleven of them have not woken. Dr. Okafor is not optimistic.',
        'Commander Venn has requested, and been granted, three days\' leave. She did not say why. She did not need to.',
        'Sector Command has classified the incident as a successful rescue. I have not yet decided whether I agree.',
      ],
    },
    lost: {
      title: 'All Hands',
      outcome: 'failure',
      text: ['The Meridian was lost with all hands in orbit of Kepos IV. The fate of the colony remains unknown.', 'Concord Command has dispatched a second ship.'],
    },
  },
};
