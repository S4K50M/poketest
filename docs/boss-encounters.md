# Boss encounters

[Documentation index](README.md) · [Combat reference](combat.md) · [Project README](../README.md)

All **21 bosses have six named attacks**, individual phase sequences, and a distinct movement/combat identity. This guide describes the current action-RPG encounters; it does not reuse the original arena concept. Attack timing and geometry remain authoritative in the [major](../src/boss-major-moves.js), [gatekeeper](../src/boss-warden-moves.js), and [vault](../src/boss-reaver-moves.js) profiles, extended by each boss’s two [oath armaments](../src/boss-overdrive-moves.js).

## How to read a fight

Open the bestiary from the Chronicle to expand **Attack Field Notes** for any guardian. Each entry lists its six moves, counterplay, and combat identity.

A move first displays its name, avoidance hint, and danger geometry. Warning areas do not damage you; the active shape does. Dashes commit to a position, leaving room to evade after the tell. Recovery is the opening to attack or commit to Focus healing. Phase II begins at 70% health, phase III at 40%, and the final last stand at 18%. The runtime also considers distance, recent attacks, and pressure, so memorizing one repeated sequence is insufficient.

Temporary roots, ice, metal, water, and memory tiles are real one-way landings. Jump onto them from below when a floor attack calls for elevation. The existing tunnel floor remains beneath the fight. Summoned enemies add pressure but do not grant farmable XP, materials, or story progress. Arena hazards, summons, and temporary terrain expire with the encounter.

Use shield/parry against ordinary frontal hits. A marked unblockable attack requires movement or dash timing. Late optional/final execution moves use a long explicit warning and an escape route; connecting can defeat the active companion outright. Early moss encounters require only the starting jump, dash, and shield, not double jump.

## Pressure and punish windows

Two repeated, identical grounded heavies at close range can teach a boss to reposition. A 22–24-frame warning announces the response, and its guard comes up after six frames. The readied guard reduces that recognized frontal heavy to 30% damage and little posture gain. Its response can recur after a 96-active-frame cooldown. Light attacks, another attack route, aerial hits, rear hits, and ripostes retain their normal damage. Recovery, healing, and phase-change states are also open to damage.

Read the warned shape before chasing the escape: anchored bodies use a low breakaway, weapon users cut their facing side, flyers mark a dive lane, and skirmishers threaten a crossing area. Ordinary flinches cannot repeatedly cancel that commitment; parries and posture breaks can interrupt it. Mixed strings, aerial attacks, and a parry riposte reset the repeated-heavy read.

Posture breaks earn a short combo opening: 24 stun frames and a 36-frame recovery. A 180-active-frame posture lock prevents that opening from immediately rebuilding into another break; return to spacing and defense as the boss recovers. Strong knockback can separate the combatants and cancel a heavy even when a bulky companion has startup armor. Armor still halves the hit’s damage. Recover your position before committing to the next swing.

Phase changes and oath techniques can assemble a three-plate frontal shield. A grounded jab consumes one plate and a grounded heavy consumes two, dealing 30% chip while blocked. An aerial hit, rear hit, elemental L technique, or parried riposte shatters the ward and deals full damage. The plate count and summoned armament are visible on the body. Shields expire and reset with the attempt; they never grant unconditional invulnerability.

## Escalation and desperation

Boss progression follows the dimension and encounter role, independently of player level. The six main guardians occupy ranks one through six; the Saint of Two Dawns is rank four, Palimpsest rank five, and Nullheart rank seven. Boss locomotion uses a 2.25× baseline multiplier, separate from the 1.8× attack-tempo multiplier. Health scales from 1.55× at rank one to 1.91× at rank seven, on top of the existing authored health rule. Damage scales from 1.12× by 0.045 per rank; each rank adds 1.8% to both timing multipliers. Patrols move faster, and dash, leap, counter, and phase-breakaway movement durations shorten using the movement multiplier. Event timing, active windows, and ordinary recovery shorten using attack tempo. The health multiplier applies on top of the authored guardian/miniboss health rule. Later guardians therefore add pressure without scaling away the benefit of player preparation.

