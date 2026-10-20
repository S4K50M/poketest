# Changelog

## Grounded tunnel routes

- Replaced long bottomless spans in gate roads and lower dungeon passages with continuous ground. Mandatory dungeon exits now follow the lower tunnel route.
- Preserved upper exploration routes and added wider landings and catch shelves, making missed jumps recoverable without changing movement or combat physics.
- Moved each gate’s first seeded Wellspring onto the lower passage while preserving its saved identifier.
- Refined the lower-route tunnel presentation around the new floor geometry. Boss difficulty, sparse healing, and gate death penalties remain unchanged.

## Wellsprings, gate resurrection, and tunnels

- Replaced healing benches with utility camps and two or three seeded Wellsprings per gate, placed inside the dungeons. Grounded entry automatically restores party health/Focus and binds the respawn point; each spring works once per attempt. The sanctuary hearth remains reusable.
- Added persistent Game Over with Retry and Save & Title. A wipe costs 10% of Lumens and reawakens that gate’s enemies, including bosses and minibosses, while preserving story progress and claimed rewards.
- Split current enemy defeat state from lifetime reward claims so resurrected enemies cannot duplicate first-victory payouts. Saved layouts, spring usage, and pending death survive reload.
- Replaced exposed floating-shelf scenery with enclosed cave backwalls, ceilings, strata, textured stone shelves, biome geology, and local lighting, preserving traversal collisions.

## Six dimensions and the descent

- Expanded from 18 to 42 rooms with vertical dungeons, branching high passages, deep vaults, loops, and 24 new story inscriptions. Replaced route arrows with a discovered-room atlas.
- Added twelve dimensional minibosses and four wild archetypes: Glass Marauder, Veilwasp, Graveburrower, and Chaincaster. Major bosses have 2.2× health, three phases, aimed volleys, sigils, rushes, and leaping shockwave slams.
- Removed guardian benches and free full-party victory healing; Focus healing now costs 40 and takes 72 frames. Wipes return to the last kindled waylight.
- Made E echo collection nonblocking; full field notes remain readable in World History, with repeat/reload reward protection.
- Enforced the mobile portrait rotation guard on home, menus, and gameplay.

[Documentation index](README.md) · [Project README](../README.md)

This records major implemented milestones. It is not a list of planned features.

## Combat cooldown update

- Added shared-party J/K/L repeat cooldowns, a shared offensive recovery window, and a single expiring follow-up queue.
- Increased individual art cooldowns; added shared art casting recovery, a Surge cooldown, and a limit on Overdrive swap pulses.
- Added HUD/touch countdowns and saved cooldown state to prevent swap, equip, room, and reload bypasses.

## Mobile landscape update

- Added a portrait rotate prompt that pauses play, releases held controls, and preserves open menus. Fullscreen/orientation locking is optional with manual rotation as the fallback.
- Reorganized thumb controls around movement, strike, jump, and dash; secondary recovery, loadout, exploration, and party actions live in a prioritized menu.
- Added landscape phone/tablet layouts, safe-area spacing, contextual buttons, and a dedicated rotation/multitouch browser suite.

## 4.0.0 · Momentum

[Implementation commit e3c2dd5](https://github.com/S4K50M/poketest/commit/e3c2dd509bcc308af4a7ce9a5b1b39e115d56578)

- Extracted a frame-driven CombatDirector with branching grounded strings, launchers, aerial routes, dash cancels, and juggling.
- Increased movement responsiveness and added progression-gated plunge, slide, aimed air dashes, and precise Rift evades.
- Added directional Guard, timed deflects, ripostes, guard breaks, Flow, and boss posture openings.
- Added twelve combat arts, two equipped slots, progression/mastery unlocks, shared Focus costs, and per-art cooldowns.
- Expanded playable, enemy, boss, and NPC animation; added capped elemental/background particles, camera impulses, and reduced motion.
- Added the Arsenal, frame reference, combat HUD, and mobile combat controls.
- Added v4 saves retaining v2/v3 progress and the original storage key.
- Verified 145 Node tests and three Chromium suites, including shield-buffer, lethal guard-break rescue, boss stun-lock, camera visibility, and mobile HUD-clearance regressions.

## 3.0.0 · The Ninth Memory

[Implementation commit cf2ffaf](https://github.com/S4K50M/poketest/commit/cf2ffaf2b354d4d305eb3bb5a30cda99ffc7ee36)

- Expanded the campaign with eight quest arcs, three covenants, optional dungeons, forbidden guardians, and true endings.
- Added talents, relic/armor equipment, merchants, individual companion mastery, world events, history, keepsakes, and the familiar.
- Added the six-page RPG chronicle, new creature/NPC/boss rigs, and persistent quest/gear/world-event state.
- Migrated original v2 campaign saves into the RPG format without losing the main journey.

## 2.x · Echoes of the Rift campaign

[Campaign milestone 8a9467a](https://github.com/S4K50M/poketest/commit/8a9467a)

- Replaced the former 1v1 arena with a single-player 2D platforming campaign.
- Introduced six biomes, main guardians, hidden branches, rescued companions, a three-member active party, and mid-fight switching.
- Added healing, tools, crafting, inventory, an atlas, ability gates, checkpoints, and browser-local saves.
- Retained an isolated shared-movement training fixture for regression testing rather than exposing it as a game mode.
