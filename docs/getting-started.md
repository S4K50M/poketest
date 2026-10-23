# Getting started

[Documentation index](README.md) · [Project README](../README.md)

## Requirements

Use Node.js 20 or newer and npm. The package lock pins development dependencies. A modern browser needs Canvas2D, JavaScript, and localStorage for saved progress. No account, secret, API key, database, or gameplay server is required.

```sh
node --version
npm --version
npm ci
npm run dev
```

Run these commands from the repository root. The development server listens on port 3000 and esbuild watches the JavaScript entry and its imports. Refresh the browser after a rebuild; there is no hot-reload client.

```sh
PORT=3200 npm run dev
```

The PORT prefix shown here uses POSIX shell syntax; use your shell’s equivalent environment-variable assignment on other platforms. Server processes do not survive an environment restart: start the command again when returning to the workspace.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install locked development dependencies |
| `npm run dev` | Watch JavaScript, rebuild bundle, serve on PORT or 3000 |
| `npm start` | Serve the existing files without a watcher |
| `npm run build` | Generate bundle/game.js from src/main.js |
| `npm run check` | Syntax-check JavaScript and verify bundle freshness |
| `npm test` | Run Node tests |
| `npm run test:browser` | Run campaign Chromium integration |
| `npm run test:rpg` | Run RPG Chromium integration |
| `npm run test:combat` | Run Momentum Chromium integration |
| `npm run test:mobile` | Run landscape, rotation, menu, and multitouch integration |
| `npm run test:echo` | Check nonblocking echo pickups and journal records |
| `npm run test:recovery` | Check automatic recovery, death penalties, Game Over, and Retry |
| `npm run test:arrival` | Check the title screen, opening cinematic, and first-area presentation |
| `npm run test:dialogue` | Check scene conversations, environmental voices, input, and mobile placement |
| `npm run test:boss-upgrade` | Check guardian cinematics, escalation, and reactive encounter behavior |
| `npm run test:aftermath` | Check guardian transformations, in-world rewards, lore, and ending access |

npm start does not build first. After editing JavaScript without a watcher, run npm run build before starting or refreshing the game. CSS and HTML are served directly; changing them does not require a JavaScript rebuild.

## First-run walkthrough

1. Use the title screen to begin an expedition and choose three distinct companions. Its controls and panels fit the viewport; the atlas, party builder, and journal open without navigating to a long page.
2. Watch or skip the opening, then enter the Last Lantern. Walk right with D to meet Professor Vell.
3. Vell’s words appear beside the professor. Advance them with E/Enter or the Continue touch button; Space remains jump. You can move away to leave the conversation. Reach the first region portal and press E.
4. Use J/K/L to fight, Space to jump, and Shift to dash. G raises Guard; H explains the new combat routes and arts.
5. Walk into a glowing Wellspring to restore the whole party and set your respawn point automatically. Each gate contains one in a seeded interior location, not a healing bench at its entrance. Open M for the atlas, I for inventory, and N for the chronicle.
6. Defeat a guardian to receive its unlocks immediately and watch its chamber transform. There is no victory dialog to dismiss. Approach the remaining tree, clock, relic, or other landmark and press E for its lore.
7. If all three companions fall, Game Over explains the gate-wide enemy revival and 10% Lumen loss. Retry returns to your last activated spring; Save & Title keeps the pending death in your save.

Continue bypasses the opening and resumes your checkpoint. **Watch the Prologue** on the title screen shows the cinematic without starting a new expedition or replacing your save.

Major and forbidden guardians enter through animated, skippable chamber scenes before combat. After the Hollow Sovereign falls, press E at the exposed Worldheart to make the main ending choice; after the Nullheart falls, approach its remains to begin the covenant finale. Their ending cinematics follow those interactions. **Skip Scene**, Space, Enter, E, or Escape returns control; rotating to portrait or hiding the tab pauses the presentation. Continue resumes exploration without reopening an ending automatically. Learn a boss’s tell and punish its recovery rather than repeating heavy attacks at point-blank range.

The [gameplay guide](gameplay.md) lists all controls and resources. The [combat guide](combat.md) explains unlocks and defensive timing. Sound starts muted; use the sound button to enable it. Reduced motion is available in the Arsenal.

## Mobile landscape

Mobile screens require landscape, including the home screen, party selection, menus, and active gameplay. In portrait, the rotate prompt pauses the simulation and clears held controls. Physically rotate your device, or use Enter Landscape where fullscreen/orientation APIs are supported. If the browser cannot lock orientation, the prompt stays until you rotate manually. Open menus remain open after rotation; the portrait prompt stays in front until the device returns to landscape.

## Direct-file play

Open index.html with the complete assets/, src/, and bundle/ folders in place. The page uses a classic deferred bundle, and CSS/fonts/icons use relative paths. Do not move index.html away from those folders or open src/main.js directly.

HTTP is recommended for consistent browser storage. Managed environments can block file:// pages entirely. See [deployment](deployment.md) for portable files and repository-subpath hosting, and [save format](save-format.md) for origin-specific storage.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| CSS or fonts do not load | Keep the complete src/ CSS files, including style.css, landing.css, intro.css, world-dialogue.css, and their local imports, together with assets/fonts/. Serve the repository root; inspect missing paths in the browser Network panel. |
| Source changes do not appear | Confirm the watcher rebuilt, or run npm run build. npm start serves the previous bundle. Refresh the browser; check that you opened the intended port. |
| Bundle freshness check fails | Run npm run build, then npm run check; include the generated bundle in the source change. |
| Port is already occupied | Select a different PORT. Inspect the existing process before stopping it; stop only servers you own. |
| Continue appears to lose progress | Check browser/profile, protocol, domain, and port. Each origin has separate localStorage. Direct-file and HTTP saves need not be shared. |
| Storage is unavailable | Keep the tab open if necessary. The UI warns when saving fails; private browsing or browser policy can prevent durable storage. Backups require accessible localStorage. |
| Keyboard input stops | Close a menu or return focus to the game Canvas. Window blur and tab hiding pause gameplay; held inputs are cleared. |
| A path or power is sealed | Read its unlock text in the atlas or H → Arsenal; main fragments, traversal abilities, optional victories, and mastery have different gates. |
| Browser tests cannot find Chromium | Install with npx playwright install chromium, or set CHROMIUM_PATH to an installed executable. See the testing guide for suite ports. |

There are no built-in cloud saves or multiplayer services to configure. The [architecture guide](architecture.md) explains which module owns each system.