Warnings and punish opportunities remain: actual move startup is at least 22 frames, execution startup at least 90, danger-zone warning delay at least 12, and ordinary move recovery at least 18. Phase changes also have a marked 24-frame breakaway warning. Early bosses establish this rhythm without a self-heal.

Every boss enters frenzy at or below 40% health and a last stand at or below 18%; tier-four and later bosses additionally retain their limited healing. A marked 24-frame warning leads into a quick breakaway; desperation grants an irreversible 18% damage and 12% movement/attack-tempo boost, alongside four authored phase patterns. The last stand adds another 16% to movement/attack tempo and 15% damage; healing cannot reverse these phase bonuses. When given more than 190 world units of room below that threshold, a tier-four-or-later boss can attempt one 100-frame **Rekindle** channel that restores 9% of maximum health. A heavy strike or riposte interrupts it and grants a 70-frame recovery; an interrupted attempt is still spent. Watch the boss’s state and punish the channel rather than allowing a distant, uninterrupted recovery.

## Guardian introductions and endings

The six fragment guardians and three forbidden guardians have a 6.5-second, skippable introduction before control returns to the chamber. Each physically enters or forms in its arena: roots unfurl, fire ignites, ink breaches, wings descend, time reassembles, and broken forms gather. The 9-second ending cinematic reflects the main ending choice or covenant. **Skip Scene**, Space, Enter, E, or Escape skips the presentation; portrait rotation, window blur, and hidden tabs hold its clock. Reduced motion retains complete still compositions and story captions.

An introduction plays once for that boss in the loaded expedition session. Retrying the same encounter during the session does not repeat it. Continue or a page reload begins a new session; defeated bosses do not trigger a fight introduction. The main finale follows the restore/release choice requested with E at the exposed Worldheart and precedes credits. E at the defeated Nullheart’s remains begins the covenant finale and then its true-ending summary. Continue resumes exploration after either ending without reopening a summary. Unfinished ending interactions stay available in the world; scenes do not replace or replay saved decisions.

These presentations pause combat rather than leaving an enemy attack running behind the scene. Held inputs are cleared before control returns. Normal NPC speech and passing boss lines remain part of the live world.

## Defeat transformations and lore

Major and forbidden guardian rewards unlock immediately, with a HUD notice instead of a blocking victory dialog. Their 4.8-second defeat transformations leave readable scenery. E at a landmark starts scene dialogue; E at the Worldheart requests an unfinished ending choice, and E at the Open Cradle requests its covenant finale. Progression does not wait for an animation or a lore read.

| Guardian | What remains |
| --- | --- |
| Briar Matron | The Matron’s Memory Tree: armor roots into a living, leafy tree |
| Saint Bellows | The Last Ember Censer: the saint burns down to ash and a gentle flame |
| Ink Leviathan | The Open Ink Archive: a luminous ink pool and released pages |
| Storm Conductor | The Silent Sky Perch: a stormglass feather after it flies away, saying “I will return” |
| Hourglass Stag | The Clock That Chose Tomorrow: antlers around a motionless clock |
| Hollow Sovereign | The Awakened Worldheart: an opened crown around living light |
| Saint of Two Dawns | The Garden of Two Dawns: bronze shells shelter a lantern greenhouse |
| Palimpsest | The Unburned Goodbye: paper boats and an open, recovered page |
| Nullheart | The Open Cradle: the orbiting cages rest around a new beginning |

These landmarks rebuild from existing defeat records on revisit or reload, using a stable authored room anchor. A living guardian revived by a gate death hides its old remains until defeated again. Lore reads and repeat victories cannot duplicate unique rewards. Reduced motion shows the settled form immediately.

## Boss roster

### Main guardians

