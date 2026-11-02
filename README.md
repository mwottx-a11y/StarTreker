# Star Treker: Voyages of the Meridian

A story-driven, pixel-art starship adventure built with [Phaser 3](https://phaser.io), in the style of early-90s
starship adventure games: run the bridge, warp between systems, fight from the viewscreen, and lead a
four-person landing party through point-and-click away missions where talking usually beats shooting.

Every mission is a **self-contained module**, written as data, that uses the same recurring cast. You can
release new episodes without touching the engine, and you can even ship them as JSON files loaded at runtime.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
npm run validate   # check every mission module for broken references
```

## The crew of the CES Meridian

| | Role | |
|---|---|---|
| **Captain Rowan Hale** | Commanding officer (you) | Believes there is always one more option. |
| **Lt. Cmdr. Ixa Venn** | Science officer | Thessari. Empathic. Mostly finds it inconvenient. *Scans.* |
| **Dr. Bram Okafor** | Chief medical officer | Former frontier surgeon. Distrusts anything that hums. *Examines, heals.* |
| **Ensign Pell Daska** | Security | Eager. Statistically unlucky. *Assesses, defuses, forces doors.* |
| Lt. Mika Sato, Lt. Dev Arun, Chief Wren Brandt | Helm, comms, engineering | Bridge crew. |
| Admiral Iona Thorne | Sector Command | Gives the briefings. |

Recurring guests: **Captain Kesh** of Clan Varr-Tesh (a corsair with a code) and **Dr. Halvorsen**.

## Episodes included

1. **The Silent Choir** (bundled JS module, `src/missions/silent-choir/`). A research colony has gone silent,
   its colonists standing in the plaza humming in unison. It has four away rooms, a negotiation or a space
   battle, a dialogue-driven persuasion, a musical puzzle, two endings, and branching consequences: a promise
   you make in orbit comes due in the last scene.
2. **Patience of Stone** (external JSON module, `public/missions/veil-of-patience.json`). A derelict freighter,
   a polite but armed AI, hidden passengers, and an ally demanding them back. Choices from Episode 1 open up
   options here.

## How to play

**Bridge:** click a station or use the command bar.
- **Helm**: star map and warp
- **Science**: scan the system
- **Comms**: hail
- **Tactical**: weapons
- **Engineering**: status and repairs
- **Transporter**: beam down
- **Mission Log**: objectives

**Away missions:** pick a verb (**Walk / Look / Use / Talk / Get**), then click something. Right-click cycles
verbs; the keys are W/L/U/T/G.
- Click a **crew portrait** (Venn *Scan*, Okafor *Med*, Daska *Sec*), then click a target to have that officer
  deal with it.
- Click an **inventory item**, then click a target to use the item on it. Click an item, then another item, to
  combine them. Right-click an item to describe it.
- **COMM** (or C) calls the ship: beam up, or ask for a status report.
- With Okafor selected, click an injured crewmember to heal them.

**Combat:** you see the fight through the viewscreen.
- The ship turns toward your crosshair. Arrow keys or WASD also steer.
- **Left-click** or Space fires phasers. **Right-click** or T fires a torpedo.
- **Hail** tries to talk. **Retreat** warps out.
- Enemies may surrender when damaged. What you do next matters.

**On phones and tablets:** play in landscape (portrait shows a rotate prompt). On wide, short screens (a phone
held sideways) the game switches to a compact layout: the scene fills the full height and the controls move
to a sidebar with large labels, and inventory opens from an **ITEMS** button. Add `#compact` to the URL to
preview that layout on a desktop. Text defaults to large on
touch devices; you can toggle it on the title screen.
- Tap things directly. The label at the bottom of the room shows what you tapped.
- **SHOW HOTSPOTS** outlines everything you can interact with.
- In combat, tap to fire phasers at a point, and hold and drag to steer. Releasing your finger stops the
  turn. Torpedoes have their own button.
- Use **FULLSCREEN** on Android, or "Add to Home Screen" on iOS, to hide the browser bars.

**Scoring:** every mission ends with a Concord Command evaluation. Points come from diplomacy, investigation,
keeping your people safe, and keeping your word, not from body count. Your results, and certain choices,
persist in your profile and can change later episodes.

## Architecture

```
src/
  main.js                  Phaser config, scene list
  cast/crew.js             The shared cast, specialist roles, fallback lines, standard kit
  engine/
    director.js            Owns the running mission; moves between scenes
    script.js              The mission scripting interpreter (actions, conditions, dialogue trees)
    state.js               Mission state, persistent profile (completions + cross-episode memories), saves
    missions.js            Registry: auto-discovers bundled modules, fetches external JSON modules
    validate.js            Static checker for mission modules (also used by `npm run validate`)
    pixel.js, painter.js   Procedural pixel art: characters, portraits, ships, planets, room backgrounds
    icons.js, font.js      Inventory icons, crisp bitmap font
    audio.js               Synthesised sound effects and ambient drones (no audio files)
    ui.js, starfield.js    Dialogue box, buttons, panels, toasts
  scenes/                  Boot, Title, MissionSelect, Briefing, Bridge, Away, Combat, Debrief
  missions/<id>/mission.js Bundled mission modules
public/missions/           External mission modules (JSON) + manifest.json
tools/validate-missions.mjs
docs/MISSION_AUTHORING.md  How to write a new episode
```

All art and audio are generated at runtime from small parametric descriptions, so a mission is a single data
file. Missions can still reference PNG backgrounds if you'd rather paint them.

## Writing a new mission

See **[docs/MISSION_AUTHORING.md](docs/MISSION_AUTHORING.md)**. In short, you have two options:

- Create `src/missions/<your-id>/mission.js` that `export default { ... }`. It's discovered automatically.
- Write a JSON file in `public/missions/` and add it to `public/missions/manifest.json`. It's loaded at
  startup with no rebuild needed.

Then run `npm run validate`.

## A note on originality

The game is an homage to a *genre*: crewed-starship adventure games with a bridge, a landing party and
dialogue-driven missions. The ship, crew, factions and stories are all original.
