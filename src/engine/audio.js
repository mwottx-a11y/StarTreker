// Tiny WebAudio synthesiser: every sound effect is generated, so the game and
// its mission modules need no audio files. Missions can trigger any of these
// by name with the `sfx` action, or play notes with `tone`.

let ctx = null;
let master = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.35; }
export function isMuted() { return muted; }

function osc(type, freq, t0, dur, vol = 0.3, freqEnd = null, dest = null) {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(t0, dur, vol = 0.3, filterFreq = 1200) {
  const c = ac(); if (!c || muted) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0);
}

const SFX = {
  blip(t) { osc('square', 880, t, 0.05, 0.12); },
  select(t) { osc('square', 660, t, 0.05, 0.12); osc('square', 990, t + 0.05, 0.06, 0.12); },
  deny(t) { osc('square', 220, t, 0.12, 0.15); osc('square', 180, t + 0.1, 0.15, 0.15); },
  chirp(t) { [1200, 1600, 2000].forEach((f, i) => osc('sine', f, t + i * 0.05, 0.06, 0.15)); },
  phaser(t) { osc('sawtooth', 1400, t, 0.45, 0.12, 300); osc('square', 700, t, 0.45, 0.06, 200); },
  handphaser(t) { osc('sawtooth', 2200, t, 0.3, 0.1, 900); },
  torpedo(t) { osc('sine', 300, t, 0.6, 0.25, 1800); noise(t, 0.3, 0.1, 3000); },
  disruptor(t) { osc('square', 300, t, 0.3, 0.15, 90); noise(t, 0.2, 0.1, 800); },
  hit(t) { noise(t, 0.35, 0.35, 900); osc('square', 120, t, 0.3, 0.2, 40); },
  explosion(t) { noise(t, 1.2, 0.5, 600); osc('sine', 90, t, 1.0, 0.4, 25); },
  shieldhit(t) { osc('triangle', 500, t, 0.3, 0.2, 1500); noise(t, 0.15, 0.1, 4000); },
  door(t) { noise(t, 0.35, 0.18, 2500); osc('sine', 300, t, 0.3, 0.08, 600); },
  transporter(t) {
    for (let i = 0; i < 14; i++) osc('sine', 1800 + Math.sin(i) * 500 + i * 60, t + i * 0.08, 0.25, 0.05);
    noise(t, 1.4, 0.06, 6000);
  },
  warp(t) { osc('sawtooth', 60, t, 1.8, 0.15, 900); noise(t + 1.2, 0.6, 0.2, 5000); },
  alert(t) { for (let i = 0; i < 3; i++) osc('square', 520, t + i * 0.5, 0.35, 0.12, 760); },
  pickup(t) { osc('square', 520, t, 0.07, 0.12); osc('square', 780, t + 0.07, 0.07, 0.12); osc('square', 1040, t + 0.14, 0.1, 0.12); },
  success(t) { [523, 659, 784, 1046].forEach((f, i) => osc('triangle', f, t + i * 0.12, 0.3, 0.18)); },
  fail(t) { [392, 349, 311, 262].forEach((f, i) => osc('triangle', f, t + i * 0.16, 0.35, 0.18)); },
  hum(t) { osc('sine', 110, t, 2.0, 0.12); osc('sine', 165, t, 2.0, 0.08); osc('sine', 220.5, t, 2.0, 0.05); },
  scan(t) { for (let i = 0; i < 6; i++) osc('sine', 900 + i * 140, t + i * 0.07, 0.08, 0.08); },
  stun(t) { osc('sawtooth', 1600, t, 0.35, 0.08, 2600); osc('sine', 400, t, 0.35, 0.08, 800); },
};

export function sfx(name) {
  const c = ac(); if (!c || muted) return;
  const f = SFX[name];
  if (f) f(c.currentTime + 0.01);
}

/** Play a musical note (Hz or note name like 'A3'). */
export function tone(note, dur = 0.8, type = 'sine') {
  const c = ac(); if (!c || muted) return;
  const f = typeof note === 'number' ? note : noteFreq(note);
  osc(type, f, c.currentTime + 0.01, dur, 0.22);
  osc('sine', f * 2, c.currentTime + 0.01, dur * 0.8, 0.06);
}

export function noteFreq(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  if (!m) return 440;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (base + (parseInt(m[3], 10) - 4) * 12) / 12);
}

// Simple generative ambient drone for atmosphere (optional per scene).
let droneNodes = null;
export function startDrone(notes = ['A2', 'E3'], vol = 0.04) {
  stopDrone();
  const c = ac(); if (!c) return;
  const g = c.createGain(); g.gain.value = muted ? 0 : vol; g.connect(master);
  const oscs = notes.map((n, i) => {
    const o = c.createOscillator(); o.type = i ? 'triangle' : 'sine';
    o.frequency.value = noteFreq(n);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.1 + i * 0.07;
    const lg = c.createGain(); lg.gain.value = 1.5; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g); o.start(); lfo.start();
    return [o, lfo];
  });
  droneNodes = { g, oscs };
}
export function stopDrone() {
  if (!droneNodes) return;
  const c = ac();
  droneNodes.g.gain.setTargetAtTime(0, c.currentTime, 0.3);
  const n = droneNodes; droneNodes = null;
  setTimeout(() => n.oscs.forEach(([o, l]) => { o.stop(); l.stop(); }), 1500);
}
