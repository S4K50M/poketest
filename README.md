# Kinetic Monsters: Momentum

An original browser action RPG about three creature companions, a fractured Worldheart, and the lives it refuses to forget. **Momentum 4.0** combines fast platforming, branching real-time combat, and an interconnected story campaign.

The playable prototype includes:

- A redesigned first gate with branching climbs, shared landings, and recovery platforms that lead back into the route after missed jumps.

- **42 rooms across six dimensions**, nine major bosses, twelve minibosses, eleven companions, and nineteen wild species.
- Branching tunnel dungeons with continuous lower floors, optional upper climbs and vaults, looping shortcuts, and a discovered-room atlas without route arrows.
- Three-phase guardians, stronger knockback, scarce automatic Wellsprings, and committed Focus healing make expeditions dangerous.
- Three active companions that switch mid-fight, healing, crafting, equipment, and exploration tools.
- Launchers, aerial combos, dash cancels, directional shields, timed parries, boss posture breaks, and visible attack cooldowns.
- **Twelve combat arts**, with ten unlocked through progression, optional bosses, and companion mastery.
- Eight quest lines, three permanent covenants, talent trees, hidden history, and multiple endings.
- Enclosed tunnels, cavern walls, stone shelves, biome geology, animated Canvas rigs, and reduced-motion controls.
- Two or three seeded recovery springs per gate; party wipes revive that gate’s enemies and open Game Over with Retry or Save & Title.

This is a single-player 2D campaign prototype. The original 1v1 arena has been replaced.

## Run locally

Requires **Node.js 20+** and npm. There are no runtime dependencies, accounts, secrets, or external services.

```sh
npm ci
npm run dev
```

Open the local server on port **3000**. `PORT=3200 npm run dev` selects another port. The development command watches JavaScript and rebuilds the portable browser bundle; refresh the browser to see changes. `npm start` serves the checked-in build without watching.

You can also open `index.html` directly. Keep the complete `assets/`, `src/`, and `bundle/` folders beside it. HTTP hosting gives more predictable save behavior. See [setup and troubleshooting](docs/getting-started.md) and [deployment](docs/deployment.md).

## Start playing

Choose three companions, begin the expedition, and walk right to Professor Vell. Use **E** to advance dialogue and enter the first portal. Walk into a glowing **Wellspring** to restore every companion and bind your respawn point; camps provide services without healing.

| Input | Action |
| --- | --- |
| A / D · Space · Shift | Run · jump · dash |
| J / K / L | Light chain · heavy / launcher · companion signature |
| G | Hold shield; time its opening to parry, then J/K to riposte |
| X / Z / H | Cast art · cycle two equipped arts · open Arsenal |
| 1 / 2 / 3, or Q | Switch active companion |
| Hold F / V | Channel Focus healing / drink a flask |
| E · M · I · N | Interact · atlas · inventory · RPG chronicle |
| Escape / ? | Pause / full guide |

Mobile screens require landscape, with a portrait rotate prompt on the home screen, in menus, and during gameplay. Thumb controls prioritize movement, jump, strike, and dash; the menu groups recovery, loadouts, exploration, and tools. Sound starts muted. Existing v2/v3 saves migrate to v4; progress is stored locally in the browser.

## Documentation

Start with the [documentation index](docs/README.md).

| Guide | Covers |
| --- | --- |
| [Getting started](docs/getting-started.md) | Installation, commands, first run, common problems |
| [Gameplay and controls](docs/gameplay.md) | Party, healing, inventory, talents, tools, complete controls |
| [Combat reference](docs/combat.md) | Frame data, movement, Guard, Flow, twelve arts and unlocks |
| [World and story](docs/world-and-story.md) | Biomes, guardians, optional routes, spoiler-marked story |
| [Creature design reference](docs/creature-designs.md) | Supplied creature concepts and their implementation context |
| [Architecture](docs/architecture.md) | Engine layers, rendering, UI, source map |
| [Content authoring](docs/content-authoring.md) | Adding rooms, creatures, bosses, quests and powers |
| [Save format](docs/save-format.md) | Persistence, v2/v3 migration, checkpoints and backups |
| [Testing](docs/testing.md) | Unit and browser checks, ports, screenshots, regressions |
| [Deployment](docs/deployment.md) | Portable builds, GitHub Pages and relative asset paths |
| [Contributing](docs/contributing.md) | Change workflow and project invariants |
| [Changelog](docs/changelog.md) | Campaign, RPG and Momentum milestones |

## Verify changes

```sh
npm run check
npm test
```

After changing JavaScript, run `npm run build` before checking and commit the generated `bundle/game.js`. For gameplay, UI, rendering, save, or hosting changes, also run the relevant [Chromium suites](docs/testing.md). Documentation-only changes do not require rebuilding the game.
