# Kinetic Monsters: The Ninth Memory

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

There are **18 rooms, six biomes, nine bosses, 11 companions, and 15 wild species**. The original eight companions are available from the start. Three new companions join after their guardians are freed.

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

## The Ninth Memory expansion

The sanctuary has seen ninety-nine expeditions. Iona’s living map knows every traveler. It does not know you. Investigate a century of unfinished promises through **eight quest lines**, four new story characters, ten gradually revealed history records, and three optional dungeons. Read inscriptions with E, speak to the quest giver to accept and turn in objectives, and pin a story in **N → Chronicles**. Completed field notes can be reread in World History. The original six-fragment campaign remains intact; optional bosses do not open main portals early.

- **The Clockwork Ossuary** branches from Pilgrim’s Furnace. Captain Cairn’s garden-filled armor shelters a borrowed dawn. Face **the Saint of Two Dawns**, a bronze saint with two masks and chained bells.
- **The Paper Moon** branches from the Sunken Stacks. Morrow Nine listens to voices trapped in living correspondence. Face **the Palimpsest**, a many-handed living book that eats the end of every goodbye.
- **Cradle Zero** branches from the Stillwood. Pip carries an egg with no remembered creature inside. The **Nullheart** awakens after both other forbidden guardians, the Hollow Sovereign, and a sworn covenant. Its attack pattern and narrative identity change with your oath.

Choose among the Lantern Compact (+1 party heart), the Drowned Choir (+20% Focus on direct hits), and the Unwritten (shorter dash recovery). The oath is permanent for that expedition. Each offers a different answer to the Worldheart’s fate; completing its stories improves its epilogue. The true endings follow the optional arc, beyond the original two main-campaign endings. Completing Pip’s story lets you carry the blank egg; after the true ending it hatches into a small familiar that assists nearby fights.

**N** opens six RPG pages: Chronicles, Talent Constellation, Reliquary, Soul Bonds, Covenants, and World History. The creature bestiary remains available inside the chronicle. Two talent points start your build. Spend them along Fang, Heart, and Thread; further points come from Bond levels, forbidden guardians, and world events. Talents alter actual damage, low-health execution, lifesteal, healing, inactive Focus regeneration, one survival chance per room, movement, loot range, and synergy.

Enemies drop persistent physical relics. Equip one relic and one armor item for the whole active party; equipment changes damage, incoming damage, movement, Focus recovery, and Surge gain. Unequipped items can be salvaged once for Lumens. Ora’s sanctuary shop trades finite stock for Lumens. Mythic equipment and story keepsakes reward the optional arcs.

Each companion gains independent mastery from its own attacks. At 80, 200, and 400 mastery it becomes Kindred, Soulbound, and Awakened, gaining damage and animated auras. Land hits to charge **Threefold Resonance**; press **R** at 100% to combine all living companions in a protected multi-hit burst, restore their Focus, and create orbiting projections. The burst cannot immediately refill itself.

Linger in a region path for fifteen seconds to encounter an aurora, meteor, or eclipse fracture. Three new echoes appear with readable attack tells. Clear them for a talent point, Lumens, and a flask. World-event victories persist; leaving a partially cleared event does not respawn its defeated enemies for farming. The new wild species are Candlewraiths, Clockscarabs, Oathbound sentinels, and Hushlings.

The version-3 save keeps the existing storage key and migrates version-2 campaigns, retaining party, fragments, inventory, discoveries, and defeated enemies. It adds quests, talents, equipment, companion mastery, covenant, reputation, history, ground loot, merchant stock, keepsakes, world events, and true endings. Save data stays in the browser; it is not account-backed.

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
| M / I / N | Atlas / inventory and crafting / RPG chronicle |
| R | Threefold Resonance Surge, when its gauge reaches 100% |
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

The original campaign save records party health, progression, inventory, charms, discoveries, claimed rewards, defeated creatures, story notes, endings, and a room checkpoint. Reloading starts at that checkpoint; it does not preserve the exact midair position or a guardian’s partial health. Autosaves happen during play and at room changes, rewards, resting, crafting, and leaving. An older arena save is not used by the new campaign.

## Validation

```sh
npm run build
npm run check
npm test
npm run test:browser
npm run test:rpg
```

`npm run check` checks every source file and verifies the committed browser bundle matches source. Node tests cover locomotion, party behavior, elemental skills, campaign topology, ability gates, actual rift collision, grapple physics, the persistent bridge, crafting transactions, unique rewards, wipes, save validation, guardian phases, and input-driven complete campaign runs with all eight starting leads. The original isolated locomotion training fixture remains for regression tests; it is not exposed as a game mode.

`npm run test:rpg` additionally exercises actual quest turn-ins, talent purchases, equipment, faction boons, merchant trades, v3 reloads, every forbidden boss rig, true endings, collected history, and mobile RPG screens. Its later checkpoints are earned by completing all eight optional arcs through inputs.

The Chromium suite starts its own temporary server. It exercises story dialogue, keyboard traversal, a guardian fight, rewards, save/reload, recruitment, inventory, atlas, pause, all biome and guardian renderers, touch movement, a 390-pixel layout, and nested `/poketest/` hosting. Later-biome rendering checkpoints are earned by the input-driven simulation controller. Screenshots go to ignored `test-results/`.

The browser suite uses `CHROMIUM_PATH`, system Chromium if available, or Playwright’s installed browser. On a fresh machine without Chromium, run `npx playwright install chromium`. Direct `file://` navigation may be restricted by managed browser policy; asset tests additionally verify every HTML and font URL against the filesystem and a repository hosting subpath.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/rpg.js` | RPG quests, equipment, talents, factions, mastery, world events, v2/v3 save migration |
| `src/chronicle.js` | Eight optional story arcs, covenants, new rooms/bosses/entities, ten history records |
| `src/rpg-data.js` | Talent trees, equipment modifiers, item rarities, merchant stock, bond ranks |
| `src/rpg-ui.js` | Quest journal, talent constellation, reliquary, soul bonds, history, covenants, merchant |
| `src/chronicle-art.js` | Animated original forbidden bosses, new minion rigs, world events |
| `src/rpg-render.js` | New NPC rigs, room landmarks, mastery auras, loot and the familiar |
| `src/rpg-world.js` | Additive campaign registry integration with stable original save identifiers |
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
