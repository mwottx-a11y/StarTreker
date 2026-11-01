import { validateMission } from './validate.js';

/**
 * Mission registry.
 *
 * Two ways to add a mission, neither of which touches engine code:
 *  1. Bundled: drop a folder in src/missions/<id>/ with a mission.js that
 *     default-exports the mission object. It is discovered automatically.
 *  2. External: put a mission .json file in public/missions/ and list it in
 *     public/missions/manifest.json. It is fetched at startup, so missions
 *     can be released (or hot-swapped on a server) without rebuilding.
 */

const bundled = import.meta.glob('../missions/*/mission.js', { eager: true });

const registry = new Map();
const problems = [];

function register(m, source) {
  const { errors, warnings } = validateMission(m);
  warnings.forEach((w) => console.warn(w));
  if (errors.length) {
    errors.forEach((e) => console.error(e));
    problems.push({ source, errors });
    return;
  }
  m.source = source;
  registry.set(m.id, m);
}

export async function loadMissions() {
  registry.clear();
  problems.length = 0;
  for (const [path, mod] of Object.entries(bundled)) register(mod.default, path);
  try {
    const res = await fetch('missions/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const manifest = await res.json();
      for (const file of manifest.missions || []) {
        try {
          const r = await fetch(`missions/${file}`, { cache: 'no-cache' });
          register(await r.json(), file);
        } catch (e) {
          problems.push({ source: file, errors: [String(e)] });
        }
      }
    }
  } catch { /* no external missions */ }
  return listMissions();
}

export function listMissions() {
  return [...registry.values()].sort((a, b) => (a.episode ?? 99) - (b.episode ?? 99));
}
export const getMission = (id) => registry.get(id);
export const loadProblems = () => problems;
