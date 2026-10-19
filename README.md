# Kinetic Monsters: Echoes of the Rift

A playable, original 2D creature action RPG in the browser. The former 1v1 arena has been removed. Choose three companions, follow Professor Vell through six biomes, recover the Worldheart’s memories, and choose its future.

The game uses original, animated Canvas illustrations and the supplied creature designs. It is a compact campaign prototype, with a complete progression loop rather than a commercial-length game.

## Play and develop

Requires Node.js 20 or newer. No backend, account, secrets, CDN, or runtime packages are needed.

```sh
npm ci
npm run dev
```

The development command starts the static server on port 3000 and rebuilds the portable bundle when source files change. `PORT=3200 npm run dev` selects another port. `npm start` serves the already-built game without a watcher.

You can also open **index.html** directly. Keep `assets/`, `src/style.css`, and `bundle/game.js` beside it. All CSS, scripts, fonts, and icons are local relative paths. For GitHub Pages, publish the repository root. A server provides the most consistent browser save behavior; saves are stored per browser origin, not in a cloud account.

After changing source, run `npm run build` and commit `bundle/game.js`. The checked-in classic script avoids module-fetch restrictions when opening the HTML from disk.

## The expedition

There are **15 rooms, six biomes, six two-phase guardians, 11 companions, and 11 wild species**. The original eight companions are available from the start. Three new companions join after their guardians are freed.

| Region | Places | Guardian | Ability / rescue |
| --- | --- | --- | --- |
| Sanctuary | The Last Lantern | — | Professor Vell, six portals, workbench, waylight |
| Mourningwild | The Rootway, Matron’s Bower, Hidden Grove | Briar Matron | Root Claw wall jump; Mycora |
| Cinder Cathedral | Pilgrim’s Furnace, Bellows Altar | Saint Bellows | Ember Thread grapple |
| Drowned Archive | Sunken Stacks, Ink Chamber | Ink Leviathan | Tideglass Seal; Lumivern |
| Thundersong Spires | Bellwind Crossing, Conductor’s Roost, Fallen Star Observatory | Storm Conductor | Storm Wings double jump |
| Pale Meridian | Stillwood, Last Second | Hourglass Stag | Rift Step; Chronowl |
| Hollow Crown | Unwritten Road, Heart Below | Hollow Sovereign | Final memory and two endings |

The sanctuary connects the chapters. Each restored fragment opens another portal. Region paths and guardian rooms connect in both directions; the hidden branches reward returning after new abilities awaken. The atlas records discoveries and offers fast travel from a safe waylight to a discovered room.

Traversal includes a lever-operated rootbridge, wall climbing, furnace gaps, grapple crossings, moving sky platforms, a high frozen ascent, and a physical violet veil that only an awakened dash can cross. Benches, the workbench, story inscriptions, travelers, material caches, ore veins, and hidden shrines all have interactions.

Professor Vell’s field notes uncover why the Worldheart broke. Every guardian returns a memory instead of simply disappearing. At the end, choose to guard the restored heart or release it into the stars. The completed world remains available to explore.

## Controls

| Input | Action |
| --- | --- |
| A / D, or arrow keys | Run left / right |
| W / S | Aim up / down |
| Space | Jump; release early for a short hop |
| Shift | Dash; cancel attack recovery |
| J | Fast strike; buffer the next strike in a three-swing animation chain |
| K | Heavy strike; flip armored Pebblebacks |
| Air S + J | Downstrike / pogo bounce |
| L | Neutral elemental technique |
| Direction + L | Companion’s directional technique |
| F, held while still | Channel one heart for 33 Focus over 48 frames |
| V | Drink a Bramble Flask; restore three hearts |
| 1 / 2 / 3, or Q | Switch among the three active companions |
| E | Talk, rest, read, open a cache, pull a lever, enter a door |
| U | Grapple toward a nearby golden anchor after unlocking Ember Thread |
| T / C | Use / cycle the Resonance Pick and Echo Lantern |
| B | Buy a party-wide Heartwood upgrade near a waylight |
| M / I / N | Atlas / inventory and crafting / story and bestiary |
| Escape | Pause |

Touch controls appear on narrow screens. Keyboard controls are also listed in the in-game guide. Sound effects are optional and start muted.

## Combat and companions

Combat runs at a fixed **60 Hz**. Running reaches speed in a few frames; light attacks use 2 startup, 4 active, and 5 recovery frames. Heavies use 5 / 5 / 9. The engine supports ten-frame attack buffering, recovery dash cancels, coyote time, buffered jumps, variable jump height, wall slides, aerial steering, pogo refreshes, brief dash protection, directional attacks, and hit confirmation. A light hit pauses impact for one frame; heavy hits pause for three.

