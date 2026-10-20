# Boss encounters

[Documentation index](README.md) · [Combat reference](combat.md) · [Project README](../README.md)

All **21 bosses have four named attacks**, individual phase sequences, and a distinct movement/combat identity. This guide describes the current action-RPG encounters; it does not reuse the original arena concept. Attack timing and geometry remain authoritative in the [major](../src/boss-major-moves.js), [gatekeeper](../src/boss-warden-moves.js), and [vault](../src/boss-reaver-moves.js) profiles.

## How to read a fight

Open the bestiary from the Chronicle to expand **Attack Field Notes** for any guardian. Each entry lists its four moves, counterplay, and combat identity.

A move first displays its name, avoidance hint, and danger geometry. Warning areas do not damage you; the active shape does. Dashes commit to a position, leaving room to evade after the tell. Recovery is the opening to attack or commit to Focus healing. Phase II begins at two-thirds health and phase III at one-third; their sequences change pressure rather than removing every opening.

Temporary roots, ice, metal, water, and memory tiles are real one-way landings. Jump onto them from below when a floor attack calls for elevation. The existing tunnel floor remains beneath the fight. Summoned enemies add pressure but do not grant farmable XP, materials, or story progress. Arena hazards, summons, and temporary terrain expire with the encounter.

Use shield/parry against ordinary frontal hits. A marked unblockable attack requires movement or dash timing. Late optional/final execution moves use a long explicit warning and an escape route; connecting can defeat the active companion outright. Early moss encounters require only the starting jump, dash, and shield, not double jump.

## Main guardians

### Main guardians

| Boss | Four signature attacks | Combat identity |
| --- | --- | --- |
| The Briar Matron | Root Comb (jump) · Living Nursery (minions) · Mother’s Embrace (get-close) · Heartwood Bound (dodge) | An area-control mother grows root lanes, protects a living nursery, then leaves the heart of her embrace safe. |
| Saint Bellows | Censer Crusher (behind) · Resonant Peal (get-close) · Open the Grates (dodge) · Coal Communion (get-close) | A heavy bell saint alternates close hammer sweeps, concentric sound, furnace grates, and lobbed cinders. |
| The Ink Leviathan | Low Tide, High Water (platform) · Abyssal Inhale (retreat) · Ink Constellation (dodge) · Archive Breach (dodge) | A tidal body changes the usable floor with low water jets, creates lifeboat ledges, vacuums swimmers, and breaches across the chamber. |
| The Storm Conductor | Wingbeat Cadence (dodge) · Forked Verdict (dodge) · Thunderstaff (jump) · The Lost Choir (minions) | A winged duelist uses aerial crossing dives, forked sky-lanes, rhythmic thunder chords, and a summoned airborne choir. |
| The Hourglass Stag | Rewind Gallop (jump) · The Second Hand (platform) · Stolen Seconds (dodge) · Frozen Constellation (dodge) | The stag makes visible echoes of locked positions, reverses a gallop, freezes delayed mines, and rewrites its chamber into ice steps. |
| The Hollow Sovereign | Worldcleaver (behind) · Break the Throne (dodge) · Orbit of Ruin (shield) · Trial of the Worldheart (platform) | A giant sword ruler combines directional cleaves, crushing throne charges, orbiting crown shards, and a terrain-changing heart trial. |

### Gatekeepers

| Boss | Four signature attacks | Combat identity |
| --- | --- | --- |
| The Rootbound Executioner | Timber Verdict (behind) · Gallows Heel (jump) · Hangman’s Descent (dodge) · Chainroot Prison (minions) | A rooted executioner commits its enormous axe to long frontal cuts, low heel tremors and marked landing chops. Get behind the axe and punish the recovery. |
| The Furnace Bailiff | Piston Writ (behind) · Checkerboard Foundry (dodge) · Vacuum Contempt (retreat) · Redline Appeal (platform) | A furnace magistrate fights like a hydraulic press: a massive piston strike, checkerboard vent lanes, suction before a crushing hammer, and a pressurized leap. |
| The Drowned Gaoler | Undertow Warrant (retreat) · Shackle Harpoons (shield) · Drowning Cells (dodge) · Breaker Arrest (jump) | A mobile jailer uses a real inward current, rooting harpoons, delayed prison walls and an arcing arrest. The water moves you before its chains close. |
| The Thunder Magistrate | Three-Count Indictment (jump) · Ion Brand (dodge) · Judgment Lance (jump) · Ascendant Circuit (get-close) | The magistrate is a fast spear duelist. Its announced zigzag lunges, staggered lightning brands, long judgment lance and storm-ring landing demand different dodges. |
| The Meridian Headsman | Meridian Drop (dodge) · Rewind Sentence (jump) · Clock-Ice Flood (platform) · Stasis Jury (minions) | A patient headsman seals old positions in falling ice, rewinds into a cutting rush, raises escape blocks above a freezing floor and calls clockscarabs into a slow-time court. |
| The Hollow Witness | Split Testimony (dodge) · Oath Inversion (behind) · Fracture Bridge (platform) · Eye of Unmaking (dodge) | The witness fights through reflected positions: staggered phantom cuts, a warned side inversion, fractured footholds and an aerial eye that fires downward execution rays. |

