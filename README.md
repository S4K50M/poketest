# KINETIC MONSTERS: IRON FIST ARENA

A playable, original 2.5D arena-fighting prototype. Eight illustrated creatures, real-time martial arts, frame-based combat, reactive CPU opponents, and destructible octagonal arenas. All art is drawn locally with Canvas; fonts are bundled. No external API, credentials, or runtime packages are required.

**New: The Hollow Foundry.** Choose **Begin the Path** or **The Path** to enter a side-view movement adventure with your selected creature. Professor Vell guides six playable lessons through an original cavern: walking, jumps, air dashes, downward bounces, wall climbing, and a final combat encounter. The arena remains available separately.

## Run

Download or clone the **whole repository**, keep its folder structure, and open `index.html` in a modern browser with a keyboard. The committed `bundle/game.js` lets combat run without a server or installation. Downloading the HTML file alone does not include its CSS, fonts, or game script.

For local HTTP hosting, use Node.js 20 or newer:

```sh
cd /workspace/poketest
npm start
```

The server listens on port **3000**, configurable with `PORT`. Choose a fighter, any of the seven other CPU opponents, an arena, and a difficulty, then select **Enter the Arena**. Relative asset paths also support static hosting below a repository subpath, such as GitHub Pages.

The browser bundle is already included. To edit the source or run browser tests, install development tooling:

```sh
npm ci
npm run build
npm run check
npm test
npm run test:browser
```

Use `npm run dev` for an HTTP development server that rebuilds the bundle when source files change. After editing `src/`, run `npm run build` before committing; `npm run check` detects stale bundles. The source modules remain separate for engine tests and architecture, while the entry page uses a classic bundled script to avoid file-origin module restrictions.

Browser tests use `/usr/bin/chromium` when available. Otherwise set `CHROMIUM_PATH`, or install Playwright's Chromium with `npx playwright install chromium`. Browser tests start and stop their own server on port 3100 (`TEST_PORT` overrides this) and save screenshots to ignored `test-results/`.

## Controls

### The Hollow Foundry

| Input | Action |
| --- | --- |
| A / D or left / right | Move horizontally; directions stay fixed in this mode |
| Space (hold / tap) | Full-height jump / short hop; press again for a double-jump |
| Push into wall + Space | Wall slide, then wall-jump |
| Shift | Ground dash or one air dash; brief enemy-contact protection |
| J / W+J | Side slash / upward slash |
| Air S+J | Downstrike; bounce off a bell or enemy to restore height and air dash |
| K | Heavy strike |
| L | Element-colored bolt; costs 25 Focus; hits restore Focus |
| E | Rest, heal, refill Focus and activate a previously lit waylight |
| R | Return to the latest checkpoint |
| Escape | Pause / resume |

Jump inputs have **7 frames of coyote time** and **8 frames of buffering**. Releasing jump early cuts upward velocity. Running accelerates to full speed in five frames; direction changes retain immediate control. Air dashes pause gravity for 11 frames and recover after landing, a wall-jump or a successful bounce (normal dash cooldown still applies after a wall-jump). Pit falls return you quickly to a checkpoint, preserving lesson progress and defeated enemies. Thorns cannot be bypassed with dash invulnerability.

### Iron Fist Arena

All directions are **relative to your opponent**, including after a side switch. A is always back; D is always forward. Arrow keys are also supported.

| Input | Action |
| --- | --- |
| A / D | Retreat with automatic guard / advance |
| W / S | Sidestep background / foreground; dodge narrow attacks |
| A, A / D, D | Backdash / dash within a 15-frame double-tap window |
| Shift | Instant dash; hold A to backdash instead |
| A, A, S, A | Cancel a backdash with a sidestep and chain another backdash |
| Space | Jump; press again for a lightweight air-dash or Zephyrix double-jump |
| J | Jab; time subsequent J inputs on contact to cancel into a three-part string |
| K | Heavy launcher; startup counter-hits gain damage and stun |
| L | Neutral elemental attack |
| W+L / S+L / D+L / A+L | Four directional elemental techniques |
| U | Throw through guard, or escape a throw within exactly 12 frames |
| I | Cinematic Synergy Burst: below 25% HP or at 100% Kinetic Gauge; once per round |
| Escape | Pause / resume |

The in-game **Move List** gives each character's move names, inputs, startup / active / recovery frames, and base damage. **Hitboxes** toggles a debug overlay. **Sound** enables optional locally synthesized impacts.

## Roster