| Boss | Six signature attacks | Combat identity |
| --- | --- | --- |
| The Briar Matron | Root Comb (jump) · Living Nursery (minions) · Mother’s Embrace (get-close) · Heartwood Bound (dodge) · Crown of the First Thorn (behind) · Seedstorm Rebellion (dodge) | An area-control mother grows root lanes, protects a living nursery, then leaves the heart of her embrace safe. |
| Saint Bellows | Censer Crusher (behind) · Resonant Peal (get-close) · Open the Grates (dodge) · Coal Communion (get-close) · Cathedral Anvil (jump) · Ash Pilgrimage (dodge) | A heavy bell saint alternates close hammer sweeps, concentric sound, furnace grates, and lobbed cinders. |
| The Ink Leviathan | Low Tide, High Water (platform) · Abyssal Inhale (retreat) · Ink Constellation (dodge) · Archive Breach (dodge) · Trident of the Unread (behind) · Inverted Rain (dodge) | A tidal body changes the usable floor with low water jets, creates lifeboat ledges, vacuums swimmers, and breaches across the chamber. |
| The Storm Conductor | Wingbeat Cadence (dodge) · Forked Verdict (dodge) · Thunderstaff (jump) · The Lost Choir (minions) · Lightning Rapier (behind) · The Silent Cadenza (dodge) | A winged duelist uses aerial crossing dives, forked sky-lanes, rhythmic thunder chords, and a summoned airborne choir. |
| The Hourglass Stag | Rewind Gallop (jump) · The Second Hand (platform) · Stolen Seconds (dodge) · Frozen Constellation (dodge) · Minute Scythe (jump) · Three Futures (dodge) | The stag makes visible echoes of locked positions, reverses a gallop, freezes delayed mines, and rewrites its chamber into ice steps. |
| The Hollow Sovereign | Worldcleaver (behind) · Break the Throne (dodge) · Orbit of Ruin (shield) · Trial of the Worldheart (platform) · Seven Oathblades (dodge) · The Uncrowned March (behind) | A giant sword ruler combines directional cleaves, crushing throne charges, orbiting crown shards, and a terrain-changing heart trial. |

### Gatekeepers

| Boss | Six signature attacks | Combat identity |
| --- | --- | --- |
| The Rootbound Executioner | Timber Verdict (behind) · Gallows Heel (jump) · Hangman’s Descent (dodge) · Chainroot Prison (minions) · Hook and Bloom (behind) · Timber Corridor (dodge) | A rooted executioner commits its enormous axe to long frontal cuts, low heel tremors and marked landing chops. Get behind the axe and punish the recovery. |
| The Furnace Bailiff | Piston Writ (behind) · Checkerboard Foundry (dodge) · Vacuum Contempt (retreat) · Redline Appeal (platform) · The Forge Press (dodge) · Chain of Debt (retreat) | A furnace magistrate fights like a hydraulic press: a massive piston strike, checkerboard vent lanes, suction before a crushing hammer, and a pressurized leap. |
| The Drowned Gaoler | Undertow Warrant (retreat) · Shackle Harpoons (shield) · Drowning Cells (dodge) · Breaker Arrest (jump) · Coral Pike (behind) · Drowned Cells (dodge) | A mobile jailer uses a real inward current, rooting harpoons, delayed prison walls and an arcing arrest. The water moves you before its chains close. |
| The Thunder Magistrate | Three-Count Indictment (jump) · Ion Brand (dodge) · Judgment Lance (jump) · Ascendant Circuit (get-close) · Writ of the Sky (behind) · Three Verdicts (dodge) | The magistrate is a fast spear duelist. Its announced zigzag lunges, staggered lightning brands, long judgment lance and storm-ring landing demand different dodges. |
| The Meridian Headsman | Meridian Drop (dodge) · Rewind Sentence (jump) · Clock-Ice Flood (platform) · Stasis Jury (minions) · Meridian Edge (jump) · Pale Procession (platform) | A patient headsman seals old positions in falling ice, rewinds into a cutting rush, raises escape blocks above a freezing floor and calls clockscarabs into a slow-time court. |
| The Hollow Witness | Split Testimony (dodge) · Oath Inversion (behind) · Fracture Bridge (platform) · Eye of Unmaking (dodge) · Mirror Saber (behind) · The Unseen Stair (platform) | The witness fights through reflected positions: staggered phantom cuts, a warned side inversion, fractured footholds and an aerial eye that fires downward execution rays. |

### Vault reavers