### Vault reavers

| Boss | Four signature attacks | Combat identity |
| --- | --- | --- |
| The Carrion Gardener | Seed Testament (dodge) · Funeral Orchard (minions) · Root Harrow (get-close) · Compost Cathedral (platform) | A patient mine-layer that grows a living nursery and turns the floor into a spore garden. |
| The Cinder Confessor | Shrapnel Stampede (jump) · Confession Chain (dodge) · Mortar Requiem (behind) · Ashen Absolution (platform) | A furnace beast that ricochets through powder charges, leaps like a mortar, and alternates low and high fire lanes. |
| The Page-Eater | Bookmaw Undertow (behind) · Boundless Breach (dodge) · Ink Pagination (shield) · Archive Hunger (minions) | A swimming archive predator that vacuums prey into its bookmaw, breaches across the room, and feeds on a shoal of inkfish. |
| The Bellbreaker | Broken Metronome (dodge) · Resonant Ruin (jump) · Silence Scream (get-close) · Last Toll — Execution (platform) | An aerial duelist: rapid zigzag dives, delayed sonic traps, a hollow scream, and a final toll that must be escaped vertically. |
| The White Mourner | Hollow Halo (get-close) · White Lattice (get-close) · Last Warmth (platform) · Funeral Flight (dodge) | A snow-winged trapper that makes hollow ice lattices and temporary refuges, then hunts between them with diving passes. |
| The Unwritten Butcher | Unfinished Sentence (behind) · Twin Guillotines (retreat) · Erased Causeway (platform) · Future Erasure — Execution (dodge) | A spatial executioner that telegraphs its future locations, cuts with giant cleavers, and erases floor lanes beneath temporary memory tiles. |

### Forbidden guardians

| Boss | Four signature attacks | Combat identity |
| --- | --- | --- |
| The Saint of Two Dawns | Yesterday’s Toll (jump) · Tomorrow’s Answer (dodge) · Dawn Procession (minions) · Two Suns (jump) | Two saints alternate low and high bell rhythms, recruit candle attendants, and grow a paired dawn rather than copying the furnace saint. |
| The Palimpsest | Redaction (dodge) · Folded Margins (get-close) · Punctuation Storm (dodge) · Full Stop (platform) | A living book edits the arena with parallel redactions, closing margins, flying punctuation, and a lethal final full stop. |
| The Nullheart | Oath Unraveled (dodge) · Zero Horizon (platform) · Empty Cradles (minions) · Future Collapse (dodge) | The chosen covenant rewrites memory cascades, the first chorus, or mirrored futures; the final cradle has its own summoned court and a horizon execution. |

## Progression and persistence

The six main guardians still return the six heart fragments and their existing abilities/companions. Gatekeepers seal the dimensional nexus route; vault reavers are optional. The Saint of Two Dawns and Palimpsest remain optional chronicle guardians. The final cradle encounter requires both of them, the Hollow Sovereign, and a chosen covenant; its mechanics resolve that covenant’s final form.

Moves, hazards, summoned enemies, and temporary tiles are not written into a save. Reloading reconstructs the room from persistent progression. A full-party wipe retains the existing Lumen penalty and gate resurrection rules. Returning enemies cannot repay unique first-victory rewards. See [save format](save-format.md) for the checkpoint and reward contracts.

## Verify or extend an encounter

Run `npm run build`, `npm run check`, `npm test`, and `npm run test:bosses` after changing attacks. The focused suite uses port 3200 by default; override `BOSS_TEST_PORT` when needed. Browser artifacts live under ignored `test-results/`. Read [content authoring](content-authoring.md#add-a-boss) for profiles and event primitives, and [testing](testing.md#boss-encounter-regressions) for simulation, counterplay, cleanup, and real-input progression checks.