Movement units are world units per frame. Damage is multiplied by power, with additional counter-hit bonuses and progressive juggle decay. Distinct hurtbox radii, heights and depth values live beside the stats in `src/roster.js`.

| Fighter | HP | Jab | Walk | Dash | Weight | Power | Archetype / key mechanic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Pyrojaw | 190 | 10f | .059 | .170 | 1.10 | 1.10 | Rushdown; D, S, D+K Magma God Fist; persistent fire |
| Voltantis | 155 | 8f | .085 | .230 | .70 | .88 | Fast mantis; teleport steps, three-hit plasma rake, air-dash |
| Glaciolith | 235 | 13f | .036 | .120 | 1.70 | 1.23 | Four-armed grappler; 1.9-unit throws, armored charge, ice-spike command throw |
| Zephyrix | 170 | 10f | .073 | .200 | .65 | .91 | Double-jump, air S+K dive-kick, pulling wind vortex |
| Terrakhan | 240 | 14f | .033 | .115 | 1.90 | 1.25 | W+L switches Fortress auto-parry / Quake unblockable shockwave |
| Noxshade | 165 | 10f | .071 | .200 | .80 | .94 | S+L sets a shadow clone that echoes the next attack from a flank |
| Aqualance | 185 | 11f | .064 | .240 | 1.00 | .98 | Hydro-rapier zoning, long D+L thrust, fast jet backdashes |
| Ferrodrake | 205 | 10f | .057 | .165 | 1.35 | 1.08 | Steel startup armor; A+K heavy parry, A+L laser, W+L Dragon Install |

## Combat rules

- **60 Hz fixed simulation.** Render refresh rate does not change move timings. Attacks have startup, active and recovery intervals, per-attack contact state, range/depth/height checks, and input buffering. Whiffs cannot cancel into jab strings. Standard jab is 10f; species exceptions are shown above.
- **Three axes.** X controls spacing, Z controls sidesteps, Y controls jump and launch physics. Ground shockwaves miss airborne targets. Attack hitboxes check the opponent's hurt volume. Knocked-down bodies are invulnerable until recovery. Launcher hits progressively scale damage and launch velocity to limit juggles.
- **Guard and throws.** Holding back guards from the front at a slower retreat speed. Guard drains per blocked hit and regenerates while released. Depletion causes 65f of vulnerability. Grabs ignore guard but give exactly 12 simulation frames to tech. Clones can cross up frontal guards.
- **Elemental resonance.** Fire creates lingering, avoidable floor hazards and chips through blocks. Electric specials add exactly 3f hit-stun. Ice applies 5 seconds of Frostbite, multiplying dash and sidestep movement by .7. Steel attacks and designated heavy attacks absorb one startup hit without interruption, while still taking damage. Burst has continuous hyper-armor. Wind vortexes pull through guard. Dragon Install gives 8 seconds of enhanced damage.
- **Resources.** Specials consume regenerating stamina and have individual directional cooldowns. HUD status chips expose stamina and active cooldowns. Dealing or taking damage builds Kinetic Gauge. Burst can also activate in low-HP rage, once per round.
- **Octagonal boundaries.** Each wall has separate integrity. Launch impacts cause a 43f wall-splat for follow-ups; heavy impacts can break a segment. The first break drops the fight to a lower tier, and a lower-tier break causes a ring-out. Foundry, Glacier Vault and Neon Undercity are distinct visual treatments of the same fair geometry.
- **Rounds.** First to two wins. 60 seconds of active simulation per round; pauses, cinematic freezes and impact hit-stop do not consume the clock. Timeout compares HP percentages, accounting for different maximum HP. Exact ties replay without awarding a win. Rematch resets the match and arena.
- **Reactive CPU.** The CPU samples visible attack startup at a difficulty-dependent reaction interval; it does not inspect future player inputs. It aligns depth, advances or zones at range, pokes / throws up close, sidesteps linear startups, jumps ground waves, and uses the roster-specific clone, aerial, stance, parry and burst options. Rookie, Contender and Apex adjust reaction and throw-tech ability.

Arena movement now advances **35% faster**, dashes **25% farther per frame**, and sidesteps **20% faster** than the original prototype. Jumps have stronger takeoff, Shift provides a direct dash input, and normal impact freezes are shorter. Move startup, guard retreat speed, and roster damage values remain consistent with the frame-data guide. The roster table lists base movement values; these arena multipliers apply at runtime.

## The Hollow Foundry level design