| Boss | Six signature attacks | Combat identity |
| --- | --- | --- |
| The Carrion Gardener | Seed Testament (dodge) · Funeral Orchard (minions) · Root Harrow (get-close) · Compost Cathedral (platform) · Carrion Scythe (behind) · Bone Orchard (dodge) | A patient mine-layer that grows a living nursery and turns the floor into a spore garden. |
| The Cinder Confessor | Shrapnel Stampede (jump) · Confession Chain (dodge) · Mortar Requiem (behind) · Ashen Absolution (platform) · Absolution Flail (retreat) · Fire Walk (dodge) | A furnace beast that ricochets through powder charges, leaps like a mortar, and alternates low and high fire lanes. |
| The Page-Eater | Bookmaw Undertow (behind) · Boundless Breach (dodge) · Ink Pagination (shield) · Archive Hunger (minions) · Rib Trident (behind) · Stolen Endings (jump) | A swimming archive predator that vacuums prey into its bookmaw, breaches across the room, and feeds on a shoal of inkfish. |
| The Bellbreaker | Broken Metronome (dodge) · Resonant Ruin (jump) · Silence Scream (get-close) · Last Toll — Execution (platform) · Sunder Mace (behind) · The Struck Sky (dodge) | An aerial duelist: rapid zigzag dives, delayed sonic traps, a hollow scream, and a final toll that must be escaped vertically. |
| The White Mourner | Hollow Halo (get-close) · White Lattice (get-close) · Last Warmth (platform) · Funeral Flight (dodge) · Widow’s Needle (behind) · The Last Winter (get-close) | A snow-winged trapper that makes hollow ice lattices and temporary refuges, then hunts between them with diving passes. |
| The Unwritten Butcher | Unfinished Sentence (behind) · Twin Guillotines (retreat) · Erased Causeway (platform) · Future Erasure — Execution (dodge) · The Unmade Edge (behind) · Roads Not Taken (dodge) | A spatial executioner that telegraphs its future locations, cuts with giant cleavers, and erases floor lanes beneath temporary memory tiles. |

### Forbidden guardians

| Boss | Six signature attacks | Combat identity |
| --- | --- | --- |
| The Saint of Two Dawns | Yesterday’s Toll (jump) · Tomorrow’s Answer (dodge) · Dawn Procession (minions) · Two Suns (jump) · Solar Scissors (jump) · Evening Garden (dodge) | Two saints alternate low and high bell rhythms, recruit candle attendants, and grow a paired dawn rather than copying the furnace saint. |
| The Palimpsest | Redaction (dodge) · Folded Margins (get-close) · Punctuation Storm (dodge) · Full Stop (platform) · Quill of Lost Names (behind) · Paper Causeway (platform) | A living book edits the arena with parallel redactions, closing margins, flying punctuation, and a lethal final full stop. |
| The Nullheart | Oath Unraveled (dodge) · Zero Horizon (platform) · Empty Cradles (minions) · Future Collapse (dodge) · The Unwritten Saber (behind) · Permission to Begin (dodge) | The chosen covenant rewrites memory cascades, the first chorus, or mirrored futures; the final cradle has its own summoned court and a horizon execution. |

## Progression and persistence

The six main guardians still return the six heart fragments and their existing abilities/companions. Gatekeepers seal the dimensional nexus route; vault reavers are optional. The Saint of Two Dawns and Palimpsest remain optional chronicle guardians. The final cradle encounter requires both of them, the Hollow Sovereign, and a chosen covenant; its mechanics resolve that covenant’s final form.

Moves, hazards, summoned enemies, and temporary tiles are not written into a save. Reloading reconstructs the room from persistent progression. A full-party wipe retains the existing Lumen penalty and gate resurrection rules. Returning enemies cannot repay unique first-victory rewards. See [save format](save-format.md) for the checkpoint and reward contracts.

## Verify or extend an encounter

Run `npm run build`, `npm run check`, `npm test`, and `npm run test:bosses` after changing attacks. Use `npm run test:boss-upgrade` for cinematic/pressure lifecycle and `npm run test:aftermath` for guardian remains, rewards, E lore, and ending access. `test:bosses` uses port 3200 by default; override `BOSS_TEST_PORT` when needed. Browser artifacts live under ignored `test-results/`. Read [content authoring](content-authoring.md#add-a-boss) for profiles and event primitives, and [testing](testing.md#boss-encounter-regressions) for simulation, counterplay, cleanup, and real-input progression checks.
