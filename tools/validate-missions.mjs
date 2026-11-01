#!/usr/bin/env node
// Validates every bundled mission (src/missions/*/mission.js) and every
// external mission listed in public/missions/manifest.json.
//   npm run validate
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateMission } from '../src/engine/validate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const report = (name, m) => {
  const { errors, warnings } = validateMission(m);
  warnings.forEach((w) => console.warn('  warn:', w));
  if (errors.length) { failed++; console.error(`✗ ${name}`); errors.forEach((e) => console.error('   ', e)); }
  else console.log(`✓ ${name} (${Object.keys(m.rooms).length} rooms, ${Object.keys(m.dialogues || {}).length} dialogues)`);
};

const bundledDir = join(root, 'src/missions');
for (const d of readdirSync(bundledDir)) {
  const f = join(bundledDir, d, 'mission.js');
  if (!existsSync(f)) continue;
  const mod = await import(pathToFileURL(f));
  report(`src/missions/${d}`, mod.default);
}
const manifest = join(root, 'public/missions/manifest.json');
if (existsSync(manifest)) {
  for (const file of JSON.parse(readFileSync(manifest, 'utf8')).missions || []) {
    try { report(`public/missions/${file}`, JSON.parse(readFileSync(join(root, 'public/missions', file), 'utf8'))); }
    catch (e) { failed++; console.error(`✗ public/missions/${file}: ${e.message}`); }
  }
}
process.exit(failed ? 1 : 0);