The 8,000-pixel route teaches one skill at a time, then combines them. Gates check performed actions and successful traversal, rather than advancing because the player read a prompt. Every new chamber lights a checkpoint and restores health; earlier chambers remain accessible for optional shard collection. There are six optional Echo Shards, no round timer, and a completion screen leading back to the arena.

| Chamber | Teaching setup | Proof of learning |
| --- | --- | --- |
| The Awakening | Safe floor, visible waylight, optional stepping stones | Travel 250 pixels to open the first gate |
| The Broken Stair | Raised ledges and a short broken bridge | Use a jump and reach the opposite bank |
| The Windless Span | A wider, thorn-lined gap with a clear landing | Perform an air dash and cross the gap |
| The Thorn Garden | A glowing training bell above a pit | Downstrike-bounce and reach the far side |
| The Ascent | Two solid climbing pillars, elevated shard and exit ledges | Wall-jump and double-jump over the pillars |
| The Warden’s Hall | Two husks and the Brass Warden with readable wind-ups | Defeat the encounter, then reach the exit arch |

Husks telegraph a forward charge; the Warden alternates charges and jumpable ground shockwaves, each with a punishable recovery. Damage has temporary invulnerability. Defeated enemies remain defeated after a fall, while surviving enemies reset to their homes to keep checkpoint returns safe. The level uses parallax arches, drifting spores, readable stone edges, dash afterimages, directional slash arcs, impact pauses, and a camera that follows ahead of movement. The smaller viewport shifts the world upward to leave room for the coach.

This is an original level inspired by the responsive traversal and atmospheric exploration of action platformers. It does not reuse Hollow Knight characters, art, map layouts, music, or story.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/roster.js` | Eight stat blocks, hurtbox dimensions, move definitions, special techniques, arena palettes |
| `src/engine.js` | Pure headless fixed-step simulation, input history, attack states, collisions, elemental physics, AI, round state machine |
| `src/render.js` | Original procedural creature rigs, portrait composition, projected 2.5D arena, walls, effects, hitbox inspection |
| `src/main.js` | Selection, keyboard sampling, HUD, fixed-step accumulator, pause/focus handling, move manual and optional Web Audio |
| `src/training.js` | Headless side-view movement, six authored chambers, solid platforms, verified lesson gates, checkpoints, enemies and pickups |
| `src/training-render.js` | Scrolling cavern, parallax layers, platform surfaces, creatures, effects and adaptive camera |
| `src/training-ui.js` | Training keyboard inputs, professor coaching, health/Focus, pause, results and arena transition |
| `src/style.css` | Responsive tournament UI and locally bundled typography |
| `server.mjs` | Dependency-free static development server |
| `scripts/build.mjs` | esbuild packaging, watch mode, and committed-bundle freshness check |
| `bundle/game.js` | Generated, committed browser entry that works without ES module fetches |
| `tests/engine.test.js` | Deterministic gameplay regression tests using Node's built-in runner |
| `tests/assets.test.js` | Relative file URL resolution and existence checks for HTML assets and fonts |
| `tests/training.test.js` | Movement feel, grace windows, combat and input-only completion of the entire path with all eight creatures |
| `tests/helpers/training-route.js` | Repeatable controller that clears the authored level without teleporting, overriding gates, or mocking damage |
| `tests/browser.mjs` | Chromium integration: eight selections, real keyboard training traversal, coach/checkpoint controls, combat, full match, pause, guide, rematch, responsive layout and subpath hosting |

The engine takes an optional seeded `random`, an `onEvent` callback, and an `ai: false` option for deterministic training or tests. `window.kinetic.snapshot()` exposes a read-only browser QA snapshot. No mutable game object is exposed. Effects and sound subscribe to events; they cannot affect combat outcomes.

### Prototype scope

This is a **2.5D Canvas prototype**, not a 3D asset pipeline. Creature rigs use original vector geometry with simplified limb animation; collisions are gameplay volumes rather than per-bone mesh colliders. The burst cinematic uses a freeze, letterbox and character-specific move name; command throws use shared launch physics with elemental effects. No online multiplayer, controller support, touch combat, recorded voice acting, save system, or tournament balancing is included. Engine, roster and renderer are separated so a Three.js, Godot or Unity presentation can replace the Canvas renderer without redesigning the combat data.

Bundled Barlow fonts are licensed under OFL-1.1, and the subsetted symbol font uses the DejaVu license. License texts are in `assets/fonts/`. Creature designs and illustrations are original to this prototype.
