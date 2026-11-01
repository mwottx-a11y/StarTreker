// The recurring cast of the starship Meridian. Every mission module shares
// these characters; missions reference them by id ('captain', 'venn', ...).
//
// Missions may define their own NPCs with the same shape under `characters`.

export const SHIP = {
  name: 'Meridian',
  registry: 'CES Meridian (CX-0417)',
  service: 'Concord Exploratory Service',
};

const GOLD = '#d8a830', TEAL = '#2e8f9a', WHITE = '#c8d4dc', RED = '#b83a30';
const INSIGNIA = '#f8e070';

export const CREW = {
  captain: {
    name: 'Captain Rowan Hale',
    short: 'Hale',
    color: 0xf0c850,
    role: 'Commanding Officer',
    look: { skin: '#d8a888', hair: '#5a3a20', uniform: GOLD, trim: '#1a1a1a', insignia: INSIGNIA, pants: '#20222c' },
    bio: 'Twenty years in the Service. Believes there is always one more option nobody has tried yet.',
  },
  venn: {
    name: 'Lt. Commander Ixa Venn',
    short: 'Venn',
    color: 0x70d0e0,
    role: 'Science Officer',
    look: {
      skin: '#a8b8c8', hair: '#d8dce8', hairStyle: 'bun', uniform: TEAL, trim: '#102028', insignia: INSIGNIA,
      pants: '#20222c', features: ['markings'], markColor: '#f0f4ff', eyes: '#5040a0',
    },
    bio: 'A Thessari. Her people perceive emotion as a faint harmonic; she considers this "an inconvenience, mostly."',
  },
  okafor: {
    name: 'Dr. Bram Okafor',
    short: 'Okafor',
    color: 0xe8e8f8,
    role: 'Chief Medical Officer',
    look: {
      skin: '#6a4430', hair: '#a8a8a8', hairStyle: 'short', uniform: WHITE, trim: '#3080a0', insignia: INSIGNIA,
      pants: '#30343c', features: ['beard', 'old'], beard: '#b8b8b8',
    },
    bio: 'Former frontier field surgeon. Distrusts anything that hums.',
  },
  daska: {
    name: 'Ensign Pell Daska',
    short: 'Daska',
    color: 0xff8070,
    role: 'Security',
    look: { skin: '#e8c0a0', hair: '#c86028', hairStyle: 'crest', uniform: RED, trim: '#2a0a08', insignia: INSIGNIA, pants: '#20222c' },
    bio: 'Eight months out of the Academy. Eager. Statistically unlucky.',
  },
  // Bridge-only crew
  sato: {
    name: 'Lt. Mika Sato', short: 'Sato', color: 0xf0c850, role: 'Helm',
    look: { skin: '#e8c8a8', hair: '#181818', hairStyle: 'long', uniform: GOLD, trim: '#1a1a1a', insignia: INSIGNIA },
  },
  arun: {
    name: 'Lt. Dev Arun', short: 'Arun', color: 0xff9080, role: 'Communications',
    look: { skin: '#9a6a48', hair: '#141010', hairStyle: 'short', uniform: RED, trim: '#2a0a08', insignia: INSIGNIA, features: ['glasses'] },
  },
  brandt: {
    name: 'Chief Wren Brandt', short: 'Brandt', color: 0xff9080, role: 'Chief Engineer',
    look: { skin: '#f0d0b8', hair: '#e0c060', hairStyle: 'bun', uniform: RED, trim: '#2a0a08', insignia: INSIGNIA, features: ['scar'] },
  },
  thorne: {
    name: 'Admiral Iona Thorne', short: 'Thorne', color: 0xd0d0ff, role: 'Sector Command',
    look: { skin: '#c89878', hair: '#e8e8e8', hairStyle: 'short', uniform: '#4a4a6a', trim: '#c8a838', insignia: '#ffffff', features: ['old'], bg: '#202040' },
  },
  computer: {
    name: 'Computer', short: 'Computer', color: 0x90c0ff, role: 'Ship computer', portrait: false,
  },

  // Recurring guest characters. Any mission may use them; their history with
  // the crew is tracked through profile memories (e.g. 'kesh_owes_us').
  kesh: {
    name: 'Captain Kesh Varr-Tesh', short: 'Kesh', color: 0x90d070, role: 'Varr corsair captain',
    look: { skin: '#7a8a58', hair: '#2a2018', hairStyle: 'crest', uniform: '#5a3a2a', trim: '#c8a040', features: ['ridges', 'tusks', 'armor', 'scar'], bg: '#2a1810', eyes: '#c04020' },
  },
  halvorsen: {
    name: 'Dr. Anselm Halvorsen', short: 'Halvorsen', color: 0xd8d8b0, role: 'Xenogeologist, Kepos IV',
    look: { skin: '#e0b8a0', hair: '#c8c0b0', hairStyle: 'short', uniform: '#d8d8d0', trim: '#506070', pants: '#404450', features: ['glasses', 'old', 'robe'], bg: '#202830' },
  },
};

// Away-team members who follow the captain and can be "used" on hotspots.
export const AWAY_TEAM = ['venn', 'okafor', 'daska'];

// What each away-team specialist does when you click them on a hotspot,
// and which hotspot field supplies the response if the mission gives one.
export const SPECIALTY = {
  venn: { verb: 'Scan', label: 'SCAN', field: 'scan', sfx: 'scan' },
  okafor: { verb: 'Examine', label: 'MED', field: 'med', sfx: 'scan' },
  daska: { verb: 'Assess', label: 'SEC', field: 'sec', sfx: 'blip' },
};

// Fallback lines when a mission doesn't script a response. Keeps the cast
// in character even on objects a mission author never anticipated.
export const FALLBACK = {
  look: ['Nothing unusual.', 'I see nothing remarkable about it.'],
  use: ['That doesn\'t seem to do anything.', 'I can\'t think how to use that.'],
  get: ['I don\'t need that.', 'Better to leave it where it is.'],
  talk: ['There\'s no response.'],
  item: ['That won\'t work.', 'I don\'t think those go together.'],
  venn: ['My tricorder registers nothing of consequence, Captain.', 'Readings are within expected parameters. Unremarkable.'],
  okafor: ['I\'m a doctor, Captain, and that is not a patient.', 'Nothing medically interesting there.'],
  daska: ['No threat I can see, sir.', 'Looks secure to me, Captain.'],
  phaserStunLiving: ['Captain, there\'s no reason to fire on them.'],
  phaserKill: ['Captain, I must object.', 'Belay that thought - it\'s not worth it.'],
  injured: ['{name} is in no condition to do that.'],
};

export function pick(list, seed = Math.random()) {
  return list[Math.floor(seed * list.length) % list.length];
}

// Standard away-team kit given at the start of every mission unless the
// mission overrides `startInventory`.
export const STANDARD_KIT = ['phaser_stun', 'phaser_kill'];

export const STANDARD_ITEMS = {
  phaser_stun: {
    name: 'Phaser (stun)', icon: 'phaser', color: '#60c0ff',
    desc: 'Type-2 hand phaser, set to stun. Non-lethal.',
  },
  phaser_kill: {
    name: 'Phaser (kill)', icon: 'phaser', color: '#ff5040',
    desc: 'Type-2 hand phaser, set to kill. Command will want a very good reason.',
  },
};
