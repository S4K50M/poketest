# Changelog

[Documentation index](README.md) · [Project README](../README.md)

This records major implemented milestones. It is not a list of planned features.

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
