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

The Momentum release passed 145 Node tests and all three browser suites. This is a release baseline, not a permanently fixed test-count requirement. Documentation-only edits need link/path checks and command review; they do not require rebuilding or rerunning combat routes.

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
| Rooms / gates / quests / saves | Build/check, Node routes/migrations, campaign or RPG browser suite |
| Rigs / effects / HUD / CSS | Build/check, relevant browser suites, desktop/mobile screenshot review |
| Asset paths / bundle / hosting | Asset tests, check, campaign nested-hosting suite |

Add tests for meaningful behavior or a concrete regression. Keep generated screenshots and temporary verification scripts out of the commit. See [contributing](contributing.md) for the change workflow.

## Dungeon difficulty regressions

The dimension suite checks all six main routes, twelve miniboss seals, scarce seeded recovery springs, three-phase encounters and the four new minion AIs. Separate traversal fixtures isolate geometry from combat and drive all six descents and six switchback towers with actual movement inputs and chapter-appropriate abilities. Full campaign controllers retain enemies and earned progression. Echo pickups must keep simulation running immediately; their complete text remains in World History.

## Recovery, death and cave regression checks

Recovery tests cover two or three interior springs per gate, different new-journey seeds, stable saved layouts, automatic full-party healing, one activation per attempt, and no healing from camps or travel. Death tests verify that Game Over stops simulation, a penalty is applied once, the dying gate’s enemies return while other gates remain unchanged, first-victory rewards stay claimed, and Retry restores the party at a valid spring. Save/reload and Save & Title must retain a pending death. The focused browser suite checks keyboard/touch retry and portrait rotation over Game Over.

Review real gameplay screenshots of tunnel ceilings, backwalls, attached rock shelves, local light, recovery basins, and boss telegraphs on desktop and mobile. Cave art is presentation-only: existing actual-input traversal fixtures should still pass unchanged geometry.