Each companion keeps independent hearts, Focus, and cooldowns. Switching preserves location, velocity, debuffs, and spent air resources. It cannot refill jumps or grant free invulnerability. A knocked-out companion yields to a living partner. A full party wipe returns to the checkpoint, resets surviving guardians to full health, and loses 10% of Lumens. Resting revives the party.

The eight supplied identities retain their different anatomy and elemental skills: the quadrupedal magma gator, mantis-wasp, glacier yeti, cloud griffin, rock beetle, shadow jackal, natural nose-lance shark, and chrome dragon. The new companions use separate deer, moth, and owl rigs:

- **Mycora:** fungal antlers, moss cloak, healing seed communion, and an armored briar rush.
- **Lumivern:** four moon-patterned wings, a lantern heart, seeking light needles, and a solar cone.
- **Chronowl:** six feathered wings, an hourglass crown, a stasis ring, and an ice dash.

Minions include shell enemies that need a heavy hit, static grubs that punish close attacks, burrowing ambushers, slippery water creatures, ranged thorn sprites, furnace bats, ink rays, storm birds, frost crawlers, and teleporting rift echoes. Guardians telegraph attacks and change rhythm below half health. Their attacks combine charges, jumpable waves, root eruptions, aimed ink, lightning markers, slowing ice, and projectile fans.

## Inventory and progression

Defeating creatures and finding echoes awards Bond XP and Lumens. Bond levels improve party health and damage. Caches and ore provide regional materials; the Resonance Pick breaks ore and the Echo Lantern reveals hidden shrine rewards. Rewards persist across room changes and cannot be collected twice.

Craft flasks and four charms at benches or the Mender’s Workbench. Equip two charms: Feral Fang improves damage, Wellspring improves Focus regeneration, Swift Feather improves running and grapple range, and Briar Heart retaliates when hit. Heartwood forging offers three party-wide upgrades. Companions can be replaced only near a bench or workbench.

The versioned save records party health, progression, inventory, charms, discoveries, claimed rewards, defeated creatures, story notes, endings, and a room checkpoint. Reloading starts at that checkpoint; it does not preserve the exact midair position or a guardian’s partial health. Autosaves happen during play and at room changes, rewards, resting, crafting, and leaving. An older arena save is not used by the new campaign.

## Validation

```sh
npm run build
npm run check
npm test
npm run test:browser
```

`npm run check` checks every source file and verifies the committed browser bundle matches source. Node tests cover locomotion, party behavior, elemental skills, campaign topology, ability gates, actual rift collision, grapple physics, the persistent bridge, crafting transactions, unique rewards, wipes, save validation, guardian phases, and input-driven complete campaign runs with all eight starting leads. The original isolated locomotion training fixture remains for regression tests; it is not exposed as a game mode.

The Chromium suite starts its own temporary server. It exercises story dialogue, keyboard traversal, a guardian fight, rewards, save/reload, recruitment, inventory, atlas, pause, all biome and guardian renderers, touch movement, a 390-pixel layout, and nested `/poketest/` hosting. Later-biome rendering checkpoints are earned by the input-driven simulation controller. Screenshots go to ignored `test-results/`.

The browser suite uses `CHROMIUM_PATH`, system Chromium if available, or Playwright’s installed browser. On a fresh machine without Chromium, run `npx playwright install chromium`. Direct `file://` navigation may be restricted by managed browser policy; asset tests additionally verify every HTML and font URL against the filesystem and a repository hosting subpath.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/world.js` | Campaign graph, geometry, biomes, story, guardians, items, charms, ability rewards |
| `src/campaign.js` | Room state, progression, saves, fast combat, tools, crafting, recruitment, guardian AI |
| `src/training.js` | Shared locomotion/collision implementation and isolated regression fixture |
| `src/adventure.js` | Independent party resources, healing, original skills, statuses, minion AI |
| `src/designs.js` | Supplied creature identities, new companions, wild species |
| `src/creatures.js` | Original vector rigs and procedural animation |
| `src/world-render.js` | Parallax biome scenery, structures, unique guardian rigs, effects, camera |
| `src/main.js` | Campaign UI, dialogs, atlas, inventory, keyboard/touch controls, fixed-step loop |
| `src/render.js` | Shared canvas sizing and portraits |
| `src/style.css` | Responsive interface and locally bundled fonts |

Add a room to `ROOMS`, connect it through door objects, and supply geometry, inhabitants, anchors, and interactions. New biomes provide a palette and backdrop kind. Boss records supply health, lore, ability rewards, and companion unlocks; their attack patterns live in `CampaignEngine.updateBoss`. The browser only exposes a read-only `window.kinetic.snapshot()` for inspection.
