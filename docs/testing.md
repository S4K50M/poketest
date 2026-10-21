# Testing and verification

[Documentation index](README.md) · [Project README](../README.md)

## Commands

Run commands from the repository root after npm ci. A JavaScript change requires rebuilding before bundle or browser verification.

```sh
npm run build
npm run check
npm test
npm run test:browser
npm run test:rpg
npm run test:combat
npm run test:mobile
npm run test:echo
npm run test:recovery
npm run test:firstgate
npm run test:art
npm run test:bosses
npm run test:arrival
npm run test:dialogue
npm run test:boss-upgrade
```

| Command | What it verifies |
| --- | --- |
| `npm run build` | Produces the portable bundle from source |
| `npm run check` | Syntax-checks src/*.js and compares the committed bundle with an in-memory build |
| `npm test` | Node simulation, asset paths, party/combat systems, progression, save migration, complete input-driven routes |
| `npm run test:browser` | Real campaign controls, first guardian, rewards, recruitment, saves, menus, all biomes, mobile, nested hosting |
| `npm run test:rpg` | Quest turn-ins, talents, gear, oath effects, merchant trades, optional bosses, history, endings, mobile RPG UI |
| `npm run test:combat` | Buffered keyboard chains, shields, arts, unlocks, Focus/cooldowns, v4 reload, motion setting, mobile controls, camera visibility |
| `npm run test:mobile` | Portrait gate on home, menus and gameplay; rotation pause/input release, preserved menus, thumb targets, priority menu, multitouch combat, phone/tablet landscape |
| `npm run test:echo` | Nonblocking echo pickup, journal records, repeated interaction and reload safety, elevated shrine collection |
| `npm run test:recovery` | Automatic full-party recovery, one-use springs, persistent Game Over, Retry and mobile death-screen rotation |
| `npm run test:firstgate` | First-gate branch traversal, missed-jump landings, reclimbing, and desktop/mobile presentation |
| `npm run test:art` | Canvas contact sheets for companions, wild enemies and bosses, plus desktop/mobile world rendering |
| `npm run test:bosses` | Distinct encounter mechanics, warning geometry and live desktop/mobile boss presentation |
| `npm run test:arrival` | Viewport-fitting title screen, cinematic lifecycle, first-area art and desktop/mobile presentation |
| `npm run test:dialogue` | Nonmodal NPC conversation, progression inputs, landmark/boss voices, and mobile scene placement |
| `npm run test:boss-upgrade` | Essential encounter cinematics, reactive boss pressure, escalation, and mobile lifecycle |

Test totals grow with concrete regressions; use the current command output as the result for a change. Documentation-only edits need link/path checks and command review; they do not require rebuilding or rerunning combat routes.

## Chromium and test servers

The suites select CHROMIUM_PATH if set, then /usr/bin/chromium when present, otherwise Playwright’s browser. Install a browser on a fresh machine if needed:

```sh
npx playwright install chromium
```

| Suite | Default server port | Override |
| --- | --- | --- |
| Campaign | 3100 | `TEST_PORT` |
| RPG | 3130 | `RPG_TEST_PORT` |
| Combat | 3140 | `COMBAT_TEST_PORT` |
| Mobile landscape | 3150 | `MOBILE_TEST_PORT` |
| Echo pickups | 3160 | `ECHO_TEST_PORT` |
| Recovery / Game Over | 3170 | `RECOVERY_TEST_PORT` |
| First-gate landings | 3180 | `FIRSTGATE_TEST_PORT` |
| Art and animation | 3190 | `ART_TEST_PORT` |
| Boss encounters | 3200 | `BOSS_TEST_PORT` |
| Landing and arrival | 3210 | `ARRIVAL_TEST_PORT` |
| World dialogue | 3220 | `DIALOGUE_TEST_PORT` |
| Boss upgrade | 3230 | `BOSS_UPGRADE_TEST_PORT` |

Each suite starts and stops its own server. Choose a free override port if another task uses the default. Screenshots are written to ignored test-results/. Inspect screenshots after rendering or layout changes; a passing input test cannot prove visual quality by itself.

Managed browser policies may block file:// navigation. The asset tests still resolve local HTML/CSS/font URLs against the filesystem, and the campaign browser suite checks /poketest/ hosting. Passing those checks is not evidence that a blocked browser actually navigated a local file.

## Simulation coverage

The training fixture verifies the shared motor and party kernel with all eleven rigs. Campaign controllers complete the six-fragment route with every original starting lead and backtrack to both hidden shrines using real movement. Optional-story controllers exercise all three covenant routes through the main and forbidden guardians, quest turn-ins, history, and true endings.

The combat suite checks once-per-swing contact, buffered JJJ/JJK, directional attacks, cancel timing, Guard/parry/regen, boss posture, finite aerial resources, all twelve arts, progression locks, pause behavior, defensive snapshots, and migrations. Important regressions include queued attacks escaping under Guard, guarded signatures, Second Chance on a lethal shield break, and ordinary boss hit-stun becoming an infinite lock.

Unit tests can create narrow controlled fixtures for timing or geometry. End-to-end progression evidence should use actions and earned milestones rather than marking bosses or quests complete. Later browser checkpoints come from the route controllers, not arbitrary forged progression.

## Presentation checks

The combat browser suite observes world-frame transforms to catch accidental camera scaling that moves standing actors or the floor offscreen. Mobile gameplay assertions run in landscape and check viewport overflow and HUD clearance from the actor and touch controls. The dedicated mobile suite also rotates during play and during an open menu, verifies frozen simulation and released inputs in portrait, and exercises simultaneous touch movement and attack. Preserve these when changing camera, zoom, Canvas sizing, or HUD placement.

Also inspect readable attack telegraphs, foreground occlusion, particle density, posture cues, reduced motion, dialog scroll position, and touch hit targets. Capture the real gameplay view rather than only isolated art previews.

## Choosing appropriate checks

| Change | Appropriate checks |
| --- | --- |
| Markdown only | Local links/anchors, referenced commands/files, git diff --check |
| Move data / defense / party | Build/check, Node combat/party tests, live combat suite |
| Boss moves / arena mechanics | Build/check, Node encounter/pressure tests, test:bosses, test:boss-upgrade, complete campaign routes and relevant combat/recovery checks |
| Rooms / gates / quests / saves | Build/check, Node routes/migrations, campaign or RPG browser suite |
| Rigs / effects / HUD / CSS | Build/check, Node art checks, test:art, relevant browser suites, desktop/mobile screenshot review |
| Asset paths / bundle / hosting | Asset tests, check, campaign nested-hosting suite |

Add tests for meaningful behavior or a concrete regression. Keep generated screenshots and temporary verification scripts out of the commit. See [contributing](contributing.md) for the change workflow.

## Dungeon difficulty regressions

The dimension suite checks all six main routes, twelve miniboss seals, scarce seeded recovery springs, three-phase encounters and the four new minion AIs. Separate traversal fixtures isolate geometry from combat, walk all six lower dungeon routes without jumping, and exercise optional upper routes with chapter-appropriate abilities. They check continuous floor coverage and recoverable missed jumps. Full campaign controllers retain enemies and earned progression. Echo pickups must keep simulation running immediately; their complete text remains in World History.

## Recovery, death and cave regression checks

Recovery tests cover two or three interior springs per gate, different new-journey seeds, stable saved layouts, automatic full-party healing, one activation per attempt, and no healing from camps or travel. Death tests verify that Game Over stops simulation, a penalty is applied once, the dying gate’s enemies return while other gates remain unchanged, first-victory rewards stay claimed, and Retry restores the party at a valid spring. Save/reload and Save & Title must retain a pending death. The focused browser suite checks keyboard/touch retry and portrait rotation over Game Over.

Review real gameplay screenshots of tunnel ceilings, backwalls, attached rock shelves, local light, recovery basins, and boss telegraphs on desktop and mobile. Check that the grounded passage reads as a tunnel, with visible floor and headroom. Art must match the revised continuous floors and catch shelves; it must not conceal safe landings or imply a collision surface the engine does not have.

The first-gate network tests deliberately walk off ledges at several heights, require landing on another elevated platform, and climb back into the route with the abilities available on first arrival. Distinct route fixtures verify parallel paths rather than treating all platforms as a single ascending staircase.

## Art and animation regressions

The Node art checks draw all eleven companions, nineteen wild species, and twenty-one boss identities through their public entry points. They exercise both facings, playable action poses, enemy action states, boss phases, final-guardian faction variants, and reduced motion. Canvas recorders reject non-finite coordinates and unbalanced context state; frozen inputs check that art does not change entity state or definitions. These checks establish rendering safety, not visual quality.

The art browser suite uses the real Canvas renderer to produce `art-companions.png`, `art-minions.png`, `art-bosses.png`, and `art-action-poses.png` contact sheets. It also captures actual gameplay in `art-battle-desktop.png` and `art-battle-mobile.png` so composition, floor anchoring, HUD clearance, tunnel lighting, and attack readability can be reviewed together. Inspect these screenshots under ignored `test-results/` after any rig or effects change. Confirm that grounded poses touch their landing surface, different body types fit portraits, and boss phase effects leave avoidance routes visible. Check that pause/hitstop hold player and enemy rig animation and reduced motion retains complete characters without camera shake or dense afterimages.

## Boss encounter regressions

Encounter tests cover all 21 profiles and their four named moves, rather than expecting the same rush/volley/sigil/slam cycle from every enemy. Check distinct executable event traces, valid phase sequences, finite geometry, locked targets, damage only after warnings, and reachable escape routes. Profile metadata alone is not evidence that a move produces a different fight.

Mechanic checks cover real collision on temporary ledges, damaging areas, beam and ring safe spaces, summons without farmable rewards, and cleanup on phase changes, boss death, full-party death, retry, and room changes. Pause, hitstop, and frozen actors must not advance their attack timelines. Verify parry and posture interruption without retaining stale active scripts.

The boss browser suite renders signature telegraphs and active mechanics and checks actual desktop/mobile play. Inspect warning versus active geometry, safe lanes, execution labels, actor/weapon animation, HUD hints, and landscape touch access. Keep a route controller that responds with normal movement, jumps, dash, shield, healing, and earned attacks. End-to-end boss victories must not rely on direct HP edits, teleportation, or invented unlocks.

Pressure regressions should distinguish an unchanging point-blank heavy loop from reactive play. Verify the guard appears only after its read warning, chips only the recognized grounded frontal heavy, and permits light/alternate-route/rear/aerial/riposte damage and ordinary recovery punishes. Check real knockback, parry/posture cancellation, no perpetual posture-break chain, and the warned phase breakaway. Check all progression tiers, early-boss healing exclusion, late 40% desperation, capped/interrupted healing, and cleanup on death, retry, room changes, and nonlethal falls. Test locked attack targets and minimum reaction/recovery windows after tempo scaling.

The boss-upgrade browser suite checks essential encounter introductions and finale destinations. Verify that simulation, attack/hazard timers, and held input stay stopped during the scene, including portrait rotation, blur, and hidden tabs. Exercise natural completion and keyboard/touch skip; retry should not repeat a boss introduction already seen in the loaded session. Continue and reload must preserve ending decisions, resume exploration after a main ending, and show the summary for a completed true ending. Review chosen-party compositions, readable captions, distinct chambers, all ending branches, and reduced-motion stills on desktop and mobile.

## Landing, opening and first-area checks

The arrival suite checks the title screen across desktop, tablet, and phone-landscape dimensions. Verify that the document has no outer horizontal or vertical scrollbar, primary actions remain visible and usable, dynamic panels stay within the viewport, and keyboard focus follows their state. Dialog content can scroll independently. Mobile portrait must still show the rotation prompt before home, menus, the cinematic, or gameplay can receive input.

Its separate mobile context also starts in portrait and rotates before tapping the replay, new-expedition, and skip controls. Keep the hidden portrait header within the layout viewport: overflow can leave the browser zoomed after rotation and shift touch coordinates even when desktop-sized screenshots look correct.

Opening checks cover new-expedition playback, skip, complete playback, Continue bypass, and replay without save replacement. Screenshots include `arrival-home-1440.png`, `arrival-home-844.png`, `arrival-home-realm.png`, the three `arrival-intro-*.png` acts, and `arrival-<room-id>.png` first-area views under ignored `test-results/`. Simulation and combat input must stay blocked until control returns; skipping must clear held keys and restore appropriate focus. Check rotation, tab visibility, reduced motion, subtitles, and the selected party rather than treating an autoplay timer alone as evidence of a working cutscene.

Review the Last Lantern, first forest passage, deeper root galleries, upper climb, vault, and Matron chamber on desktop and mobile. Their art must remain read-only and leave enemy cues, real landing edges, and catch shelves clear. Keep the existing first-gate movement and full campaign suites alongside screenshot review so a scenery change cannot quietly alter traversal or progression.

## Scene dialogue regressions

Verify live conversations through ordinary movement and interaction: Vell’s greeting must appear beside the professor without opening the shared dialog or pausing the simulation. E/Enter advances one page per press and must not also retrigger an NPC interaction; Space remains jump, movement and combat remain available, and walking away dismisses speech. Escape leaves a conversation before a subsequent Escape opens Pause. Quest acceptance and turn-in remain tied to NPC interaction, not to how many pages were displayed.

Check that inventory/pause/portrait rotation temporarily hide the voice and preserve its page and timer. Room changes, home, and game over must remove stale speech. Touch Continue/Leave and the existing interaction button must remain usable in landscape after rotation. Review desktop and narrow mobile screenshots for readable text, speaker anchoring, HUD clearance, and unobstructed movement/combat targets; a DOM bounding box alone does not prove the utterance fits.

Node coverage checks text pagination, copied source metadata, presentation-state lifecycle, and landmark/boss content registration. Every live room needs a valid authored landmark anchor, including negative-Y upper rooms and optional dungeons. Automatic whispers must avoid interrupting a manual conversation or starting beside a nearby threat. They must never collect a memory, mutate progression, enter a save, or consume E. Preserve the existing nonblocking echo, campaign, RPG, and mobile suites alongside these focused checks.
