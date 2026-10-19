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
```

| Command | What it verifies |
| --- | --- |
| `npm run build` | Produces the portable bundle from source |
| `npm run check` | Syntax-checks src/*.js and compares the committed bundle with an in-memory build |
| `npm test` | Node simulation, asset paths, party/combat systems, progression, save migration, complete input-driven routes |
| `npm run test:browser` | Real campaign controls, first guardian, rewards, recruitment, saves, menus, all biomes, mobile, nested hosting |
| `npm run test:rpg` | Quest turn-ins, talents, gear, oath effects, merchant trades, optional bosses, history, endings, mobile RPG UI |
| `npm run test:combat` | Buffered keyboard chains, shields, arts, unlocks, Focus/cooldowns, v4 reload, motion setting, mobile controls, camera visibility |

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

Each suite starts and stops its own server. Choose a free override port if another task uses the default. Screenshots are written to ignored test-results/. Inspect screenshots after rendering or layout changes; a passing input test cannot prove visual quality by itself.

Managed browser policies may block file:// navigation. The asset tests still resolve local HTML/CSS/font URLs against the filesystem, and the campaign browser suite checks /poketest/ hosting. Passing those checks is not evidence that a blocked browser actually navigated a local file.

## Simulation coverage

The training fixture verifies the shared motor and party kernel with all eleven rigs. Campaign controllers complete the six-fragment route with every original starting lead and backtrack to both hidden shrines using real movement. Optional-story controllers exercise all three covenant routes through the main and forbidden guardians, quest turn-ins, history, and true endings.

The combat suite checks once-per-swing contact, buffered JJJ/JJK, directional attacks, cancel timing, Guard/parry/regen, boss posture, finite aerial resources, all twelve arts, progression locks, pause behavior, defensive snapshots, and migrations. Important regressions include queued attacks escaping under Guard, guarded signatures, Second Chance on a lethal shield break, and ordinary boss hit-stun becoming an infinite lock.

Unit tests can create narrow controlled fixtures for timing or geometry. End-to-end progression evidence should use actions and earned milestones rather than marking bosses or quests complete. Later browser checkpoints come from the route controllers, not arbitrary forged progression.

## Presentation checks

The combat browser suite observes world-frame transforms to catch accidental camera scaling that moves standing actors or the floor offscreen. Mobile assertions check viewport overflow and HUD clearance from the actor and touch controls. Preserve these when changing camera, zoom, Canvas sizing, or HUD placement.

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
